CREATE TABLE IF NOT EXISTS "story_run" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "base_prompt" text NOT NULL,
  "enhanced_prompt" text,
  "title" text,
  "summary" text,
  "enhancer_model" text,
  "scene_count" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "story_run_user_idx" ON "story_run" ("user_id");
CREATE INDEX IF NOT EXISTS "story_run_created_idx" ON "story_run" ("created_at");

CREATE TABLE IF NOT EXISTS "story_frame" (
  "id" text PRIMARY KEY NOT NULL,
  "story_run_id" text NOT NULL REFERENCES "story_run"("id") ON DELETE CASCADE,
  "scene_index" integer NOT NULL,
  "title" text,
  "copy" text,
  "visual_prompt" text NOT NULL,
  "summary" text,
  "generated_image_id" text REFERENCES "generated_image"("id") ON DELETE SET NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "story_frame_story_idx" ON "story_frame" ("story_run_id");
CREATE INDEX IF NOT EXISTS "story_frame_story_scene_idx" ON "story_frame" ("story_run_id", "scene_index");

CREATE TABLE IF NOT EXISTS "story_flow" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "owner_email" text NOT NULL,
  "blueprint" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "story_flow_owner_idx" ON "story_flow" ("owner_email");
