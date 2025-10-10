
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { STORY_ASPECT_RATIOS } from "../_utils";
import { POST as generateImageRoute } from "../../images/generate/route";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  count: z.number().int().min(2).max(10).default(4),
  aspectRatio: z.enum(STORY_ASPECT_RATIOS).optional(),
  engine: z.enum(["gemini", "fal"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof requestSchema>;
  try {
    const json = await req.json();
    body = requestSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", issues: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const downstreamRequest = new Request(
    new URL("/api/images/generate", req.url),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
        authorization: req.headers.get("authorization") ?? "",
      },
      body: JSON.stringify({
        prompt: body.prompt.trim(),
        count: body.count,
        aspectRatio: body.aspectRatio,
        engine: body.engine ?? "gemini",
        personGeneration: "allow_all",
      }),
    },
  );

  const response = await generateImageRoute(downstreamRequest);
  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Quick story generation failed";
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const images = Array.isArray(payload?.images) ? payload.images : [];
  if (images.length === 0) {
    return NextResponse.json(
      { error: "No images generated" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    images,
    credits: payload?.credits ?? null,
    totalGenerated: payload?.totalGenerated ?? null,
  });
}
