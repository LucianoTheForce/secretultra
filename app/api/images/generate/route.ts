import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, type CoreMessage, type ImagePart, type TextPart } from "ai";

import { and, eq, gte, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasAdminAccess, isMasterAdminEmail } from "@/lib/master-admin";
import { generatedImages, user } from "@/lib/schema";
import { PUBLIC_IMAGE_ENGINE_NAME } from "@/lib/constants";
import { createImageKitUrl, imageKit, resolveImageKitFolder } from "@/lib/imagekit";

type ImageEngine = "fal" | "gemini";

type GenerateBody = {
  prompt: string;
  referenceImages?: string[];
  temperature?: number;
  seed?: number | string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
  engine?: ImageEngine;
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
    .replace(/gemini/gi, "image engine")
    .replace(/fal(\.ai)?/gi, "image engine");
}

function sanitizeErrorMessage(message?: string | null): string {
  const sanitized = sanitizeModelMentions(message ?? "") ?? "";
  const fallback = "O servico de geracao de imagens esta indisponivel no momento. Tente novamente em instantes.";
  return sanitized.trim().length > 0 ? sanitized : fallback;
}

type GeneratedImageAsset =
  | { kind: "base64"; data: string; mediaType: string }
  | { kind: "url"; url: string; mediaType: string };

function mapFalImageToAsset(item: { url?: string | null }): GeneratedImageAsset | null {
  const url = typeof item?.url === "string" ? item.url : null;
  if (!url) {
    return null;
  }

  if (url.startsWith("data:")) {
    const match = url.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
      return {
        kind: "base64",
        data: match[2],
        mediaType: match[1] || "image/png",
      };
    }
  }

  if (url.startsWith("http")) {
    return {
      kind: "url",
      url,
      mediaType: "image/png",
    };
  }

  return null;
}

function extractGeneratedImageAssets(
  result: Awaited<ReturnType<typeof generateText>> | null,
): GeneratedImageAsset[] {
  if (!result) {
    return [];
  }

  const assets = new Map<string, GeneratedImageAsset>();

  type GenerationFile = { mediaType?: string | null; base64?: string | null; fileUrl?: string | null };
  const files = Array.isArray((result as { files?: GenerationFile[] }).files)
    ? ((result as { files?: GenerationFile[] }).files as GenerationFile[])
    : [];

  for (const file of files) {
    const mediaType = typeof file.mediaType === "string" ? file.mediaType : "image/png";
    if (!mediaType.startsWith("image/")) {
      continue;
    }

    const base64 = normalizeBase64(file.base64 ?? null);
    if (base64) {
      assets.set(`base64:${base64}`, { kind: "base64", data: base64, mediaType });
      continue;
    }

    const fileUrl = typeof file.fileUrl === "string" ? file.fileUrl : undefined;
    if (fileUrl && fileUrl.startsWith("http")) {
      assets.set(`url:${fileUrl}`, { kind: "url", url: fileUrl, mediaType });
    }
  }

  type GenerationCandidate = { content?: { parts?: unknown[] } };
  type CandidatePart = {
    inlineData?: { data?: string; mediaType?: string };
    fileData?: { fileUri?: string; mediaType?: string };
  };

  const candidates = (result as { response?: { candidates?: GenerationCandidate[] } }).response?.candidates ?? [];
  for (const candidate of candidates) {
    const parts = (candidate?.content?.parts ?? []) as CandidatePart[];
    for (const part of parts) {
      const inlineData = part.inlineData;
      if (inlineData?.data) {
        const mediaType = inlineData.mediaType ?? "image/png";
        if (mediaType.startsWith("image/")) {
          const normalized = normalizeBase64(inlineData.data);
          if (normalized) {
            assets.set(`base64:${normalized}`, {
              kind: "base64",
              data: normalized,
              mediaType,
            });
          }
        }
      }

      const fileData = part.fileData;
      if (fileData?.fileUri) {
        const mediaType = fileData.mediaType ?? "image/png";
        if (mediaType.startsWith("image/")) {
          const fileUri = fileData.fileUri;
          if (fileUri.startsWith("http")) {
            assets.set(`url:${fileUri}`, {
              kind: "url",
              url: fileUri,
              mediaType,
            });
          }
        }
      }
    }
  }

  return Array.from(assets.values());
}

function mediaTypeToExtension(mediaType: string): string {
  const lookup: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };
  return lookup[mediaType.toLowerCase()] ?? "png";
}

async function downloadImageAsBase64(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fal image download failed: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    base64: buffer.toString("base64"),
    mediaType: contentType,
  };
}

async function normalizeAssetsToBase64(assets: GeneratedImageAsset[]) {
  return Promise.all(
    assets.map(async (asset) => {
      if (asset.kind === "base64") {
        return { base64: asset.data, mediaType: asset.mediaType };
      }
      const downloaded = await downloadImageAsBase64(asset.url);
      return { base64: downloaded.base64, mediaType: downloaded.mediaType ?? asset.mediaType };
    }),
  );
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
    const email = session.user.email ?? null;

    const dbUser = await db
      .select({ credits: user.credits, isAdmin: user.isAdmin, email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.isAdmin && hasAdminAccess(email)) {
      await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId));
    }

    const isMasterAdmin = isMasterAdminEmail(email);

    const body = (await req.json()) as GenerateBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const falApiKey = (process.env.FAL_API_KEY ?? "").trim();
    const requestedEngineRaw = typeof body.engine === "string" ? body.engine.toLowerCase() : undefined;
    const requestedEngine =
      requestedEngineRaw === "fal" || requestedEngineRaw === "gemini"
        ? (requestedEngineRaw as ImageEngine)
        : undefined;
    const engine: ImageEngine = requestedEngine ?? (falApiKey ? "fal" : "gemini");

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

    const parsedSeed =
      typeof body.seed === "number"
        ? body.seed
        : typeof body.seed === "string" && body.seed.trim() !== ""
          ? Number(body.seed)
          : undefined;

    const temperature =
      typeof body.temperature === "number" ? clamp(body.temperature, 0, 1) : undefined;

    let generationDescription: string | null = null;
    let generatedAssets: GeneratedImageAsset[] = [];
    let lastGenerationError: unknown = null;
    let imageUrls: string[] = [];

    if (engine === "fal") {
      if (!falApiKey) {
        return NextResponse.json(
          { error: "Missing fal.ai API key" },
          { status: 500 },
        );
      }

      imageUrls =
        referenceImages.length > 0
          ? referenceImages.map((image) => `data:${SUPPORTED_IMAGE_MIME};base64,${image}`)
          : [];

      if (imageUrls.length === 0) {
        return NextResponse.json(
          {
            error: "Nenhuma imagem de referencia disponivel para enviar ao motor de edicao.",
          },
          { status: 422 },
        );
      }

      try {
        const falResponse = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
          method: "POST",
          headers: {
            Authorization: `Key ${falApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            image_urls: imageUrls,
            num_images: 1,
            output_format: "png",
            sync_mode: true,
          }),
        });

        if (!falResponse.ok) {
          const payload = await falResponse.json().catch(() => ({}));
          const message =
            typeof payload.error === "string"
              ? payload.error
              : `Fal AI request failed: ${falResponse.status}`;
          throw new Error(message);
        }

        const falData = await falResponse.json();
        generationDescription =
          typeof falData.description === "string" ? falData.description : null;

        const falImages = Array.isArray(falData.images)
          ? (falData.images as Array<{ url?: string | null }>)
          : [];

        generatedAssets = falImages
          .map((item) => mapFalImageToAsset(item))
          .filter((value): value is GeneratedImageAsset => value !== null);
      } catch (error) {
        lastGenerationError = error;
      }
    } else {
      const apiKey =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { error: "Missing Google Generative AI API key" },
          { status: 500 },
        );
      }

      const modelId =
        process.env.GEMINI_IMAGE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

      const google = createGoogleGenerativeAI({ apiKey });
      const model = google(modelId);

      const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nAlways return a detailed written description alongside the generated imagery.`;

      const providerOptions = {
        google: {
          responseModalities: ["IMAGE", "TEXT"],
          ...(body.aspectRatio ? { aspectRatio: body.aspectRatio } : {}),
          ...(body.personGeneration ? { personGeneration: body.personGeneration } : {}),
        },
      } as const;

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

      try {
        generation = await runGeneration(referenceImages.length > 0);
        generatedAssets = extractGeneratedImageAssets(generation);
        if (generatedAssets.length === 0) {
          throw new Error("NO_IMAGE_RETURNED");
        }
        generationDescription = generation.text ?? null;
      } catch (error) {
        lastGenerationError = error;
        try {
          generation = await runGeneration(false);
          generatedAssets = extractGeneratedImageAssets(generation);
          generationDescription = generation?.text ?? generationDescription;
        } catch (fallbackError) {
          lastGenerationError = fallbackError;
        }
      }
    }

    if (generatedAssets.length === 0) {
      const fallbackMessage =
        lastGenerationError instanceof Error ? lastGenerationError.message : null;

      const debugInfo = {
        provider: engine,
        referenceCount: referenceImages.length,
        imageUrlCount: engine === "fal" ? imageUrls.length : null,
        assetCount: generatedAssets.length,
        description: generationDescription,
        lastError: fallbackMessage,
      };
      console.error("[images/generate] no assets returned", debugInfo);

      const debugPayload =
        process.env.NODE_ENV !== "production"
          ? { debug: debugInfo }
          : undefined;

      return NextResponse.json(
        {
          error: "Nao foi possivel gerar uma imagem agora. Tente novamente em instantes.",
          description: sanitizeModelMentions(fallbackMessage),
          ...debugPayload,
        },
        { status: 502 },
      );
    }

    const sanitizedDescription = sanitizeModelMentions(generationDescription);

    const normalizedAssets = await normalizeAssetsToBase64(generatedAssets);
    const cost = normalizedAssets.length;

    if (!isMasterAdmin && dbUser.credits < cost) {
      return NextResponse.json({ error: INSUFFICIENT_CREDITS_MESSAGE }, { status: 402 });
    }

    const seedValue = Number.isFinite(parsedSeed)
      ? String(parsedSeed)
      : typeof body.seed === "string"
        ? body.seed
        : null;

    const uploadFolder = resolveImageKitFolder(userId);

    try {
      for (const asset of normalizedAssets) {
        const id = crypto.randomUUID();
        const extension = mediaTypeToExtension(asset.mediaType);
        const fileName = `${id}.${extension}`;
        const filePayload = `data:${asset.mediaType};base64,${asset.base64}`;
        const upload = await imageKit.upload({
          file: filePayload,
          fileName,
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
        uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {})),
      );
      throw uploadError;
    }

    const providerLabel =
      engine === "fal" ? PUBLIC_IMAGE_ENGINE_RESPONSE : "Gemini Image Engine";

    const values = uploads.map((upload) => ({
      id: upload.id,
      userId,
      prompt,
      description: sanitizedDescription,
      imagePath: upload.url,
      model: providerLabel,
      aspectRatio: body.aspectRatio ?? null,
      seed: seedValue,
      imageKitFileId: upload.fileId,
      shareUrl: upload.shareUrl,
      backgroundRemovedUrl: upload.backgroundRemovedUrl,
      previewUrl: upload.previewUrl,
    }));

    const { images, remainingCredits, totalGenerated } = await (async () => {
      try {
        if (isMasterAdmin) {
          return await db.transaction(async (tx) => {
            const inserted = await tx.insert(generatedImages).values(values).returning();

            const totalRows = await tx
              .select({ total: sql<number>`count(*)` })
              .from(generatedImages)
              .where(eq(generatedImages.userId, userId));

            const totalGeneratedCount =
              totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;

            return {
              images: inserted.map((record) => ({
                id: record.id,
                prompt: record.prompt,
                description: sanitizeModelMentions(record.description ?? null),
                imagePath: record.imagePath,
                model: providerLabel,
                aspectRatio: record.aspectRatio,
                seed: record.seed,
                shareUrl: record.shareUrl,
                backgroundRemovedUrl: record.backgroundRemovedUrl,
                previewUrl: record.previewUrl,
                createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
              })),
              remainingCredits: dbUser.credits,
              totalGenerated: totalGeneratedCount,
            };
          });
        }

        return await db.transaction(async (tx) => {
          const creditUpdate = await tx
            .update(user)
            .set({ credits: sql`${user.credits} - ${cost}` })
            .where(and(eq(user.id, userId), gte(user.credits, cost)))
            .returning({ credits: user.credits });

          if (creditUpdate.length === 0) {
            throw INSUFFICIENT_CREDITS;
          }

          const inserted = await tx.insert(generatedImages).values(values).returning();

          const totalRows = await tx
            .select({ total: sql<number>`count(*)` })
            .from(generatedImages)
            .where(eq(generatedImages.userId, userId));

          const totalGenerated = totalRows.length > 0 ? Number(totalRows[0].total ?? values.length) : values.length;

          return {
            images: inserted.map((record) => ({
              id: record.id,
              prompt: record.prompt,
              description: sanitizeModelMentions(record.description ?? null),
              imagePath: record.imagePath,
              model: providerLabel,
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
          uploads.map((item) => imageKit.deleteFile(item.fileId).catch(() => {})),
        );
        throw dbError;
      }
    })();

    return NextResponse.json({
      images,
      description: sanitizedDescription,
      model: providerLabel,
      credits: remainingCredits,
      totalGenerated,
      hasUnlimitedCredits: isMasterAdmin,
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

