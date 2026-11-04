// Flag monetary notation, labelled prices and trailing product-line prices.
// Dimensions, quantities and dates on their own are not assumed to be prices.
export function hasProductPrice(product: string): boolean {
  return /[₹$€£]|\b(?:rs\.?|inr|rupees?)\s*\d|\d[\d,.]*\s*(?:rs\.?|inr|rupees?)\b|\d[\d,.]*\s*\/\s*-|\b(?:price|cost|mrp|amount|rate|total)\s*[:=–—-]?\s*\d|(?:\s[-–—:=@]\s*|@)\d[\d,]*(?:\.\d{1,2})?(?![\d,.])(?!\s*(?:cm\b|mm\b|m\b|inch(?:es)?\b|pcs\b|pieces?\b|x\b|×|["″]))/im.test(product);
}
export class ArtistProductReviewRequired extends Error {
  productName: string;
  constructor(productName: string) {
    super("The product name appears to contain a price. Edit the artist-facing product name before sending.");
    this.productName = productName;
  }
}
export function artistProductName(original: string, override?: unknown): string {
  if (override !== undefined && typeof override !== "string") throw new Error("The artist product name must be text.");
  const product = override === undefined ? original : (override as string).trim();
  if (!product.trim() || product.length > 4000) throw new Error("Enter an artist product name of 1–4000 characters.");
  if (hasProductPrice(product)) throw new ArtistProductReviewRequired(product);
  return product;
}
