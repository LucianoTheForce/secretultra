CREATE TABLE IF NOT EXISTS "generated_image" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "prompt" text NOT NULL,
  "description" text,
  "image_path" text NOT NULL,
  "model" text NOT NULL,
  "aspect_ratio" text,
  "seed" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "generated_image_user_idx" ON "generated_image" ("user_id");
CREATE INDEX IF NOT EXISTS "generated_image_created_at_idx" ON "generated_image" ("created_at");
