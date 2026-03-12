/**
 * Get the first valid display image URL from a product's main_image_url and additional_images.
 * Falls back to additional_images when main_image_url is invalid (e.g. numeric strings from CSV import).
 */
export function getDisplayImage(product: { main_image_url?: string | null; additional_images?: string[] | null }): string | null {
  const candidates = [product?.main_image_url, ...(product?.additional_images || [])];
  return candidates.find((url): url is string =>
    typeof url === "string" && /^(https?:\/\/|\/|data:)/i.test(url.trim())
  ) || null;
}
