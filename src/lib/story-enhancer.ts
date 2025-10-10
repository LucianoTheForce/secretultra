import { z } from "zod";

export const STORY_SCENE_SCHEMA = z.object({
  index: z.number().int().nonnegative().optional(),
  title: z.string().min(1, "Scene title is required"),
  visualPrompt: z.string().min(1, "Scene prompt is required"),
  copy: z.string().optional(),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const STORY_NARRATIVE_SCHEMA = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  brandVoice: z.string().optional(),
  tone: z.string().optional(),
  scenes: z.array(STORY_SCENE_SCHEMA).min(1),
});

export type StoryScene = z.infer<typeof STORY_SCENE_SCHEMA> & { index: number };
export type StoryNarrative = z.infer<typeof STORY_NARRATIVE_SCHEMA> & {
  scenes: StoryScene[];
};

export const STORY_ENHANCER_REQUEST_SCHEMA = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  sceneCount: z.number().int().min(2).max(10).optional(),
  tone: z.string().max(120).optional(),
  language: z.enum(["pt-BR", "en-US"]).optional(),
});

export type StoryEnhancerRequest = z.infer<
  typeof STORY_ENHANCER_REQUEST_SCHEMA
>;

export function clampSceneCount(value: number | undefined): number {
  const fallback = 4;
  if (!Number.isFinite(value ?? NaN)) {
    return fallback;
  }
  return Math.max(2, Math.min(10, Math.trunc(value as number)));
}

const BRAND_CONTEXT = `
Você é estrategista criativo da Ultragaz. A marca utiliza o personagem Ultrinho para transmitir proximidade, segurança e inovação. Todo conteúdo precisa refletir os valores de:
- Conveniência e agilidade
- Segurança com tecnologia de ponta
- Calor humano e proximidade com as famílias brasileiras

Diretrizes de tom:
- Voz positiva, inspiradora e acessível.
- Sempre inclua elementos que remetam ao universo de energia, gás, mobilidade ou serviços inteligentes da Ultragaz.
- Evite jargões técnicos sem explicação.
`;

export function buildEnhancerSystemPrompt(): string {
  return `${BRAND_CONTEXT}
Gere narrativas curtas destinadas a carrosséis, animações ou vídeos curtos.`;
}

export function buildEnhancerUserPrompt(params: {
  basePrompt: string;
  sceneCount: number;
  tone?: string;
  language?: "pt-BR" | "en-US";
}): string {
  const { basePrompt, sceneCount, tone, language = "pt-BR" } = params;
  const instructions = [
    `Base prompt fornecido pelo usuário: "${basePrompt}"`,
    `Divida a história em exatamente ${sceneCount} cenas numeradas começando em 1.`,
    `Cada cena deve conter: titulo (curto), resumo opcional, visualPrompt (descrição visual rica para IA gerar imagem) e copy motivacional.`,
    `Respeite integralmente a identidade da Ultragaz descrita no contexto.`,
    `Retorne o resultado em JSON válido com o formato: {"title": string, "summary": string, "scenes": [{"index": number, "title": string, "visualPrompt": string, "copy": string, "summary": string}]}.`,
  ];

  if (tone && tone.trim().length > 0) {
    instructions.push(`Adote o tom descrito a seguir: ${tone.trim()}.`);
  }

  instructions.push(
    language === "en-US"
      ? "Escreva o JSON inteiro em inglês, mantendo os nomes das chaves em inglês."
      : "Escreva o JSON inteiro em português do Brasil, mantendo os nomes das chaves em inglês.",
  );

  instructions.push(
    "Retorne apenas o JSON, sem texto adicional antes ou depois.",
  );

  return instructions.join("\n\n");
}

export function extractFirstJsonBlock(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const text = value.trim();
  const braceIndex = text.indexOf("{");
  const bracketIndex = text.indexOf("[");
  let start = -1;
  let opening: string | null = null;
  let closing: string | null = null;

  if (braceIndex !== -1 && (bracketIndex === -1 || braceIndex < bracketIndex)) {
    start = braceIndex;
    opening = "{";
    closing = "}";
  } else if (bracketIndex !== -1) {
    start = bracketIndex;
    opening = "[";
    closing = "]";
  }

  if (start === -1 || !opening || !closing) {
    return null;
  }

  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === opening) {
      depth += 1;
    } else if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseStoryNarrative(raw: string): StoryNarrative | null {
  const jsonBlock = extractFirstJsonBlock(raw);
  if (!jsonBlock) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonBlock);
    const result = STORY_NARRATIVE_SCHEMA.safeParse(parsed);
    if (!result.success) {
      return null;
    }

    const scenes = result.data.scenes.map((scene, idx) => ({
      ...scene,
      index: typeof scene.index === "number" ? scene.index : idx + 1,
    }));

    return {
      ...result.data,
      scenes,
    };
  } catch {
    return null;
  }
}
