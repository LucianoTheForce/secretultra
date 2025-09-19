// Core Types for AI Character Generation Studio

export type CharacterId = "ULLY" | "ULTRINHO" | "CUSTOM"

export interface Character {
  id: string
  name: string
  description: string
  baseModel: string
  thumbnailUrl: string
  previewImage: string
  referenceImages: string[]
}

export type AssetType = "image" | "video" | "mask" | "reference"

export interface Asset {
  id: string
  type: AssetType
  url: string
  thumbUrl: string
  width: number
  height: number
  durationMs?: number
  createdAt: Date
  meta: Record<string, unknown>
}

export type PoseId = string
export type ExpressionId = string
export type BackgroundId = string

export interface Prompt {
  text: string
  negatives?: string
  styleRefs?: Asset[]
  pose?: PoseId
  expression?: ExpressionId
  background?: BackgroundId
  creativity: number
  seed?: number | "random"
}

export type GenerationStatus = "queued" | "running" | "succeeded" | "failed"
export type GenerationMode = "text" | "image+text"

export interface GenerationJob {
  id: string
  character: CharacterId
  mode: GenerationMode
  refs?: Asset[]
  prompt: Prompt
  status: GenerationStatus
  output?: Asset[]
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface HistoryNode {
  id: string
  parentId?: string
  action: string
  assetIds: string[]
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  assets: Asset[]
  jobs: GenerationJob[]
  historyTree: HistoryNode[]
  createdAt: Date
  updatedAt: Date
}

export interface CreditTransaction {
  id: string
  jobId?: string
  delta: number
  reason: string
  at: Date
}

export interface CreditLedger {
  available: number
  spent: number
  history: CreditTransaction[]
}

// Preset Types
export interface PresetCard {
  id: string
  label: string
  preview: string
  tags: string[]
  category: "pose" | "expression" | "background"
}

export interface CharacterSheet {
  id: CharacterId
  name: string
  description: string
  referenceImages: Asset[]
  previewImage: string
}

// UI State Types
export interface CanvasState {
  zoom: number
  pan: { x: number; y: number }
  selectedAssets: string[]
  maskMode: boolean
  brushSize: number
  brushHardness: number
}

export interface GenerationSettings {
  size: { width: number; height: number }
  variations: number
  quality: "standard" | "hd"
  synthIdWatermark: boolean
}

// User and Auth Types (Mock)
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
}

export interface UserSession {
  user: User
  credits: CreditLedger
  preferences: {
    theme: "light" | "dark" | "system"
    defaultCharacter: CharacterId
    autoSave: boolean
  }
}