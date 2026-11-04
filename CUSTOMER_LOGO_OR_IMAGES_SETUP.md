# Customer Logo or Images

The public `/vinylfonts` page now offers **Customer Logo or Images** for PNG, JPG, and JPEG files (up to 5 MB each). Text and Canva font selection remain available independently.

## Production setup

- Deploy with the existing `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `STAFF_SESSION_SECRET` variables. `STAFF_SESSION_SECRET` must have at least 32 characters. Keep the service role key and session secret server-side.
- On the first customer upload, the server creates a **private** Supabase Storage bucket named `vinyl-customer-artwork`. If the bucket cannot be created automatically, create a private bucket with that name in the Supabase dashboard, allow `image/png` and `image/jpeg`, and set a 5 MB file limit. Public bucket access is not needed.
- Customer image links use a random ID and a signature derived from `STAFF_SESSION_SECRET`. The person with the link can view the original image. Keep this secret stable; changing it invalidates previously sent links.
- Uploads consume Supabase Storage. Apply your own retention policy to the bucket for old customer files. A customer clicking WhatsApp without sending the message can leave an unused upload.

## Production workflow

1. The customer uploads one or more images, enters width, quantity, and vinyl color, and clicks **Send Images on WhatsApp**. The image link is included in the WhatsApp text; the image is not attached as WhatsApp media.
2. Staff opens the link to inspect the original. In `/cricut_svg`, staff adds **Customer Logo or Images**, pastes the image link and clicks **Load image**, or uploads the image directly.
3. Staff prepares the vector contour, adjusts the threshold, inversion, and tiny-shape setting if needed, checks islands and holes, and explicitly approves the preview. If the source image is unsuitable, contact the customer for a better file.
4. Staff enters the requested width and quantity. The generator combines approved image paths and any Canva text outlines in the same nesting run, preserving their physical widths and safe spacing. Each mat exports real SVG `<path>` elements.

The existing 11 × 16 cm Cricut Joy cuttable area cannot fit every width offered on the customer page (which allows up to 29 cm). The generator reports an error for an image that cannot fit at its requested size. Staff should contact the customer about a different size or production method; no image is silently shrunk.

PNG transparency is used as the foreground when present; otherwise the contour is extracted using brightness. Complex photos, gradients, and multicolor artwork can produce unsuitable contours. Staff approval is required for this reason.
