import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, type CoreMessage, type ImagePart, type JSONValue, type TextPart } from "ai"
import type { SharedV2ProviderOptions } from "@ai-sdk/provider"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generatedImages } from "@/lib/schema"

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
const CHARACTER_SHEET_BASE64_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.base64.txt")
const CHARACTER_SHEET_IMAGE_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.png")

let characterSheetBase64Cache: string | null = null
let characterSheetBase64Promise: Promise<string | null> | null = null


function normalizeBase64(input?: string | null): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const data = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed
  const sanitized = data.replace(/\s/g, "")
  return sanitized.length > 0 ? sanitized : null
}

async function getCharacterSheetBase64(): Promise<string | null> {
  if (characterSheetBase64Cache) {
    return characterSheetBase64Cache
  }

  if (characterSheetBase64Promise) {
    return characterSheetBase64Promise
  }

  characterSheetBase64Promise = (async () => {
    try {
      try {
        const base64Text = await fs.readFile(CHARACTER_SHEET_BASE64_FILE, "utf-8")
        const normalized = normalizeBase64(base64Text)
        if (normalized) {
          characterSheetBase64Cache = normalized
          return normalized
        }
      } catch (error) {
        // fall back to reading the binary image if the base64 helper is unavailable
      }

      const imageBuffer = await fs.readFile(CHARACTER_SHEET_IMAGE_FILE)
      const normalized = normalizeBase64(imageBuffer.toString("base64"))
      if (normalized) {
        characterSheetBase64Cache = normalized
        return normalized
      }

      return null
    } catch (error) {
      console.error("Failed to load Ultragaz character sheet", error)
      return null
    } finally {
      characterSheetBase64Promise = null
    }
  })()

  return characterSheetBase64Promise
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const normalizedReferenceImages = (body.referenceImages || [])
      .map((value) => normalizeBase64(value))
      .filter((value): value is string => Boolean(value))

    const referenceImages: string[] = []
    const characterSheetBase64 = await getCharacterSheetBase64()
    if (characterSheetBase64) {
      referenceImages.push(characterSheetBase64)
    }

    for (const image of normalizedReferenceImages) {
      if (!referenceImages.includes(image)) {
        referenceImages.push(image)
      }
    }

    referenceImages.splice(2)

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

    const base64Images = generation.files
      .filter((file) => file.mediaType?.startsWith("image/"))
      .map((file) => file.base64)

    if (base64Images.length === 0) {
      return NextResponse.json(
        {
          error: "The Gemini model did not return an image",
          description: generation.text,
        },
        { status: 502 }
      )
    }

    const userId = session.user.id
    const seedValue = Number.isFinite(parsedSeed)
      ? String(parsedSeed)
      : typeof body.seed === "string"
        ? body.seed
        : null

    const userDir = path.join(process.cwd(), "public", "generated", userId)
    await fs.mkdir(userDir, { recursive: true })

    const values: (typeof generatedImages.$inferInsert)[] = []

    for (const base64Image of base64Images) {
      const id = crypto.randomUUID()
      const fileName = `${id}.png`
      const absolutePath = path.join(userDir, fileName)
      await fs.writeFile(absolutePath, Buffer.from(base64Image, "base64"))
      const relativePath = `/generated/${userId}/${fileName}`

      values.push({
        id,
        userId,
        prompt,
        description: generation.text ?? null,
        imagePath: relativePath,
        model: modelId,
        aspectRatio: body.aspectRatio ?? null,
        seed: seedValue,
      })
    }

    const inserted = await db.insert(generatedImages).values(values).returning()

    const images = inserted.map((record) => ({
      id: record.id,
      prompt: record.prompt,
      description: record.description,
      imagePath: record.imagePath,
      model: record.model,
      aspectRatio: record.aspectRatio,
      seed: record.seed,
      createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

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
