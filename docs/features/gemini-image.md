# Gemini 2.5 Flash Image Preview Integration

This app uses the Vercel AI SDK with Google's Gemini 2.5 Flash Image Preview model to generate Ultragaz-branded character art directly from `/studio`.

## What changed
- `/api/images/generate` now calls `generateText` from the Vercel AI SDK with the `@ai-sdk/google` provider.
- The API accepts the Nano Banana style payload (prompt, optional reference images, temperature, seed, aspect ratio).
- `/studio` sends the canvas prompt, reference character sheet, and the format picked in the right panel.
- The model returns base64 PNG data plus a descriptive caption which is shown beneath the canvas.

## How it works
- **Server** (`app/api/images/generate/route.ts`)
  - Instantiates `createGoogleGenerativeAI` with `GOOGLE_GENERATIVE_AI_API_KEY`.
  - Uses `generateText` with `responseModalities: ["IMAGE", "TEXT"]` so Gemini returns both images and a narrative description.
  - Normalises base64 reference images (from the Nano Banana flow) and forwards up to two to the model.
  - Responds with base64 strings, the text summary, and token usage metadata.
- **Client** (`app/studio/page.tsx`)
  - Collects the prompt, creativity slider, optional seed, and the currently selected aspect ratio.
  - Converts the Ultragaz character sheet into base64 and posts it as a reference image.
  - Displays the resulting image inside `CanvasPro` and shows the model notes beneath the canvas.
  - Keeps the previous description or error message visible until the next generation.

## Environment variables
Add the following keys to `.env.local` (see `env.example` for the template):

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GEMINI_API_KEY=your_gemini_key                  # optional backup lookup
GEMINI_IMAGE_MODEL="gemini-2.5-flash-image-preview"
GEMINI_PERSON_GENERATION="allow_all"
```

`GOOGLE_GENERATIVE_AI_API_KEY` is the primary key used by the Vercel AI provider. `GEMINI_API_KEY` remains for backward compatibility. The model/env values can be adjusted without touching the code.

## Files touched
- `app/api/images/generate/route.ts`
- `app/studio/page.tsx`
- `src/components/right-panel.tsx`
- `.env`, `.env.local`, `env.example`

## Usage
1. Set the environment variables and restart `npm run dev`.
2. Visit `http://localhost:3000/studio`.
3. Enter a prompt, tweak creativity/seed/format, then click **Generate**.
4. The canvas updates with the new render and the description appears under the viewport.

## Notes
- The right panel format options map directly to Gemini's supported aspect ratios.
- `personGeneration` defaults to `allow_all` so the model can create characters freely.
- If the model returns no image the API responds with HTTP 502 and surfaces the text response as the error message.
- The response includes token usage, enabling future credit-tracking enhancements.
