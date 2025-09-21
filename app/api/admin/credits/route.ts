import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages, user } from "@/lib/schema"

function envAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || ""
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

async function ensureAdmin(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  if (!session?.user) return null

  const userId = session.user.id
  const email = session.user.email?.toLowerCase() ?? null

  const dbUser = await db
    .select({ id: user.id, credits: user.credits, isAdmin: user.isAdmin, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .then((rows) => rows[0])

  if (!dbUser) return null

  if (dbUser.isAdmin) {
    return dbUser
  }

  const admins = envAdminEmails()
  if (email && admins.includes(email)) {
    await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId))
    return { ...dbUser, isAdmin: true }
  }

  return null
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const admin = await ensureAdmin(session)

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
    })
    .from(user)

  const counts = await db
    .select({ userId: generatedImages.userId, count: sql<number>`count(*)` })
    .from(generatedImages)
    .groupBy(generatedImages.userId)

  const countMap = new Map(counts.map((row) => [row.userId, Number(row.count ?? 0)]))

  const payload = users.map((u) => ({
    ...u,
    totalGenerated: countMap.get(u.id) ?? 0,
  }))

  return NextResponse.json({ users: payload })
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const admin = await ensureAdmin(session)

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, credits } = body as { userId?: string; credits?: number }

  if (!userId || typeof credits !== "number" || credits < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await db.update(user).set({ credits }).where(eq(user.id, userId))

  return NextResponse.json({ success: true })
}
