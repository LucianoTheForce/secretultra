import fs from "fs/promises"
import path from "path"
import "dotenv/config"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

const OUTPUT_DIR = path.join(process.cwd(), "public", "presets", "ultrinho")
const CHARACTER_SHEET_BASE64_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.base64.txt")
const CHARACTER_SHEET_IMAGE_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.png")
const PERSON_GENERATION = "allow_all"

const PRESETS = [
  {
    id: "pose-andando",
    prompt: "Ultrinho andando com passo curto, corpo inteiro centralizado, vista frontal, em estúdio branco puro, mesmo enquadramento padrão",
  },
  {
    id: "pose-correndo",
    prompt: "Ultrinho correndo com energia, corpo inteiro centralizado, fundo branco puro sem textura, iluminação uniforme",
  },
]

function normalizeBase64(input) {
  if (!input) return null
  const trimmed = input.trim()
  const data = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed
  const sanitized = data.replace(/\s/g, "")
  return sanitized.length > 0 ? sanitized : null
}

let characterSheetCache = null
let characterSheetPromise = null

async function getCharacterSheetBase64() {
  if (characterSheetCache) return characterSheetCache
  if (characterSheetPromise) return characterSheetPromise

  characterSheetPromise = (async () => {
    try {
      try {
        const base64Text = await fs.readFile(CHARACTER_SHEET_BASE64_FILE, "utf-8")
        const normalized = normalizeBase64(base64Text)
        if (normalized) {
          characterSheetCache = normalized
          return normalized
        }
      } catch (error) {
        // fallback below
      }

      const buffer = await fs.readFile(CHARACTER_SHEET_IMAGE_FILE)
      const normalized = normalizeBase64(buffer.toString("base64"))
      if (normalized) {
        characterSheetCache = normalized
        return normalized
      }

      return null
    } finally {
      characterSheetPromise = null
    }
  })()

  return characterSheetPromise
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

async function main() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error("Missing Google Generative AI API key. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY.")
  }

  const modelId =
    process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview"

  const google = createGoogleGenerativeAI({ apiKey })
  const model = google(modelId)

  await ensureOutputDir()

  const referenceImage = await getCharacterSheetBase64()
  if (!referenceImage) {
    throw new Error("Could not load Ultragaz character sheet reference image")
  }

  for (const preset of PRESETS) {
    console.log(`Regenerating ${preset.id}...`)

    const messages = [
      {
        role: "system",
        content: "Você gera imagens do mascote Ultrinho em estúdio branco, mantendo o corpo inteiro centralizado e uniforme.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: preset.prompt },
          { type: "image", image: referenceImage, mediaType: "image/png" },
        ],
      },
    ]

    const providerOptions = {
      google: {
        responseModalities: ["IMAGE", "TEXT"],
        aspectRatio: "1:1",
        personGeneration: PERSON_GENERATION,
      },
    }

    const generation = await generateText({
      model,
      messages,
      temperature: 0.15,
      providerOptions,
      maxOutputTokens: 1024,
    })

    const imageFile = generation.files.find((file) => file.mediaType?.startsWith("image/"))
    if (!imageFile?.base64) {
      console.warn(`No image returned for ${preset.id}`)
      continue
    }

    const buffer = Buffer.from(imageFile.base64, "base64")
    const outputPath = path.join(OUTPUT_DIR, `${preset.id}.png`)
    await fs.writeFile(outputPath, buffer)
    console.log(`Saved ${outputPath}`)
  }

  console.log("Finished regenerating selected presets.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
