import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, type CoreMessage, type ImagePart, type TextPart } from "ai";
import type { SharedV2ProviderOptions } from "@ai-sdk/provider";
import { and, eq, gte, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedImages, user } from "@/lib/schema";
import { PUBLIC_IMAGE_ENGINE_NAME } from "@/lib/constants";
import { createImageKitUrl, imageKit, resolveImageKitFolder } from "@/lib/imagekit";

type GenerateBody = {
  prompt: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number | string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
};

export const runtime = "nodejs";

const DEFAULT_SYSTEM_PROMPT = `You are the lead visual designer for Ultragaz. Generate striking 3D character artwork that feels premium, welcoming, and brand-aligned. Always respect brand colours (Ultragaz blue #004B87, warm highlights) and return vivid, production-ready ideas.`;

const SUPPORTED_IMAGE_MIME = "image/png";
const CHARACTER_SHEET_BASE64_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.base64.txt");
const CHARACTER_SHEET_IMAGE_FILE = path.join(process.cwd(), "public", "ultragaz-character-sheet.png");

let characterSheetBase64Cache: string | null = null;
let characterSheetBase64Promise: Promise<string | null> | null = null;

const INSUFFICIENT_CREDITS = Symbol("INSUFFICIENT_CREDITS");
const INSUFFICIENT_CREDITS_MESSAGE =
  "Voce nao tem creditos suficientes. Peca ao administrador para liberar mais creditos.";
const PUBLIC_IMAGE_ENGINE_RESPONSE = PUBLIC_IMAGE_ENGINE_NAME;

function normalizeBase64(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const data = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed;
  const sanitized = data.replace(/\s/g, "");
  return sanitized.length > 0 ? sanitized : null;
}

async function getCharacterSheetBase64(): Promise<string | null> {
  if (characterSheetBase64Cache) {
    return characterSheetBase64Cache;
  }

  if (characterSheetBase64Promise) {
    return characterSheetBase64Promise;
  }

  characterSheetBase64Promise = (async () => {
    try {
      try {
        const base64Text = await fs.readFile(CHARACTER_SHEET_BASE64_FILE, "utf-8");
        const normalized = normalizeBase64(base64Text);
        if (normalized) {
          characterSheetBase64Cache = normalized;
          return normalized;
        }
      } catch {
        // fall back to reading the binary image if the base64 helper is unavailable
      }

      const imageBuffer = await fs.readFile(CHARACTER_SHEET_IMAGE_FILE);
      const normalized = normalizeBase64(imageBuffer.toString("base64"));
      if (normalized) {
        characterSheetBase64Cache = normalized;
        return normalized;
      }

      return null;
    } catch (error) {
      console.error("Failed to load Ultragaz character sheet", error);
      return null;
    } finally {
      characterSheetBase64Promise = null;
    }
  })();

  return characterSheetBase64Promise;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeModelMentions(input?: string | null): string | null {
  if (input == null) {
    return null;
  }

  return input
    .replace(/google\s+generative\s+ai/gi, "image engine")
    .replace(/gemini/gi, "image engine");
}

function sanitizeErrorMessage(message?: string | null): string {
  const sanitized = sanitizeModelMentions(message ?? "") ?? "";
  const fallback = "O servico de geracao de imagens esta indisponivel no momento. Tente novamente em instantes.";
  return sanitized.trim().length > 0 ? sanitized : fallback;
}

function buildImageKitVariants(filePath: string) {
  return {
    shareUrl: createImageKitUrl(filePath, [{ width: 1200, format: "jpg" }]),
    previewUrl: createImageKitUrl(filePath, [{ width: 512, height: 512, fit: "cover", format: "jpg" }]),
    backgroundRemovedUrl: createImageKitUrl(filePath, [{ effect: "bg-removal", format: "png" }]),
  };
}

export async function POST(req: Request) {
  const uploads: {
    id: string;
    url: string;
    fileId: string;
    filePath: string;
    shareUrl: string;
    previewUrl: string;
    backgroundRemovedUrl: string;
  }[] = [];

  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const dbUser = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as GenerateBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Google Generative AI API key" },
        { status: 500 }
      );
    }

    const modelId =
      process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    const normalizedReferenceImages = (body.referenceImages || [])
      .map((value) => normalizeBase64(value))
      .filter((value): value is string => Boolean(value));

    const referenceImages: string[] = [];
    const characterSheetBase64 = await getCharacterSheetBase64();
    if (characterSheetBase64) {
      referenceImages.push(characterSheetBase64);
    }

    for (const image of normalizedReferenceImages) {
      if (!referenceImages.includes(image)) {
        referenceImages.push(image);
      }
    }

    referenceImages.splice(2);

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nAlways return a detailed written description alongside the generated imagery.`;

    const providerOptions: SharedV2ProviderOptions = {
      google: {
        responseModalities: ["IMAGE", "TEXT"],
        ...(body.aspectRatio ? { aspectRatio: body.aspectRatio } : {}),
        ...(body.personGeneration ? { personGeneration: body.personGeneration } : {}),
      },
    };

    const parsedSeed =
      typeof body.seed === "number"
        ? body.seed
        : typeof body.seed === "string" && body.seed.trim() !== ""
          ? Number(body.seed)
          : undefined;

    const temperature =
      typeof body.temperature === "number" ? clamp(body.temperature, 0, 1) : undefined;

    const runGeneration = async (useReferences: boolean) => {
      const activeReferenceImages = useReferences ? referenceImages : [];
      const userContent: (TextPart | ImagePart)[] = [
        { type: "text", text: prompt },
        ...activeReferenceImages.map<ImagePart>((image) => ({
          type: "image",
          image,
          mediaType: SUPPORTED_IMAGE_MIME,
        })),
      ];

      const messages: CoreMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ];

      return generateText({
        model,
        messages,
        temperature,
        seed: Number.isFinite(parsedSeed) ? parsedSeed : undefined,
        providerOptions,
        maxOutputTokens: 2048,
      });
    };

    let generation: Awaited<ReturnType<typeof generateText>> | null = null;
    let base64Images: string[] = [];
    let lastGenerationError: unknown = null;

    try {
      generation = await runGeneration(true);
      base64Images = generation.files
        .filter((file) => file.mediaType?.startsWith("image/"))
        .map((file) => file.base64);
      if (base64Images.length === 0) {
        throw new Error("NO_IMAGE_RETURNED");
      }
    } catch (error) {
      lastGenerationError = error;
      try {
        generation = await runGeneration(false);
        base64Images = generation.files
          .filter((file) => file.mediaType?.startsWith("image/"))
          .map((file) => file.base64);
      } catch (fallbackError) {
        lastGenerationError = fallbackError;
      }
    }

    if (!generation || base64Images.length === 0) {
      const fallbackMessage =
        lastGenerationError instanceof Error ? lastGenerationError.message : null;

      return NextResponse.json(
        {
          error: "Nao foi possivel gerar uma imagem agora. Tente novamente em instantes.",
          description: sanitizeModelMentions(fallbackMessage),
        },
        { status: 502 }
      );
    }

    const sanitizedDescription = sanitizeModelMentions(generation.text ?? null);
    const cost = base64Images.length;

    if (dbUser.credits < cost) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 });
    }

    const seedValue = Number.isFinite(parsedSeed)
      ? String(parsedSeed)
      : typeof body.seed === "string"
        ? body.seed
        : null;

    const uploadFolder = resolveImageKitFolder(userId);

    try {
      for (const base64Image of base64Images) {
        const id = crypto.randomUUID();
        const upload = await imageKit.upload({
          file: `data:image/png;base64,${base64Image}`,
          fileName: `${id}.png`,
          folder: uploadFolder,
          useUniqueFileName: false,
          overwriteFile: true,
        });
        const variants = buildImageKitVariants(upload.filePath);
        uploads.push({
          id,
          url: upload.url,
          fileId: upload.fileId,
          filePath: upload.filePath,
          ...variants,
        });
      }
    } catch (uploadError) {
      await Promise.all(
        uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {}))
      );
      throw uploadError;
    }

    const { images, remainingCredits, totalGenerated } = await (async () => {
      try {
        return await db.transaction(async (tx) => {
          const creditUpdate = await tx
            .update(user)
            .set({ credits: sql`${user.credits} - ${cost}` })
            .where(and(eq(user.id, userId), gte(user.credits, cost)))
            .returning({ credits: user.credits });

          if (creditUpdate.length === 0) {
            throw INSUFFICIENT_CREDITS;
          }

          const values = uploads.map((upload) => ({
            id: upload.id,
            userId,
            prompt,
            description: sanitizedDescription,
            imagePath: upload.url,
            model: PUBLIC_IMAGE_ENGINE_RESPONSE,
            aspectRatio: body.aspectRatio ?? null,
            seed: seedValue,
            imageKitFileId: upload.fileId,
            shareUrl: upload.shareUrl,
            backgroundRemovedUrl: upload.backgroundRemovedUrl,
            previewUrl: upload.previewUrl,
          }));

          const inserted = await tx.insert(generatedImages).values(values).returning();

          const totalRows = await tx
            .select({ total: sql<number>`count(*)` })
            .from(generatedImages)
            .where(eq(generatedImages.userId, userId));

          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? 0) : values.length;

          return {
            images: inserted.map((record) => ({
              id: record.id,
              prompt: record.prompt,
              description: sanitizeModelMentions(record.description ?? null),
              imagePath: record.imagePath,
              model: PUBLIC_IMAGE_ENGINE_RESPONSE,
              aspectRatio: record.aspectRatio,
              seed: record.seed,
              shareUrl: record.shareUrl,
              backgroundRemovedUrl: record.backgroundRemovedUrl,
              previewUrl: record.previewUrl,
              createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
            })),
            remainingCredits: creditUpdate[0].credits,
            totalGenerated,
          };
        });
      } catch (dbError) {
        await Promise.all(
          uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {}))
        );
        throw dbError;
      }
    })();

    return NextResponse.json({
      images,
      description: sanitizedDescription,
      model: PUBLIC_IMAGE_ENGINE_RESPONSE,
      credits: remainingCredits,
      totalGenerated,
    });
  } catch (error) {
    if (error === INSUFFICIENT_CREDITS) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 });
    }

    console.error("Image generation failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status: 500 });
  }
}


