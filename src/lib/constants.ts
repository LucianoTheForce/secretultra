import type { Character, PresetCard } from "@/types"

export const CHARACTER_SHEETS: Record<string, Character> = {
  ULLY: {
    id: "ULLY",
    name: "Ully",
    description: "O mascote oficial da Ultragaz, simpatico e carismatico",
    baseModel: "ully-v1",
    thumbnailUrl: "/placeholder-logo.png",
    previewImage: "/ultragaz-character-in-living-room.jpg",
    referenceImages: [
      "/ultragaz-character-in-living-room.jpg",
      "/placeholder-logo.png",
    ],
  },
  ULTRINHO: {
    id: "ULTRINHO",
    name: "Ultrinho",
    description: "Versao infantil do mascote, perfeito para conteudo kids",
    baseModel: "ultrinho-v1",
    thumbnailUrl: "/placeholder-logo.png",
    previewImage: "/3d-boy-character-with-glasses.jpg",
    referenceImages: [
      "/3d-boy-character-with-glasses.jpg",
      "/placeholder-logo.png",
    ],
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Character",
    description: "Create your own unique character design",
    baseModel: "custom-v1",
    thumbnailUrl: "/placeholder.svg",
    previewImage: "/placeholder.svg",
    referenceImages: [],
  },
}

export const POSE_PRESETS: PresetCard[] = [
  {
    id: "standing-neutral",
    label: "Standing Neutral",
    preview: "/character-standing-front-pose.jpg",
    tags: ["standing", "neutral", "front"],
    category: "pose",
  },
  {
    id: "jumping",
    label: "Jumping",
    preview: "/character-jumping-pose.jpg",
    tags: ["action", "dynamic", "jumping"],
    category: "pose",
  },
  {
    id: "sitting",
    label: "Sitting",
    preview: "/placeholder.jpg",
    tags: ["sitting", "relaxed"],
    category: "pose",
  },
  {
    id: "walking",
    label: "Walking",
    preview: "/placeholder.jpg",
    tags: ["walking", "movement"],
    category: "pose",
  },
  {
    id: "waving",
    label: "Waving",
    preview: "/placeholder.jpg",
    tags: ["greeting", "friendly"],
    category: "pose",
  },
  {
    id: "thumbs-up",
    label: "Thumbs Up",
    preview: "/placeholder.jpg",
    tags: ["positive", "approval"],
    category: "pose",
  },
]

export const EXPRESSION_PRESETS: PresetCard[] = [
  {
    id: "happy",
    label: "Happy",
    preview: "/3d-character-in-hoodie.jpg",
    tags: ["happy", "smile", "positive"],
    category: "expression",
  },
  {
    id: "excited",
    label: "Excited",
    preview: "/3d-character-in-red-hoodie.jpg",
    tags: ["excited", "energetic"],
    category: "expression",
  },
  {
    id: "surprised",
    label: "Surprised",
    preview: "/placeholder.jpg",
    tags: ["surprised", "shocked"],
    category: "expression",
  },
  {
    id: "thinking",
    label: "Thinking",
    preview: "/placeholder.jpg",
    tags: ["thinking", "contemplative"],
    category: "expression",
  },
  {
    id: "confident",
    label: "Confident",
    preview: "/placeholder.jpg",
    tags: ["confident", "proud"],
    category: "expression",
  },
  {
    id: "neutral",
    label: "Neutral",
    preview: "/placeholder.jpg",
    tags: ["neutral", "calm"],
    category: "expression",
  },
]

export const BACKGROUND_PRESETS: PresetCard[] = [
  {
    id: "office",
    label: "Modern Office",
    preview: "/placeholder.jpg",
    tags: ["office", "professional", "indoor"],
    category: "background",
  },
  {
    id: "living-room",
    label: "Living Room",
    preview: "/ultragaz-character-in-living-room.jpg",
    tags: ["home", "cozy", "indoor"],
    category: "background",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    preview: "/placeholder.jpg",
    tags: ["home", "kitchen", "indoor"],
    category: "background",
  },
  {
    id: "park",
    label: "Park",
    preview: "/placeholder.jpg",
    tags: ["outdoor", "nature", "park"],
    category: "background",
  },
  {
    id: "street",
    label: "City Street",
    preview: "/placeholder.jpg",
    tags: ["outdoor", "urban", "city"],
    category: "background",
  },
  {
    id: "plain",
    label: "Plain Background",
    preview: "/placeholder.jpg",
    tags: ["plain", "simple", "studio"],
    category: "background",
  },
]

export const QUALITY_TIPS = [
  {
    condition: (text: string) => text.length < 10,
    tip: "Your prompt is too short. Add more descriptive details for better results.",
    severity: "error" as const,
  },
  {
    condition: (text: string) => text.length > 500,
    tip: "Your prompt might be too long. Consider simplifying for more focused results.",
    severity: "warning" as const,
  },
  {
    condition: (text: string) =>
      !text.includes("Ultragaz") && !text.includes("Ully") && !text.includes("Ultrinho"),
    tip: "Consider mentioning the character name for better consistency.",
    severity: "info" as const,
  },
  {
    condition: (text: string) => text.includes("3D") || text.includes("render"),
    tip: "Great! Specifying 3D style helps achieve the desired look.",
    severity: "info" as const,
  },
]

export const MOCK_GENERATION_TIME = 3000

export const CREDIT_COSTS = {
  generation: 10,
  highQuality: 20,
  animation: 50,
}

export const PUBLIC_IMAGE_ENGINE_NAME = "Ultragaz Studio Engine";

