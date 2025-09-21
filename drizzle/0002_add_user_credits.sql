ALTER TABLE "user" ADD COLUMN "credits" integer NOT NULL DEFAULT 30;
ALTER TABLE "user" ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false;
