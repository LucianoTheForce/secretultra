import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages, user } from "@/lib/schema"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const dbUser = await db
    .select({ credits: user.credits, isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .then((rows) => rows[0])

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generatedImages)
    .where(eq(generatedImages.userId, userId))
    .then((rows) => (rows.length ? rows : [{ count: 0 }]))

  return NextResponse.json({
    credits: dbUser.credits,
    totalGenerated: Number(count ?? 0),
    isAdmin: dbUser.isAdmin,
  })
}
