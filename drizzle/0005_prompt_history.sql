CREATE TABLE IF NOT EXISTS "prompt_history" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL,
  "source" text NOT NULL DEFAULT 'shared',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "prompt_history_user_prompt_idx" ON "prompt_history" ("user_id", "prompt");
CREATE INDEX IF NOT EXISTS "prompt_history_user_idx" ON "prompt_history" ("user_id");
CREATE INDEX IF NOT EXISTS "prompt_history_last_used_idx" ON "prompt_history" ("last_used_at");
