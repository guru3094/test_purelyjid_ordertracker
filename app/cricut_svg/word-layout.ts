import svgpath from "svgpath";
import { svgPathBbox } from "svg-path-bbox";

export type WordOutline = {
  path: string;
  bounds: { x1: number; y1: number; x2: number; y2: number };
  fillRule: "nonzero" | "evenodd";
};

// Canva's fixed VINYL_TEXT box can wrap a sentence before we scale it to the
// requested width. Render words separately, then assemble their actual vector
// outlines on one baseline. Scaling the resulting bounds applies to the full
// content, including all words and spaces, rather than to either word alone.
export function placeWordsOnOneLine(words: WordOutline[]): WordOutline {
  if (!words.length) throw new Error("Enter text to create a cut outline.");
  if (words.length === 1) return words[0];
  const rule = words[0].fillRule;
  if (words.some(word => word.fillRule !== rule)) throw new Error("Canva returned incompatible word outlines.");
  const heights = words.map(word => word.bounds.y2 - word.bounds.y1);
  const gap = Math.max(...heights) * 0.3;
  if (!Number.isFinite(gap) || gap <= 0) throw new Error("Canva returned invalid word bounds.");

  let cursor = 0;
  const paths = words.map((word, index) => {
    const width = word.bounds.x2 - word.bounds.x1;
    if (!Number.isFinite(width) || width <= 0) throw new Error("Canva returned invalid word bounds.");
    if (index) cursor += gap;
    const path = svgpath(word.path).translate(cursor - word.bounds.x1, 0).abs().round(5).toString();
    cursor += width;
    return path;
  });
  const path = paths.join(" ");
  const [x1, y1, x2, y2] = svgPathBbox(path);
  return { path, bounds: { x1, y1, x2, y2 }, fillRule: rule };
}
