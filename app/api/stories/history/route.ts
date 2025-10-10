
import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyRuns, storyFrames } from "@/lib/schema";

const RUN_LIMIT = 12;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const runs = await db
    .select()
    .from(storyRuns)
    .where(eq(storyRuns.userId, userId))
    .orderBy(desc(storyRuns.createdAt))
    .limit(RUN_LIMIT);

  const runIds = runs.map((run) => run.id);

  let frames: Array<typeof storyFrames.$inferSelect> = [];
  if (runIds.length > 0) {
    frames = await db
      .select()
      .from(storyFrames)
            .where(inArray(storyFrames.storyRunId, runIds));
  }

  const grouped = runs.map((run) => ({
    run,
    frames: frames
      .filter((frame) => frame.storyRunId === run.id)
      .sort((a, b) => a.sceneIndex - b.sceneIndex),
  }));

  return NextResponse.json({ runs: grouped });
}
