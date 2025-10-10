import { NextResponse } from "next/server"
import { and, desc, eq, isNotNull } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages } from "@/lib/schema"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ videos: [] }, { status: 200 })
    }

    const records = await db
      .select({
        id: generatedImages.id,
        prompt: generatedImages.prompt,
        description: generatedImages.description,
        imagePath: generatedImages.imagePath,
        videoUrl: generatedImages.videoUrl,
        model: generatedImages.model,
        shareUrl: generatedImages.shareUrl,
        previewUrl: generatedImages.previewUrl,
        aspectRatio: generatedImages.aspectRatio,
        seed: generatedImages.seed,
        createdAt: generatedImages.createdAt,
      })
      .from(generatedImages)
      .where(
        and(eq(generatedImages.userId, session.user.id), isNotNull(generatedImages.videoUrl)),
      )
      .orderBy(desc(generatedImages.createdAt))
      .limit(50)

    const videos = records.map((record) => ({
      id: record.id,
      prompt: record.prompt,
      description: record.description,
      imagePath: record.imagePath,
      videoUrl: record.videoUrl,
      model: record.model,
      shareUrl: record.shareUrl,
      previewUrl: record.previewUrl,
      aspectRatio: record.aspectRatio,
      seed: record.seed,
      createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Failed to load generated videos", error)
    return NextResponse.json({ videos: [] }, { status: 500 })
  }
}
