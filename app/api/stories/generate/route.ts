import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyRuns, storyFrames } from "@/lib/schema";
import {
  STORY_NARRATIVE_SCHEMA,
  type StoryNarrative,
  type StoryScene,
} from "@/lib/story-enhancer";
import { generateStoryImage, STORY_ASPECT_RATIOS, type StoryAspectRatio, type StoryImageGenerationResult } from "../_utils";
import { eq } from "drizzle-orm";

const MAX_SCENES = 10;

const baseRequestSchema = z.object({
  basePrompt: z.string().min(1),
  story: z.unknown(),
  enhancerModel: z.string().optional(),
  aspectRatio: z.enum(STORY_ASPECT_RATIOS).optional(),
  tone: z.string().optional(),
  language: z.enum(["pt-BR", "en-US"]).optional(),
  seed: z.union([z.string(), z.number()]).optional(),
  metadata: z.record(z.any()).optional(),
});

type BaseRequestBody = z.infer<typeof baseRequestSchema>;

type GenerateStoryBody = Omit<BaseRequestBody, "story"> & { story: StoryNarrative };

function sanitizeScenes(scenes: StoryScene[]): StoryScene[] {
  return scenes
    .slice(0, MAX_SCENES)
    .map((scene, index) => ({
      ...scene,
      index:
        typeof scene.index === "number" && scene.index > 0
          ? scene.index
          : index + 1,
    }))
    .sort((a, b) => a.index - b.index);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody = "";
  let parsedBody: unknown;
  try {
    rawBody = await req.text();
    parsedBody = rawBody.length > 0 ? JSON.parse(rawBody) : null;
  } catch (error) {
    console.error("[stories/generate] invalid json payload", error, rawBody);
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  let baseBody: BaseRequestBody;
  try {
    baseBody = baseRequestSchema.parse(parsedBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: error.issues },
        { status: 422 },
      );
    }
    console.error("[stories/generate] unexpected parse error", error, parsedBody);
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const storyResult = STORY_NARRATIVE_SCHEMA.safeParse(baseBody.story);
  if (!storyResult.success) {
    console.error('[stories/generate] story validation failed', storyResult.error.flatten());
    return NextResponse.json(
      { error: "Invalid story payload", issues: storyResult.error.issues },
      { status: 422 },
    );
  }

  const body: GenerateStoryBody = { ...baseBody, story: storyResult.data };
  console.log('[stories/generate] validated story with', body.story.scenes.length, 'scenes');

  const scenes = sanitizeScenes(body.story.scenes);
  if (scenes.length === 0) {
    return NextResponse.json(
      { error: "Story must contain at least one scene" },
      { status: 422 },
    );
  }

  const runId = crypto.randomUUID();
  const userId = session.user.id;
  const metadata = {
    ...(body.tone ? { tone: body.tone } : {}),
    ...(body.language ? { language: body.language } : {}),
    ...(body.metadata ?? {}),
  };

  await db.insert(storyRuns).values({
    id: runId,
    userId,
    basePrompt: body.basePrompt,
    enhancedPrompt: JSON.stringify(body.story as StoryNarrative),
    title: body.story.title ?? null,
    summary: body.story.summary ?? null,
    enhancerModel: body.enhancerModel ?? null,
    sceneCount: scenes.length,
    status: "processing",
    metadata,
  });

  const frameRecords: Array<{
    value: typeof storyFrames.$inferInsert;
    image: StoryImageGenerationResult;
  }> = [];
  let lastCredits: number | null = null;
  let lastTotalGenerated: number | null = null;

  try {
    for (const scene of scenes) {
      const { image, credits, totalGenerated } = await generateStoryImage({
        request: req,
        prompt: scene.visualPrompt,
        aspectRatio: body.aspectRatio as StoryAspectRatio | undefined,
        seed: body.seed,
      });

      frameRecords.push({
        value: {
          id: crypto.randomUUID(),
          storyRunId: runId,
          sceneIndex: scene.index,
          title: scene.title ?? null,
          copy: scene.copy ?? null,
          visualPrompt: scene.visualPrompt,
          summary: scene.summary ?? null,
          generatedImageId: image.id ?? null,
          metadata: {
            previewUrl: image.previewUrl ?? null,
            shareUrl: image.shareUrl ?? null,
            backgroundRemovedUrl: image.backgroundRemovedUrl ?? null,
            description: image.description ?? null,
          },
        },
        image,
      });

      lastCredits = credits ?? lastCredits;
      lastTotalGenerated = totalGenerated ?? lastTotalGenerated;
    }

    if (frameRecords.length > 0) {
      await db
        .insert(storyFrames)
        .values(frameRecords.map((item) => item.value));
    }

    await db
      .update(storyRuns)
      .set({ status: "succeeded" })
      .where(eq(storyRuns.id, runId));

    return NextResponse.json({
      run: {
        id: runId,
        title: body.story.title,
        summary: body.story.summary,
        sceneCount: scenes.length,
        enhancerModel: body.enhancerModel ?? null,
        metadata,
        status: "succeeded",
      },
      frames: frameRecords.map((item) => ({
        id: item.value.id,
        sceneIndex: item.value.sceneIndex,
        title: item.value.title,
        copy: item.value.copy,
        visualPrompt: item.value.visualPrompt,
        summary: item.value.summary,
        generatedImageId: item.value.generatedImageId,
        urls: {
          imagePath: item.image.imagePath,
          previewUrl: item.image.previewUrl ?? null,
          shareUrl: item.image.shareUrl ?? null,
          backgroundRemovedUrl: item.image.backgroundRemovedUrl ?? null,
        },
      })),
      credits: lastCredits,
      totalGenerated: lastTotalGenerated,
    });
  } catch (error) {
    console.error("[stories/generate] failure", error);
    await db
      .update(storyRuns)
      .set({ status: "failed" })
      .where(eq(storyRuns.id, runId));

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Story generation failed",
      },
      { status: 500 },
    );
  }
}

