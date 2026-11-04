import { DOMParser, type Element as XmlElement } from "@xmldom/xmldom";
import svgpath from "svgpath";
import { svgPathBbox } from "svg-path-bbox";
import paper from "paper";
import { getValidCanvaAccessToken } from "@/lib/canva/oauth";
import { placeWordsOnOneLine } from "./word-layout";

const API = "https://api.canva.com/rest/v1";
const PAGE: Record<string, number> = { PF01: 1, PF02: 2, PF03: 3, PF04: 4, PF05: 5, PF06: 6, PF07: 7, PF08: 8 };
type Job = { job?: { id?: string; status?: string; result?: { design?: { id?: string } }; urls?: string[]; error?: { message?: string } } };
type Outline = { path: string; bounds: { x1: number; y1: number; x2: number; y2: number }; fillRule: "nonzero" | "evenodd" };

// Script letters can overlap in Canva. Cricut otherwise cuts the shared edges
// inside the word. Unite each glyph's filled shape while keeping its counters.
function weldGlyphs(pathData: string): string {
  const scope = new paper.PaperScope();
  scope.setup(new scope.Size(1, 1));
  try {
    const source = new scope.CompoundPath(pathData);
    const contours = source.children as paper.Path[];
    if (!contours.length) throw new Error("Canva returned no closed glyph contours.");
    const outer = contours.reduce((largest, contour) =>
      Math.abs(contour.area) > Math.abs(largest.area) ? contour : largest);
    const outerSign = Math.sign(outer.area);
    if (!outerSign) throw new Error("Canva returned a zero-area glyph contour.");
    const glyphs: paper.CompoundPath[] = [];
    let glyph: paper.CompoundPath | undefined;
    for (const contour of contours) {
      if (Math.sign(contour.area) === outerSign) {
        glyph = new scope.CompoundPath("");
        glyph.addChild(contour.clone());
        glyphs.push(glyph);
      } else if (glyph) {
        glyph.addChild(contour.clone());
      } else {
        throw new Error("Canva returned a counter without a letter outline.");
      }
    }
    let welded: paper.PathItem = glyphs[0];
    for (const next of glyphs.slice(1)) {
      const joined = welded.unite(next, { insert: false });
      welded.remove();
      next.remove();
      welded = joined;
    }
    if (!welded.pathData) throw new Error("Could not weld the font outlines for cutting.");
    return welded.pathData;
  } finally {
    scope.project.remove();
  }
}

async function canva<T>(token: string, endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}${endpoint}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`Canva request failed (${response.status}). Check the Canva connection and template access.`);
  return response.json() as Promise<T>;
}

async function waitForJob(token: string, endpoint: string): Promise<Job["job"]> {
  for (let i = 0; i < 30; i++) {
    const data = await canva<Job>(token, endpoint);
    if (data.job?.status === "success") return data.job;
    if (data.job?.status === "failed") throw new Error(data.job.error?.message || "Canva job failed.");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Canva timed out while preparing the cut outline.");
}

// Only accept SVG path geometry. If Canva flattened a text effect into an image,
// or the PDF converter did not produce valid outlines, fail closed.
export function extractOutline(svg: string): Outline {
  const errors: string[] = [];
  const doc = new DOMParser({ onError: (level, message) => { if (level === "error" || level === "fatalError") errors.push(message); } }).parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (errors.length || !root || root.localName !== "svg") throw new Error("Canva PDF conversion produced invalid SVG.");
  const viewBox = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || viewBox.some(v => !Number.isFinite(v)) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    throw new Error("Canva returned a vector page without valid dimensions.");
  }
  const paths: string[] = [];
  let rule: "nonzero" | "evenodd" | null = null;
  function visit(node: XmlElement, parentTransforms: string[]) {
    const tag = node.localName || node.tagName;
    if (["title", "desc", "metadata"].includes(tag)) return;
    if (tag === "defs" && node.getElementsByTagName("*").length === 0) return;
    if (tag !== "svg" && tag !== "g" && tag !== "path") {
      throw new Error(`Canva export contains ${tag} rather than text outlines. Remove effects/backgrounds from the font template.`);
    }
    if (node.hasAttribute("clip-path") || node.hasAttribute("mask") || node.hasAttribute("filter") || node.hasAttribute("opacity")) {
      throw new Error("Canva export contains clipping or effects that cannot be safely used as cut paths.");
    }
    const transforms = node.hasAttribute("transform") ? [node.getAttribute("transform")!, ...parentTransforms] : parentTransforms;
    if (tag === "path") {
      const data = node.getAttribute("d") || "";
      if (!data || !/[zZ]/.test(data)) throw new Error("Canva returned an open or empty path.");
      const fill = node.getAttribute("fill");
      if (fill === "none") throw new Error("Canva returned a stroke-only shape instead of filled glyphs.");
      let transformed = svgpath(data);
      for (const transform of transforms) transformed = transformed.transform(transform);
      transformed = transformed.abs().round(5);
      const segments: string[] = [];
      transformed.iterate(segment => { segments.push(segment[0]); });
      const [px1, py1, px2, py2] = svgPathBbox(transformed.toString());
      const white = /^#(?:fff|ffffff)$/i.test((fill || "").trim());
      const fullPage = Math.abs(px1 - viewBox[0]) < 0.02 && Math.abs(py1 - viewBox[1]) < 0.02 &&
        Math.abs(px2 - viewBox[0] - viewBox[2]) < 0.02 && Math.abs(py2 - viewBox[1] - viewBox[3]) < 0.02;
      const rectangle = segments.length === 5 && ["M", "L", "L", "L", "Z"].every((command, index) => segments[index] === command);
      if (white && fullPage && rectangle) return; // Canva PDF page backgrounds are not cut designs.
      if (white) throw new Error("Canva export contains a white shape other than the page background.");
      const pathRule = node.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero";
      if (rule && rule !== pathRule) throw new Error("Canva returned mixed fill rules that cannot be merged into one cut design.");
      rule = pathRule;
      paths.push(transformed.toString());
      return;
    }
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1) visit(child as XmlElement, transforms);
    }
  }
  visit(root, []);
  if (!paths.length) throw new Error("Canva returned no cut paths for this text.");
  const path = weldGlyphs(paths.join(" "));
  const [x1, y1, x2, y2] = svgPathBbox(path);
  if (![x1, y1, x2, y2].every(Number.isFinite) || x2 <= x1 || y2 <= y1) throw new Error("Canva returned invalid outline bounds.");
  return { path, bounds: { x1, y1, x2, y2 }, fillRule: rule || "nonzero" };
}

async function renderCanvaOutline(content: string, fontCode: string, token: string): Promise<Outline> {
  const page = PAGE[fontCode];
  const designId = process.env.CANVA_VINYL_DESIGN_ID;
  if (!page || !designId) throw new Error("The Canva vinyl font template is not configured for this font.");
  // The existing template has VINYL_TEXT on all eight pages, one text object on each.
  const job = await canva<Job>(token, "/autofills", {
    type: "create_from_design", design_id: designId,
    data: { VINYL_TEXT: { type: "text", text: content } },
    title: `PurelyJid Cut - ${content.slice(0, 50)}`,
  });
  if (!job.job?.id) throw new Error("Canva did not create an autofill job.");
  const filled = await waitForJob(token, `/autofills/${encodeURIComponent(job.job.id)}`);
  const filledId = filled?.result?.design?.id;
  if (!filledId) throw new Error("Canva did not return the filled design.");
  const exportJob = await canva<Job>(token, "/exports", {
    design_id: filledId, format: { type: "pdf", export_quality: "pro", pages: [page] },
  });
  if (!exportJob.job?.id) throw new Error("Canva did not create a PDF export job.");
  const exported = await waitForJob(token, `/exports/${encodeURIComponent(exportJob.job.id)}`);
  const url = exported?.urls?.[0];
  if (!url || new URL(url).protocol !== "https:") throw new Error("Canva returned no secure PDF download URL.");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not download the Canva PDF (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 20 * 1024 * 1024 || bytes.byteLength < 5 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("Canva did not return a valid PDF under 20 MB.");
  }
  const [{ transcodePdf }, { createNodePdfRuntime }] = await Promise.all([
    import("@/lib/cricut/pdf-transcoder.mjs"), import("@svgsketch/pdf/node"),
  ]);
  const vector = await transcodePdf(bytes, {
    // Supply a statically resolvable module import. The converter's default
    // file:// import can escape Next's server bundle on Windows deployments.
    runtime: createNodePdfRuntime({
      loadModule: () => import("pdfjs-dist/legacy/build/pdf.mjs"),
    }),
    textMode: "outline", layers: "flatten", pages: [1],
  });
  // Canva emits the Monarda font as Type3 glyph procedures. Its PDF marks an
  // unpainted space as "glyph-outline-missing" even though the visible vector
  // output is complete. Tolerate that diagnostic only up to the number of
  // whitespace characters in the requested text.
  const missing = vector.diagnostics.filter(d => d.code === "glyph-outline-missing")
    .reduce((sum, d) => sum + (d.count || 1), 0);
  const spaces = (content.match(/\s/g) || []).length;
  if (vector.stats.images > 0 || vector.stats.textsOutlined < vector.stats.texts ||
      vector.fonts.some(font => font.unmappableGlyphs > 0) || missing > spaces ||
      vector.fonts.some(font => font.glyphsShown > 0 && !font.outlined && !font.isType3)) {
    throw new Error("Canva PDF did not provide complete vector font outlines. Remove effects or use a different font page.");
  }
  return extractOutline(vector.svg);
}

export async function generateCanvaOutline(content: string, fontCode: string): Promise<Outline> {
  const token = await getValidCanvaAccessToken();
  const words = content.trim().split(/\s+/u);
  if (words.length === 1) return renderCanvaOutline(content, fontCode, token);
  // The fixed Canva template wraps at spaces before our requested physical
  // width is applied. Export each distinct word and compose a single vector
  // line; keep calls bounded to avoid flooding Canva's asynchronous jobs.
  const unique = [...new Set(words)];
  const outlines = new Map<string, Outline>();
  for (let index = 0; index < unique.length; index += 3) {
    const batch = unique.slice(index, index + 3);
    const rendered = await Promise.all(batch.map(word => renderCanvaOutline(word, fontCode, token)));
    batch.forEach((word, i) => outlines.set(word, rendered[i]));
  }
  return placeWordsOnOneLine(words.map(word => outlines.get(word)!));
}
