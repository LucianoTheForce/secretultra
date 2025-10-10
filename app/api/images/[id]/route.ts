import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedImages } from "@/lib/schema";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const imageId = params.id;
  if (!imageId) {
    return NextResponse.json({ error: "Image id is required" }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(generatedImages)
      .where(
        and(
          eq(generatedImages.id, imageId),
          eq(generatedImages.userId, session.user.id),
        ),
      )
      .returning({ id: generatedImages.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[images] failed to delete image", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
