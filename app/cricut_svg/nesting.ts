import svgpath from "svgpath";
import { svgPathBbox } from "svg-path-bbox";

export const MAT_W = 110; // millimetres
export const MAT_H = 160;
// Cricut Joy's 4.5 × 6.5 in mat has a smaller actual cutting area.
export const CUT_W = 107.95;
export const CUT_H = 158.75;

export type Design = {
  id: string;
  sequence: number;
  content: string;
  fontCode: string;
  path: string;
  fillRule?: "nonzero" | "evenodd";
  bounds: { x1: number; y1: number };
  scale: number;
  width: number;
  height: number;
};

export type Placement = { design: Design; x: number; y: number; rotated: boolean; width: number; height: number };
export type Mat = { placements: Placement[]; free: Rect[] };
type Rect = { x: number; y: number; w: number; h: number };
type Candidate = { mat: number; free: Rect; rotated: boolean; width: number; height: number; score: number };
const EPS = 1e-7;

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w - EPS && b.x < a.x + a.w - EPS &&
    a.y < b.y + b.h - EPS && b.y < a.y + a.h - EPS;
}

function contains(a: Rect, b: Rect) {
  return a.x <= b.x + EPS && a.y <= b.y + EPS &&
    a.x + a.w >= b.x + b.w - EPS && a.y + a.h >= b.y + b.h - EPS;
}

// MaxRects: split *every* intersecting free region, then remove contained regions.
// Free regions may overlap each other, but no occupied rectangle intersects one.
function occupy(mat: Mat, used: Rect) {
  const next: Rect[] = [];
  for (const r of mat.free) {
    if (!intersects(r, used)) { next.push(r); continue; }
    if (used.x > r.x + EPS) next.push({ x: r.x, y: r.y, w: used.x - r.x, h: r.h });
    if (used.x + used.w < r.x + r.w - EPS) next.push({ x: used.x + used.w, y: r.y, w: r.x + r.w - used.x - used.w, h: r.h });
    if (used.y > r.y + EPS) next.push({ x: r.x, y: r.y, w: r.w, h: used.y - r.y });
    if (used.y + used.h < r.y + r.h - EPS) next.push({ x: r.x, y: used.y + used.h, w: r.w, h: r.y + r.h - used.y - used.h });
  }
  mat.free = next.filter((r, i) => r.w > EPS && r.h > EPS && !next.some((s, j) => i !== j &&
    (contains(s, r) && (j < i || !contains(r, s)))));
}

function shuffled(items: Design[], seed: number) {
  const copy = [...items];
  let state = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    const j = (state >>> 0) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initialOrder(designs: Design[], attempt: number, seed: number) {
  const order = attempt % 6;
  const perturb = (d: Design) => {
    let h = seed + d.sequence * 2654435761 + attempt * 1013904223;
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  };
  if (order === 5) return shuffled(designs, seed + attempt);
  return [...designs].sort((a, b) => {
    const score = (d: Design) => {
      if (order === 0) return d.width * d.height;
      if (order === 1) return Math.max(d.width, d.height);
      if (order === 2) return Math.min(d.width, d.height);
      if (order === 3) return d.height;
      return d.width * d.height * (0.75 + perturb(d) * 0.5);
    };
    return score(b) - score(a) || a.sequence - b.sequence;
  });
}

function build(order: Design[], spacing: number, rotation: boolean, heuristic: number): Mat[] {
  const mats: Mat[] = [];
  const usableW = CUT_W - spacing;
  const usableH = CUT_H - spacing;
  for (const design of order) {
    let best: Candidate | null = null;
    // Try every orientation in every mat, including a new mat. No row/shelf constraint.
    for (let mi = 0; mi <= mats.length; mi++) {
      const regions = mi === mats.length ? [{ x: 0, y: 0, w: usableW, h: usableH }] : mats[mi].free;
      for (const free of regions) for (const rotated of rotation ? [false, true] : [false]) {
        const width = (rotated ? design.height : design.width) + spacing;
        const height = (rotated ? design.width : design.height) + spacing;
        if (width > free.w + EPS || height > free.h + EPS) continue;
        const short = Math.min(free.w - width, free.h - height);
        const long = Math.max(free.w - width, free.h - height);
        // Prefer occupied mats, then compact free-space fits. Alternate free-space
        // rules between restarts to escape greedy choices.
        const quality = heuristic % 3 === 0 ? short * 1000 + long :
          heuristic % 3 === 1 ? (free.w * free.h - width * height) :
            (free.y + height) * 110 + free.x + width;
        const score = mi === mats.length ? 1e9 + quality : quality;
        if (!best || score < best.score) best = { mat: mi, free, rotated, width, height, score };
      }
    }
    if (!best) throw new Error(`“${design.content}” cannot fit in Cricut Joy's 10.795 × 15.875 cm cutting area at its requested width, even with the selected rotation setting.`);
    if (best.mat === mats.length) mats.push({ placements: [], free: [{ x: 0, y: 0, w: usableW, h: usableH }] });
    const x = best.free.x;
    const y = best.free.y;
    occupy(mats[best.mat], { x, y, w: best.width, h: best.height });
    mats[best.mat].placements.push({ design, x: x + spacing / 2, y: y + spacing / 2,
      rotated: best.rotated, width: best.width - spacing, height: best.height - spacing });
  }
  return mats;
}

function fitness(mats: Mat[]) {
  // Mat count dominates. For equal counts, group cuts compactly so more of each
  // mat remains reusable. Small occupancy imbalance is used as a final tie-break.
  const footprint = mats.reduce((sum, mat) => {
    const maxX = Math.max(...mat.placements.map(p => p.x + p.width));
    const maxY = Math.max(...mat.placements.map(p => p.y + p.height));
    return sum + maxX * maxY;
  }, 0);
  return mats.length * 1e9 + footprint;
}

export function nest(designs: Design[], spacing: number, rotation: boolean, seed = 1): Mat[] {
  if (!designs.length) return [];
  if (!Number.isFinite(spacing) || spacing < 0 || spacing > 10) throw new Error("Safe spacing must be between 0 and 10 mm.");
  if (designs.length > 250) throw new Error("Limit this batch to 250 individual designs.");
  let best: Mat[] | null = null;
  const attempts = designs.length < 35 ? 72 : 36;
  for (let i = 0; i < attempts; i++) {
    const candidate = build(initialOrder(designs, i, seed), spacing, rotation, i);
    if (!best || fitness(candidate) < fitness(best)) best = candidate;
  }
  return best!;
}

export function matUtilization(mat: Mat) {
  // Conservative rectangle coverage, since actual path area may have holes.
  return mat.placements.reduce((area, p) => area + p.width * p.height, 0) / (MAT_W * MAT_H) * 100;
}

export function matCuttingCost(mat: Mat) {
  if (!mat.placements.length) return 0;
  const utilization = Math.max(1, Math.min(100, matUtilization(mat)));
  return Math.round(30 + 120 * (utilization - 1) / 99);
}

export function placementPath(p: Placement) {
  const d = p.design;
  const place = p.rotated ? `translate(${p.x + d.height} ${p.y}) rotate(90)` : `translate(${p.x} ${p.y})`;
  return { transform: `${place} scale(${d.scale}) translate(${-d.bounds.x1} ${-d.bounds.y1})`, d: d.path };
}

function escapeXml(text: string) {
  return text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}

export function matSvg(mat: Mat) {
  const cuts = [...mat.placements].sort((a, b) => a.design.sequence - b.design.sequence).map((p, index) => {
    const { transform, d } = placementPath(p);
    // Bake every position, rotation and scale into the path itself. Some cut
    // importers determine physical size from the untransformed path geometry.
    const cutPath = svgpath(d).transform(transform).abs().round(5).toString();
    const [x1, y1, x2, y2] = svgPathBbox(cutPath);
    if (![x1, y1, x2, y2].every(Number.isFinite) ||
        x1 < -0.01 || y1 < -0.01 || x2 > CUT_W + 0.01 || y2 > CUT_H + 0.01) {
      throw new Error(`Design ${index + 1} extends beyond Cricut Joy's cutting area.`);
    }
    return { placement: p, path: cutPath, bounds: { x1, y1, x2, y2 }, index };
  });
  if (!cuts.length) throw new Error("This mat has no cut paths.");
  const left = Math.min(...cuts.map(c => c.bounds.x1));
  const top = Math.min(...cuts.map(c => c.bounds.y1));
  const width = Math.max(...cuts.map(c => c.bounds.x2)) - left;
  const height = Math.max(...cuts.map(c => c.bounds.y2)) - top;
  if (width > CUT_W + 0.01 || height > CUT_H + 0.01 || width <= 0 || height <= 0) {
    throw new Error("The cut layout exceeds Cricut Joy's cutting area.");
  }
  // Design Space imports the SVG's canvas size as the image size. Use only the
  // occupied artwork area; shifting every path together keeps its geometry,
  // spacing, rotations and original entry order intact.
  const paths = cuts.map(c => {
    const path = svgpath(c.path).translate(-left, -top).abs().round(5).toString();
    return `  <path id="design-${c.index + 1}" data-font="${escapeXml(c.placement.design.fontCode)}" data-width-mm="${c.placement.design.width.toFixed(4)}" d="${escapeXml(path)}" fill="#000000" fill-rule="${c.placement.design.fillRule || "nonzero"}"/>`;
  }).join("\n");
  // Design Space interprets the numeric width of an SVG with `mm` dimensions
  // as inches (a 50 mm image imports as 127 cm). Express the exact physical
  // size in inches while retaining millimetre coordinates in the viewBox.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${(width / 25.4).toFixed(8)}in" height="${(height / 25.4).toFixed(8)}in" viewBox="0 0 ${width.toFixed(5)} ${height.toFixed(5)}">\n${paths}\n</svg>\n`;
}
