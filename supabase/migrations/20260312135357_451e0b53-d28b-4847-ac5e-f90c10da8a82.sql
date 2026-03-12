
-- Clean up invalid main_image_url values (numeric strings from CSV import)
-- These are values like '1215', '800', '816' etc. that are not valid URLs
UPDATE products
SET main_image_url = NULL
WHERE main_image_url IS NOT NULL
  AND main_image_url !~ '^(https?://|/|data:)';

-- Also clean up invalid additional_images entries (like 'NULL' string)
UPDATE products
SET additional_images = array_remove(additional_images, 'NULL')
WHERE additional_images IS NOT NULL
  AND 'NULL' = ANY(additional_images);
