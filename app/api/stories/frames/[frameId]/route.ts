import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyFrames, storyRuns } from "@/lib/schema";
import {
  generateStoryImage,
  STORY_ASPECT_RATIOS,
  type StoryAspectRatio,
  type StoryImageGenerationResult,
} from "../../_utils";

const requestSchema = z.object({
  instructions: z.string().min(1),
  aspectRatio: z.enum(STORY_ASPECT_RATIOS).optional(),
  seed: z.union([z.string(), z.number()]).optional(),
  mask: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional(),
});

type RegenerateBody = z.infer<typeof requestSchema>;

type FrameRunRecord = {
  frame: typeof storyFrames.$inferSelect;
  run: typeof storyRuns.$inferSelect;
};

function buildEditedPrompt(options: {
  basePrompt: string;
  instructions: string;
  mask?: RegenerateBody["mask"];
  runMetadata?: Record<string, unknown> | null;
}): string {
  const parts: string[] = [options.basePrompt.trim()];

  const tone =
    typeof options.runMetadata?.tone === "string"
      ? options.runMetadata.tone
      : undefined;

  if (tone) {
    parts.push(`Maintain tone: ${tone}`);
  }

  if (options.mask) {
    const { x, y, width, height } = options.mask;
    const maskSummary = `Focus edits within the highlighted region (x:${(x * 100).toFixed(1)}%, y:${(y * 100).toFixed(1)}%, width:${(width * 100).toFixed(1)}%, height:${(height * 100).toFixed(1)}%).`;
    parts.push(maskSummary);
  }

  parts.push(options.instructions.trim());

  return parts.filter(Boolean).join("

");
}

function mergeMetadata(
  previous: Record<string, unknown> | null,
  image: StoryImageGenerationResult,
  mask?: RegenerateBody["mask"],
) {
  return {
    ...(previous ?? {}),
    imagePath: image.imagePath,
    previewUrl: image.previewUrl ?? null,
    shareUrl: image.shareUrl ?? null,
    backgroundRemovedUrl: image.backgroundRemovedUrl ?? null,
    description: image.description ?? null,
    lastEditedAt: new Date().toISOString(),
    ...(mask ? { mask } : {}),
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: { frameId: string } },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const frameId = params.frameId;
  if (!frameId) {
    return NextResponse.json({ error: "Frame id is required" }, { status: 400 });
  }

  let body: RegenerateBody;
  try {
    body = requestSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: error.issues },
        { status: 422 },
      );
    }
    console.error("[stories/frame] invalid payload", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const records: FrameRunRecord[] = await db
    .select({ frame: storyFrames, run: storyRuns })
    .from(storyFrames)
    .innerJoin(storyRuns, eq(storyFrames.storyRunId, storyRuns.id))
    .where(
      and(
        eq(storyFrames.id, frameId),
        eq(storyRuns.userId, session.user.id),
      ),
    )
    .limit(1);

  if (records.length === 0) {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }

  const { frame, run } = records[0];
  const runMetadata = (run.metadata ?? {}) as Record<string, unknown> | null;
  const prompt = buildEditedPrompt({
    basePrompt: frame.visualPrompt,
    instructions: body.instructions,
    mask: body.mask,
    runMetadata,
  });

  try {
    const { image, credits, totalGenerated } = await generateStoryImage({
      request: req,
      prompt,
      aspectRatio: body.aspectRatio as StoryAspectRatio | undefined,
      seed: body.seed,
    });

    await db
      .update(storyFrames)
      .set({
        visualPrompt: prompt,
        generatedImageId: image.id ?? null,
        metadata: mergeMetadata(
          (frame.metadata ?? null) as Record<string, unknown> | null,
          image,
          body.mask,
        ),
      })
      .where(eq(storyFrames.id, frameId));

    return NextResponse.json({
      frame: {
        id: frameId,
        sceneIndex: frame.sceneIndex,
        title: frame.title,
        copy: frame.copy,
        visualPrompt: prompt,
        summary: frame.summary,
        generatedImageId: image.id ?? null,
        urls: {
          imagePath: image.imagePath,
          previewUrl: image.previewUrl ?? null,
          shareUrl: image.shareUrl ?? null,
          backgroundRemovedUrl: image.backgroundRemovedUrl ?? null,
        },
      },
      credits,
      totalGenerated,
    });
  } catch (error) {
    console.error("[stories/frame] regenerate failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Scene editing failed",
      },
      { status: 500 },
    );
  }
}
