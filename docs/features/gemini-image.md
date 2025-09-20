# Gemini 2.5 Flash Image Preview Integration

This app uses the Vercel AI SDK with Google's Gemini 2.5 Flash Image Preview model to generate and persist Ultragaz-branded character art directly from `/studio`.

## What changed
- `/api/images/generate` authenticates the caller, invokes Gemini through the Vercel AI SDK, and now writes the resulting PNG + metadata to Postgres (`generated_image` table) while saving the file under `public/generated/<userId>/`.
- `/api/images/history` is a new authenticated endpoint that returns the most recent generations for the signed-in user.
- `/studio` posts the prompt, creativity/seed/format, and reference sheet, then refreshes the local gallery with the persisted record returned by the API.
- The bottom gallery now shows your personal history; selecting a thumbnail restores it on the canvas together with the saved description.

## How it works
- **Server**
  - `app/api/images/generate/route.ts`
    - Instantiates `createGoogleGenerativeAI` with `GOOGLE_GENERATIVE_AI_API_KEY` and calls `generateText` with `responseModalities: ["IMAGE", "TEXT"]`.
    - Requires a Better Auth session (`auth.api.getSession`). Anonymous requests receive `401`.
    - Normalises incoming reference images, forwards up to two of them to Gemini, and writes each base64 response to `/public/generated/<userId>/<uuid>.png`.
    - Inserts a row into `generated_image` (prompt, description, model, seed/aspect ratio, path) and returns the inserted rows so the client can update immediately.
  - `app/api/images/history/route.ts`
    - Fetches the latest 50 persisted records for the current user, ordered by `created_at` (descending).
- **Database**
  - `drizzle/0001_store_generated_images.sql` creates the `generated_image` table plus supporting indexes.
  - `src/lib/schema.ts` exposes the new table via Drizzle ORM.
- **Client** (`app/studio/page.tsx`)
  - Loads `/api/images/history` on mount to backfill the gallery and defaults the canvas to the newest saved image.
  - After each generation it merges the returned records into local history, ensuring no duplicates and keeping most recent first.
  - Selecting a thumbnail updates the canvas and the “Model notes” panel with the stored description.

## Environment variables
Add the following keys to `.env.local` (see `env.example` for the template):

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GEMINI_API_KEY=your_gemini_key                  # optional backup lookup
GEMINI_IMAGE_MODEL="gemini-2.5-flash-image-preview"
GEMINI_PERSON_GENERATION="allow_all"
```

`GOOGLE_GENERATIVE_AI_API_KEY` is the primary key used by the Vercel AI provider. `GEMINI_API_KEY` remains for backward compatibility. The model/env values can be adjusted without touching the code.

## Database migration
Run the new migration before starting the app in a fresh environment:

```
pm run db:migrate
```

It will create the `generated_image` table and associated indexes.

## Files touched
- `app/api/images/generate/route.ts`
- `app/api/images/history/route.ts`
- `app/studio/page.tsx`
- `src/lib/schema.ts`
- `src/types/index.ts`
- `drizzle/0001_store_generated_images.sql`
- `drizzle/meta/0001_snapshot.json`

## Usage
1. Set the environment variables and run the migration (`npm run db:migrate`).
2. Restart `npm run dev` and sign in with Google.
3. Visit `http://localhost:3000/studio`, craft a prompt, and click **Generate**.
4. New renders appear on the canvas **and** in the history rail for reuse across sessions.

## Notes
- The right panel format options still map directly to Gemini's supported aspect ratios.
- `personGeneration` defaults to `allow_all` so the model can create characters freely.
- If the model returns no image the API responds with HTTP 502 and surfaces the text response as the error message.
- Persisted metadata exposes `prompt`, `description`, `model`, `aspectRatio`, `seed`, and timestamps, enabling future analytics or credit tracking.
