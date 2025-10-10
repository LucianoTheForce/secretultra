export type VideoStudioSource = {
  imageUrl: string
  previewUrl?: string | null
  prompt?: string | null
  description?: string | null
  model?: string | null
  id?: string | null
}

const STORAGE_KEY = "ultragaz-video-studio-source"

export function setVideoStudioSource(source: VideoStudioSource) {
  if (typeof window === "undefined") {
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(source))
  } catch (error) {
    console.error("[video-bridge] failed to store source", error)
  }
}

export function consumeVideoStudioSource(): VideoStudioSource | null {
  if (typeof window === "undefined") {
    return null
  }
  const raw = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as VideoStudioSource
  } catch (error) {
    console.error("[video-bridge] failed to parse source", error)
    return null
  }
}
