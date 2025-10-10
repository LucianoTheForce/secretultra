import { POST as generateImageRoute } from "../images/generate/route";

export const STORY_ASPECT_RATIOS = [
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
] as const;

export type StoryAspectRatio = (typeof STORY_ASPECT_RATIOS)[number];

export type StoryImageGenerationResult = {
  id: string;
  imagePath: string;
  previewUrl?: string | null;
  shareUrl?: string | null;
  backgroundRemovedUrl?: string | null;
  description?: string | null;
};

export function buildSceneRequestBody(params: {
  prompt: string;
  aspectRatio?: StoryAspectRatio;
  seed?: string | number;
  engine?: "gemini" | "fal";
  count?: number;
}) {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    count: params.count ?? 1,
    engine: params.engine ?? "gemini",
  };

  if (params.aspectRatio) {
    body.aspectRatio = params.aspectRatio;
  }

  if (params.seed !== undefined) {
    body.seed = params.seed;
  }

  return JSON.stringify(body);
}

export async function generateStoryImage(options: {
  request: Request;
  prompt: string;
  aspectRatio?: StoryAspectRatio;
  seed?: string | number;
  engine?: "gemini" | "fal";
}): Promise<{
  image: StoryImageGenerationResult;
  credits?: number | null;
  totalGenerated?: number | null;
}> {
  const sceneRequest = new Request(
    new URL("/api/images/generate", options.request.url),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: options.request.headers.get("cookie") ?? "",
        authorization: options.request.headers.get("authorization") ?? "",
      },
      body: buildSceneRequestBody({
        prompt: options.prompt,
        aspectRatio: options.aspectRatio,
        seed: options.seed,
        engine: options.engine,
      }),
    },
  );

  const response = await generateImageRoute(sceneRequest);
  let payload: Record<string, unknown> | null = null;

  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // ignore JSON parse error; handled below
  }

  const images = Array.isArray(payload?.images)
    ? (payload?.images as StoryImageGenerationResult[])
    : [];

  if (!response.ok || images.length === 0) {
    const message =
      payload && typeof payload?.error === "string"
        ? (payload.error as string)
        : "Image generation failed";
    throw new Error(message);
  }

  const firstImage = images[0];
  return {
    image: firstImage,
    credits:
      payload && typeof payload?.credits === "number"
        ? (payload.credits as number)
        : null,
    totalGenerated:
      payload && typeof payload?.totalGenerated === "number"
        ? (payload.totalGenerated as number)
        : null,
  };
}
