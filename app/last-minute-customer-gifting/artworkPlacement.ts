export function artworkPlacement(
  imageWidth: number, imageHeight: number, canvasWidth: number, canvasHeight: number,
  rotation: number, fitMode: "contain" | "cover", scale: number, x: number, y: number,
) {
  const quarterTurn = Math.abs(rotation % 180) === 90;
  const width = quarterTurn ? imageHeight : imageWidth;
  const height = quarterTurn ? imageWidth : imageHeight;
  const fit = (fitMode === "contain" ? Math.min : Math.max)(canvasWidth / width, canvasHeight / height);
  return {
    width: imageWidth * fit * scale,
    height: imageHeight * fit * scale,
    centreX: canvasWidth / 2 + x * canvasWidth / 100,
    centreY: canvasHeight / 2 - y * canvasHeight / 100,
    radians: rotation * Math.PI / 180,
  };
}
