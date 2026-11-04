import { readFileSync } from "node:fs";
import { transcodePdf } from "@svgsketch/pdf";
import { createNodePdfRuntime } from "@svgsketch/pdf/node";
export const runtime = "nodejs";
export async function GET() {
  const pdf = new Uint8Array(readFileSync("/tmp/cricut-pdfjs-smoke.pdf"));
  const result = await transcodePdf(pdf, {
    runtime: createNodePdfRuntime({ loadModule: () => import("pdfjs-dist/legacy/build/pdf.mjs") }),
    textMode: "outline", layers: "flatten", pages: [1],
  });
  return Response.json({ paths: (result.svg.match(/<path /g) || []).length, textsOutlined: result.stats.textsOutlined });
}
