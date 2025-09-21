import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

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
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ images: [] }, { status: 200 })
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
        aspectRatio: generatedImages.aspectRatio,
        seed: generatedImages.seed,
        createdAt: generatedImages.createdAt,
      })
      .from(generatedImages)
      .where(eq(generatedImages.userId, session.user.id))
      .orderBy(desc(generatedImages.createdAt))
      .limit(50)

    const images = records.map((record) => ({
      id: record.id,
      prompt: record.prompt,
      description: sanitizeModelMentions(record.description ?? null),
      imagePath: record.imagePath,
      model: PUBLIC_IMAGE_ENGINE_NAME,
      aspectRatio: record.aspectRatio,
      seed: record.seed,
      createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Failed to load generated images", error)
    return NextResponse.json({ images: [] }, { status: 500 })
  }
}



