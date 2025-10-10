import { NextResponse } from "next/server"
import { and, eq, gte, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasAdminAccess, isMasterAdminEmail } from "@/lib/master-admin"
import { imageKit, resolveImageKitFolder } from "@/lib/imagekit"
import { PUBLIC_VIDEO_ENGINE_NAME } from "@/lib/constants"
import { generatedImages, user } from "@/lib/schema"

type GenerateVideoBody = {
  prompt?: string
  imageUrl?: string
  aspectRatio?: "16:9" | "9:16" | "1:1"
  duration?: "5" | "10"
  negativePrompt?: string
  cfgScale?: number
}

export const runtime = "nodejs"

const KLING_TEXT_TO_VIDEO_URL = "https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video"
const KLING_IMAGE_TO_VIDEO_URL = "https://fal.run/fal-ai/kling-video/v2/master/image-to-video"
const DEFAULT_NEGATIVE_PROMPT = "blur, distort, and low quality"
const DEFAULT_DURATION: GenerateVideoBody["duration"] = "5"
const DEFAULT_ASPECT_RATIO: GenerateVideoBody["aspectRatio"] = "16:9"
const MIN_CFG_SCALE = 0.1
const MAX_CFG_SCALE = 2
const DEFAULT_CFG_SCALE = 0.5
const VIDEO_CREDIT_COST = 5

const INSUFFICIENT_CREDITS = Symbol("INSUFFICIENT_CREDITS")
const INSUFFICIENT_CREDITS_MESSAGE =
  "Voce nao tem creditos suficientes. Peca ao administrador para liberar mais creditos."

function normalizeDuration(value: GenerateVideoBody["duration"]): GenerateVideoBody["duration"] {
  if (value === "5" || value === "10") {
    return value
  }
  return DEFAULT_DURATION
}

function normalizeAspectRatio(value: GenerateVideoBody["aspectRatio"]): GenerateVideoBody["aspectRatio"] {
  if (value === "16:9" || value === "9:16" || value === "1:1") {
    return value
  }
  return DEFAULT_ASPECT_RATIO
}

function normalizeCfgScale(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_CFG_SCALE
  }
  const clamped = Math.min(Math.max(value, MIN_CFG_SCALE), MAX_CFG_SCALE)
  return Number.isFinite(clamped) ? clamped : DEFAULT_CFG_SCALE
}

function inferExtension(contentType?: string | null): string {
  if (!contentType) return "mp4"
  const subtype = contentType.split("/")[1]
  if (!subtype) return "mp4"
  return subtype.split(";")[0] || "mp4"
}

function sanitizeErrorMessage(message?: string | null): string {
  const fallback = "Falha ao gerar o video. Tente novamente em instantes."
  if (!message) return fallback
  return message.replace(/fal(\.ai)?/gi, "video engine")
}

function createTimeoutSignal(durationMs: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    const abortSignalWithTimeout = AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }
    return abortSignalWithTimeout.timeout(durationMs)
  }

  const abortController = new AbortController()
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => abortController.abort(), durationMs)
  if (typeof timer === "object" && timer !== null) {
    const maybeTimer = timer as { unref?: () => void }
    maybeTimer.unref?.()
  }
  return abortController.signal
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const email = session.user.email ?? null

    const dbUser = await db
      .select({ credits: user.credits, isAdmin: user.isAdmin, email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
      .then((rows) => rows[0])

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!dbUser.isAdmin && hasAdminAccess(email)) {
      await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId))
    }

    const isMasterAdmin = isMasterAdminEmail(email)

    const body = (await req.json()) as GenerateVideoBody
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const falApiKey = (process.env.FAL_API_KEY ?? "").trim()
    if (!falApiKey) {
      return NextResponse.json({ error: "Missing fal.ai API key" }, { status: 500 })
    }

    if (!isMasterAdmin && dbUser.credits < VIDEO_CREDIT_COST) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 })
    }

    const normalizedDuration = normalizeDuration(body.duration)
    const normalizedAspectRatio = normalizeAspectRatio(body.aspectRatio)
    const normalizedNegativePrompt =
      typeof body.negativePrompt === "string" && body.negativePrompt.trim().length > 0
        ? body.negativePrompt.trim()
        : DEFAULT_NEGATIVE_PROMPT
    const normalizedCfgScale = normalizeCfgScale(body.cfgScale)
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : ""

    const timeoutSignal = createTimeoutSignal(240_000)

    const isImageToVideo = imageUrl.length > 0
    const endpointUrl = isImageToVideo ? KLING_IMAGE_TO_VIDEO_URL : KLING_TEXT_TO_VIDEO_URL

    const requestPayload: Record<string, unknown> = {
      prompt,
      duration: normalizedDuration,
      negative_prompt: normalizedNegativePrompt,
      cfg_scale: normalizedCfgScale,
    }

    if (isImageToVideo) {
      requestPayload.image_url = imageUrl
    } else {
      requestPayload.aspect_ratio = normalizedAspectRatio
    }

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: timeoutSignal as AbortSignal,
    })

    if (!response.ok) {
      let errorMessage = `Falha na requisicao ao modelo Kling (${response.status})`
      try {
        const errorJson = await response.json()
        const detailed =
          typeof errorJson?.error === "string"
            ? errorJson.error
            : typeof errorJson?.detail === "string"
              ? errorJson.detail
              : Array.isArray(errorJson?.detail)
                ? errorJson.detail.map((item: { msg?: string }) => item?.msg).filter(Boolean).join(", ")
                : null
        if (detailed) {
          errorMessage = detailed
        }
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(errorMessage)
    }

    const result = (await response.json()) as {
      video?: { url?: string | null; content_type?: string | null }
      detail?: unknown
    }

    const videoFile = result?.video
    const videoUrl = videoFile?.url?.trim()

    if (!videoUrl) {
      return NextResponse.json({ error: "Nenhum video retornado pelo modelo Kling." }, { status: 502 })
    }

    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Falha ao baixar video gerado (${response.status})`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const recordId = crypto.randomUUID()
    const extension = inferExtension(videoFile.content_type)
    const fileName = `${recordId}.${extension}`
    const uploadFolder = resolveImageKitFolder(userId)

    const upload = await imageKit.upload({
      file: buffer.toString("base64"),
      fileName,
      folder: uploadFolder,
      useUniqueFileName: false,
      overwriteFile: true,
      fileType: "video",
    })

    const providerLabel = `${PUBLIC_VIDEO_ENGINE_NAME} • Kling`

    const dbValues = {
      id: recordId,
      userId,
      prompt,
      description: null,
      imagePath: upload.url,
      videoUrl: upload.url,
      model: providerLabel,
      aspectRatio: normalizedAspectRatio,
      seed: null,
      shareUrl: upload.url,
      previewUrl: upload.thumbnailUrl ?? null,
      backgroundRemovedUrl: null,
    }

    let transactionResult: {
      inserted: (typeof dbValues) & { createdAt?: Date | null }
      remainingCredits: number
      totalGenerated: number
    }
    try {
      transactionResult = await (async () => {
        if (isMasterAdmin) {
          return await db.transaction(async (tx) => {
            const [row] = await tx.insert(generatedImages).values(dbValues).returning()

            const totalRows = await tx
            .select({ total: sql<number>`count(*)` })
            .from(generatedImages)
            .where(eq(generatedImages.userId, userId))

          return {
            inserted: row,
            remainingCredits: dbUser.credits,
            totalGenerated: totalRows[0]?.total ?? 1,
          }
        })
      }

      return await db.transaction(async (tx) => {
        const creditUpdate = await tx
          .update(user)
          .set({ credits: sql`${user.credits} - ${VIDEO_CREDIT_COST}` })
          .where(and(eq(user.id, userId), gte(user.credits, VIDEO_CREDIT_COST)))
          .returning({ credits: user.credits })

        if (creditUpdate.length === 0) {
          throw INSUFFICIENT_CREDITS
        }

        const [row] = await tx.insert(generatedImages).values(dbValues).returning()

        const totalRows = await tx
          .select({ total: sql<number>`count(*)` })
          .from(generatedImages)
          .where(eq(generatedImages.userId, userId))

            return {
              inserted: row,
              remainingCredits: creditUpdate[0].credits,
              totalGenerated: totalRows[0]?.total ?? 1,
            }
          })
      })()
    } catch (dbError) {
      await imageKit.deleteFile(upload.fileId).catch(() => {})
      throw dbError
    }

    const { inserted, remainingCredits, totalGenerated } = transactionResult

    const createdAt = inserted?.createdAt?.toISOString() ?? new Date().toISOString()

    return NextResponse.json({
      video: {
        id: inserted?.id ?? recordId,
        prompt,
        description: null,
        imagePath: inserted?.imagePath ?? upload.url,
        videoUrl: inserted?.videoUrl ?? upload.url,
        model: inserted?.model ?? providerLabel,
        aspectRatio: inserted?.aspectRatio,
        seed: inserted?.seed,
        shareUrl: inserted?.shareUrl ?? upload.url,
        previewUrl: inserted?.previewUrl ?? upload.thumbnailUrl ?? null,
        backgroundRemovedUrl: inserted?.backgroundRemovedUrl,
        createdAt,
      },
      credits: remainingCredits,
      totalGenerated,
      hasUnlimitedCredits: isMasterAdmin,
    })
  } catch (error) {
    if (error === INSUFFICIENT_CREDITS) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 })
    }

    console.error("Video generation failed", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status: 500 })
  }
}
