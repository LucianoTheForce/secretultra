import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages } from "@/lib/schema"

export const runtime = "nodejs"

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
        aspectRatio: generatedImages.aspectRatio,
        seed: generatedImages.seed,
        createdAt: generatedImages.createdAt,
      })
      .from(generatedImages)
      .where(eq(generatedImages.userId, session.user.id))
      .orderBy(desc(generatedImages.createdAt))
      .limit(50)

    const images = records.map((record) => ({
      ...record,
      createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Failed to load generated images", error)
    return NextResponse.json({ images: [] }, { status: 500 })
  }
}
