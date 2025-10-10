# fal.ai Nano Banana Edit Integration

This project now relies on fal.ai's **Nano Banana /edit** endpoint to transform Ultragaz reference art into production-ready character renders.

## Request Flow

1. `/api/images/generate` authenticates the user and validates prompt/credits.
2. Reference imagery is assembled in priority order:
   - The canonical Ultragaz character sheet (bundled in `public/`).
   - Up to two user-supplied reference images (deduplicated + trimmed to base64).
3. The route calls `https://fal.run/fal-ai/nano-banana/edit` with:
   - `prompt`: sanitized Ultragaz art direction.
   - `image_urls`: data URLs for each reference (Nano Banana requires at least one).
   - Fixed settings: `num_images: 1`, `output_format: "png"`, `sync_mode: true`.
4. fal.ai returns one or more image payloads (`data:` URLs or remote storage links) plus a textual description.
5. `mapFalImageToAsset` normalises the payload into `GeneratedImageAsset` instances which are converted to base64 with `normalizeAssetsToBase64`.
6. Each asset is uploaded to ImageKit (`imageKit.upload`) to obtain CDN-ready URLs, background removal variants, and sharing thumbnails.
7. Metadata + credits are persisted in Postgres via the `generatedImages` table; non-admin users have credits debited atomically in the same transaction.

## Environment Variables

Add your fal credentials to `.env.local`:

```env
FAL_API_KEY=your_fal_api_key
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_URL_ENDPOINT=...
```

The API key is read by `app/api/images/generate/route.ts`. No fal-specific client SDK is required—the handler uses `fetch` directly.

## Implementation Notes

- `GeneratedImageAsset`, `mapFalImageToAsset`, and `normalizeAssetsToBase64` live alongside the route for clarity.
- Storyboard generation (`/api/stories/generate`) passes `engine: "gemini"` so the Gemini key remains necessary for scene breakdowns while actual renders come from fal.
- Errors and provider mentions are sanitised via `sanitizeModelMentions` so we can expose user-friendly messages without leaking upstream branding.
- Credit exhaustion surfaces as HTTP `402`; transport failures or unexpected fal responses are returned as HTTP `502` with optional debug payloads in development.
- Uploaded files inherit the existing ImageKit folder strategy (`resolveImageKitFolder(userId)`), so legacy galleries continue working.

## Testing Tips

- Provide at least one reference image (the bundled character sheet is applied automatically in production, but you can supply a base64 string in manual cURL tests).
- Expect roughly one credit to be consumed per asset returned by fal.
- For local verification without ImageKit credentials, mock `imageKit.upload` or set `IMAGEKIT_*` keys to a dev environment.

