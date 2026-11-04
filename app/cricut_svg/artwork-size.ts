export type ArtworkSizeMode = "width" | "height";
export type ArtworkBounds = { x1: number; y1: number; x2: number; y2: number };

// Use the vector contour bounds when available: transparent padding and removed
// background pixels are not part of the final Cricut cut design.
export function scaledArtworkSize(bounds: ArtworkBounds | null, mode: ArtworkSizeMode, sizeCm: number) {
  if (!bounds || !Number.isFinite(sizeCm) || sizeCm <= 0) return null;
  const sourceWidth = bounds.x2 - bounds.x1;
  const sourceHeight = bounds.y2 - bounds.y1;
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) return null;
  const scale = sizeCm / (mode === "width" ? sourceWidth : sourceHeight);
  return { widthCm: sourceWidth * scale, heightCm: sourceHeight * scale };
}

export function formatArtworkCm(value: number) {
  return Number(value.toFixed(4)).toString();
}
