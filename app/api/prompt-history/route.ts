import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptHistory } from "@/lib/schema";

const HISTORY_LIMIT = 20;

const insertSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  source: z.enum(["studio", "stories", "shared"]).optional(),
});

function sanitizePrompt(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await db
    .select()
    .from(promptHistory)
    .where(eq(promptHistory.userId, session.user.id))
    .orderBy(desc(promptHistory.lastUsedAt))
    .limit(HISTORY_LIMIT);

  const items = records.map((record) => ({
    id: record.id,
    prompt: record.prompt,
    source: record.source ?? "shared",
    createdAt: record.createdAt?.toISOString() ?? null,
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    prompts: items.map((item) => item.prompt),
    items,
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof insertSchema>;
  try {
    body = insertSchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const trimmed = sanitizePrompt(body.prompt);
  if (!trimmed) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const source = body.source ?? "shared";
  const now = new Date();

  const updateData: Partial<typeof promptHistory.$inferInsert> = {
    lastUsedAt: now,
  };
  if (body.source) {
    updateData.source = body.source;
  }

  const [record] = await db
    .insert(promptHistory)
    .values({
      id: randomUUID(),
      userId,
      prompt: trimmed,
      source,
      createdAt: now,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: [promptHistory.userId, promptHistory.prompt],
      set: updateData,
    })
    .returning();

  const overflow = await db
    .select({ id: promptHistory.id })
    .from(promptHistory)
    .where(eq(promptHistory.userId, userId))
    .orderBy(desc(promptHistory.lastUsedAt))
    .offset(HISTORY_LIMIT);

  if (overflow.length > 0) {
    const overflowIds = overflow.map((item) => item.id);
    await db.delete(promptHistory).where(inArray(promptHistory.id, overflowIds));
  }

  return NextResponse.json({
    item: {
      id: record.id,
      prompt: record.prompt,
      source: record.source ?? source,
      createdAt: record.createdAt?.toISOString() ?? now.toISOString(),
      lastUsedAt: record.lastUsedAt?.toISOString() ?? now.toISOString(),
    },
  });
}
