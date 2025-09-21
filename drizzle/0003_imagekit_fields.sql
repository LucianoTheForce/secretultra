ALTER TABLE "generated_image" ADD COLUMN IF NOT EXISTS "image_kit_file_id" text;
ALTER TABLE "generated_image" ADD COLUMN IF NOT EXISTS "share_url" text;
ALTER TABLE "generated_image" ADD COLUMN IF NOT EXISTS "background_removed_url" text;
ALTER TABLE "generated_image" ADD COLUMN IF NOT EXISTS "preview_url" text;
