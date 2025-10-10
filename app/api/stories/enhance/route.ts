import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  STORY_ENHANCER_REQUEST_SCHEMA,
  buildEnhancerSystemPrompt,
  buildEnhancerUserPrompt,
  clampSceneCount,
  extractFirstJsonBlock,
  parseStoryNarrative,
  type StoryNarrative,
} from "@/lib/story-enhancer";

const requestSchema = STORY_ENHANCER_REQUEST_SCHEMA;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    brandVoice: { type: "string" },
    tone: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          title: { type: "string" },
          visualPrompt: { type: "string" },
          copy: { type: "string" },
          summary: { type: "string" },
          keywords: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["title", "visualPrompt"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["title", "scenes"],
  additionalProperties: false,
} as const;

interface GeminiContentPart {
  text?: string | null;
  inlineData?: { data?: string | null } | null;
}

interface GeminiCandidateContent {
  content?: {
    parts?: GeminiContentPart[] | null;
  } | null;
}

function extractCandidateParts(result: unknown): { texts: string[]; inlineData: string[] } {
  const response = (result as {
    response?: { candidates?: GeminiCandidateContent[] | null } | null;
  }).response;

  const texts: string[] = [];
  const inlineData: string[] = [];

  if (!response?.candidates?.length) {
    return { texts, inlineData };
  }

  const parts = response.candidates[0]?.content?.parts ?? [];
  for (const part of parts ?? []) {
    if (!part) continue;
    if (typeof part.text === "string" && part.text.trim().length > 0) {
      texts.push(part.text.trim());
      continue;
    }
    const data = part.inlineData?.data;
    if (typeof data === "string" && data.length > 0) {
      inlineData.push(data);
    }
  }

  return { texts, inlineData };
}

function repairStoryJson(
  raw: string,
  parts?: { texts: string[]; inlineData?: string[] },
): StoryNarrative | null {
  const candidateSet = new Set<string>();

  if (typeof raw === "string" && raw.trim().length > 0) {
    candidateSet.add(raw.trim());
  }

  const segmentTexts = parts?.texts ?? extractCandidateParts({
    response: { candidates: [{ content: { parts: [{ text: raw }] } }] },
  }).texts;

  for (const segment of segmentTexts ?? []) {
    const trimmed = segment?.trim();
    if (trimmed && trimmed.length > 0) {
      candidateSet.add(trimmed);
    }
  }

  for (const candidate of candidateSet) {
    const attempts = buildRepairAttempts(candidate);
    for (const attempt of attempts) {
      try {
        const parsed = parseStoryNarrative(attempt);
        if (parsed) {
          return parsed;
        }
      } catch {
        // ignore parsing errors for repair attempts
      }
    }
  }

  return null;
}

function buildRepairAttempts(source: string): string[] {
  const variants = new Set<string>();
  const trimmed = source.trim();
  if (!trimmed) {
    return [];
  }

  variants.add(trimmed);

  const sanitized = sanitizeJsonCandidate(trimmed);
  if (sanitized && sanitized !== trimmed) {
    variants.add(sanitized);
  }

  const jsonBlock = extractFirstJsonBlock(trimmed);
  if (jsonBlock && jsonBlock !== trimmed) {
    variants.add(jsonBlock);
    const sanitizedBlock = sanitizeJsonCandidate(jsonBlock);
    if (sanitizedBlock && sanitizedBlock !== jsonBlock) {
      variants.add(sanitizedBlock);
    }
  }

  return Array.from(variants);
}

function sanitizeJsonCandidate(candidate: string): string {
  let text = candidate.trimEnd();
  if (!text) {
    return text;
  }

  text = text.replace(/,\s*(?=[\]}])/g, "");

  const closing = buildClosingSequence(text);
  if (closing.length > 0) {
    text = text.replace(/,\s*$/g, "");
    text += closing;
  }

  return text;
}

function buildClosingSequence(input: string): string {
  const stack: string[] = [];
  let closing = "";
  let inString = false;
  let isEscaped = false;

  for (const char of input) {
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

  if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      continue;
    }

    if (char === '}' || char === ']') {
      const last = stack[stack.length - 1];
      if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
        stack.pop();
      }
      continue;
    }
  }

  if (inString) {
    closing += '"';
  }

  while (stack.length > 0) {
    const opener = stack.pop();
    closing += opener === '{' ? '}' : ']';
  }

  return closing;
}

const MODEL_MISSING_ERROR = "Missing Google Generative AI API key";

function resolveApiKey(): string | null {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

function resolveModelId(): string {
  return (
    process.env.GEMINI_STORY_MODEL ||
    process.env.GEMINI_TEXT_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-2.0-flash-thinking-exp"
  );
}



export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: z.infer<typeof requestSchema>;
    try {
      const json = await req.json();
      payload = requestSchema.parse(json);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request", issues: error.issues },
          { status: 422 },
        );
      }
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const apiKey = resolveApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: MODEL_MISSING_ERROR }, { status: 500 });
    }

    const modelId = resolveModelId();
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelId);

    const sceneCount = clampSceneCount(payload.sceneCount);
    const systemPrompt = buildEnhancerSystemPrompt();
    const userPrompt = buildEnhancerUserPrompt({
      basePrompt: payload.prompt,
      sceneCount,
      tone: payload.tone,
      language: payload.language ?? "pt-BR",
    });

    const providerOptions = {
      google: {
        responseModalities: ["TEXT"],
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    } as const;

    const maxAttempts = Math.max(
      1,
      Number.parseInt(process.env.STORY_ENHANCE_MAX_ATTEMPTS ?? "2", 10),
    );
    const retryInstruction = payload.language === "en-US"
      ? "Return only a valid JSON object. No commentary or markdown."
      : "Retorne apenas um objeto JSON valido. Nada de comentarios ou texto extra.";

    let lastFailure: {
      responseText: string;
      candidateParts: ReturnType<typeof extractCandidateParts>;
    } | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const attemptPrompt =
        attempt === 1
          ? userPrompt
          : `${userPrompt}

${retryInstruction}`;

      const generation = await generateText({
        model,
        system: systemPrompt,
        prompt: attemptPrompt,
        providerOptions,
        maxOutputTokens: 2048,
      });

      const candidateParts = extractCandidateParts(generation);
      const primaryText =
        typeof generation.text === "string" && generation.text.trim().length > 0
          ? generation.text.trim()
          : null;
      const secondaryText = (generation as { responseText?: string | null }).responseText;
      const fallbackText =
        candidateParts.texts.length > 0 ? candidateParts.texts.join("\n\n") : "";
      const responseText =
        primaryText ??
        (typeof secondaryText === "string" && secondaryText.trim().length > 0
          ? secondaryText.trim()
          : null) ??
        fallbackText;

      lastFailure = { responseText, candidateParts };

      let story = parseStoryNarrative(responseText);

      if (!story && process.env.NODE_ENV !== "production") {
        const repaired = repairStoryJson(responseText, candidateParts);
        if (repaired) {
          story = repaired;
          console.warn(
            `[stories/enhance] repaired narrative via heuristics (attempt ${attempt})`,
          );
        }
      }

      if (story) {
        return NextResponse.json({
          story,
          enhancerModel: modelId,
          raw: responseText,
          rawSegments: candidateParts.texts,
          inlineDataCount: candidateParts.inlineData.length,
        });
      }

      console.warn(
        `[stories/enhance] unparsed narrative (attempt ${attempt})`,
        responseText,
      );
    }

    const errorPayload = lastFailure
      ? {
          error: "Failed to build story narrative from model output.",
          raw: lastFailure.responseText,
          rawSegments: lastFailure.candidateParts.texts,
          inlineDataCount: lastFailure.candidateParts.inlineData.length,
        }
      : { error: "Failed to build story narrative from model output." };

    return NextResponse.json(errorPayload, { status: 502 });
  } catch (error) {
    console.error("[stories/enhance] failure", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

