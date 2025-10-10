import { NextResponse } from "next/server"
import { and, desc, eq, lt } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages } from "@/lib/schema"
import { PUBLIC_IMAGE_ENGINE_NAME } from "@/lib/constants"

export const runtime = "nodejs"

function sanitizeModelMentions(input?: string | null): string | null {
  if (input == null) {
    return null
  }

  return input
    .replace(/google\s+generative\s+ai/gi, "image engine")
    .replace(/gemini/gi, "image engine")
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get("limit")
    const cursorParam = searchParams.get("cursor")

    const DEFAULT_LIMIT = 36
    const MAX_LIMIT = 100

    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ images: [], nextCursor: null }, { status: 200 })
    }

    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT

    const cursorDate =
      cursorParam && Number.isFinite(Date.parse(cursorParam))
        ? new Date(cursorParam)
        : null

    let whereClause = eq(generatedImages.userId, session.user.id)
    if (cursorDate) {
      whereClause = and(whereClause, lt(generatedImages.createdAt, cursorDate))
    }

    const records = await db
      .select({
        id: generatedImages.id,
        prompt: generatedImages.prompt,
        description: generatedImages.description,
        imagePath: generatedImages.imagePath,
        model: generatedImages.model,
        shareUrl: generatedImages.shareUrl,
        backgroundRemovedUrl: generatedImages.backgroundRemovedUrl,
        previewUrl: generatedImages.previewUrl,
        videoUrl: generatedImages.videoUrl,
        aspectRatio: generatedImages.aspectRatio,
        seed: generatedImages.seed,
        createdAt: generatedImages.createdAt,
      })
      .from(generatedImages)
      .where(whereClause)
      .orderBy(desc(generatedImages.createdAt))
      .limit(limit)

    const images = records.map((record) => ({
      id: record.id,
      prompt: record.prompt,
      description: sanitizeModelMentions(record.description ?? null),
      imagePath: record.imagePath,
      previewUrl: record.previewUrl,
      shareUrl: record.shareUrl,
      backgroundRemovedUrl: record.backgroundRemovedUrl,
      videoUrl: record.videoUrl,
      model: record.model ?? PUBLIC_IMAGE_ENGINE_NAME,
      aspectRatio: record.aspectRatio,
      seed: record.seed,
      createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    const nextCursor =
      records.length === limit
        ? records[records.length - 1]?.createdAt?.toISOString() ?? null
        : null

    return NextResponse.json({ images, nextCursor })
  } catch (error) {
    console.error("Failed to load generated images", error)
    return NextResponse.json({ images: [], nextCursor: null }, { status: 500 })
  }
}


