import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyRuns } from "@/lib/schema";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storyId = params.id;
  if (!storyId) {
    return NextResponse.json({ error: "Story id is required" }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(storyRuns)
      .where(
        and(
          eq(storyRuns.id, storyId),
          eq(storyRuns.userId, session.user.id),
        ),
      )
      .returning({ id: storyRuns.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stories] failed to delete story", error);
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
  }
}
