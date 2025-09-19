import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, type CoreMessage, type ImagePart, type JSONValue, type TextPart } from "ai"
import type { SharedV2ProviderOptions } from "@ai-sdk/provider"

type GenerateBody = {
  prompt: string
  referenceImages?: string[]
  temperature?: number
  seed?: number | string
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
  personGeneration?: "dont_allow" | "allow_adult" | "allow_all"
}

export const runtime = "nodejs"

const DEFAULT_SYSTEM_PROMPT = `You are the lead visual designer for Ultragaz. Generate striking 3D character artwork that feels premium, welcoming, and brand-aligned. Always respect brand colours (Ultragaz blue #004B87, warm highlights) and return vivid, production-ready ideas.`

const SUPPORTED_IMAGE_MIME = "image/png"

function normalizeBase64(input?: string | null): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const data = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed
  const sanitized = data.replace(/\s/g, "")
  return sanitized.length > 0 ? sanitized : null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Google Generative AI API key" },
        { status: 500 }
      )
    }

    const modelId =
      process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview"

    const google = createGoogleGenerativeAI({ apiKey })
    const model = google(modelId)

    const referenceImages = (body.referenceImages || [])
      .map((value) => normalizeBase64(value))
      .filter((value): value is string => Boolean(value))
      .slice(0, 2)

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nAlways return a detailed written description alongside the generated imagery.`

    const userContent: (TextPart | ImagePart)[] = [
      { type: "text", text: prompt },
      ...referenceImages.map<ImagePart>((image) => ({
        type: "image",
        image,
        mediaType: SUPPORTED_IMAGE_MIME,
      })),
    ]

    const messages: CoreMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]

    const googleOptions: Record<string, JSONValue> = {
      responseModalities: ["IMAGE", "TEXT"],
    }

    if (body.aspectRatio) {
      googleOptions.aspectRatio = body.aspectRatio
    }

    if (body.personGeneration) {
      googleOptions.personGeneration = body.personGeneration
    }

    const providerOptions: SharedV2ProviderOptions = {
      google: googleOptions,
    }

    const parsedSeed =
      typeof body.seed === "number"
        ? body.seed
        : typeof body.seed === "string" && body.seed.trim() !== ""
          ? Number(body.seed)
          : undefined

    const temperature =
      typeof body.temperature === "number" ? clamp(body.temperature, 0, 1) : undefined

    const generation = await generateText({
      model,
      messages,
      temperature,
      seed: Number.isFinite(parsedSeed) ? parsedSeed : undefined,
      providerOptions,
      maxOutputTokens: 2048,
    })

    const images = generation.files
      .filter((file) => file.mediaType?.startsWith("image/"))
      .map((file) => file.base64)

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "The Gemini model did not return an image",
          description: generation.text,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      images,
      description: generation.text,
      model: modelId,
      usage: generation.usage,
    })
  } catch (error) {
    console.error("Gemini image generation failed", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
