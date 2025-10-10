"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from "react"
import Image from "next/image"
import { Check, Filter, Loader2, Play, Video as VideoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/types"

type MediaGalleryProps = {
  items: GeneratedImage[]
  isLoading?: boolean
  selectedId?: string | null
  selectedIds?: Set<string>
  onSelect?: (
    item: GeneratedImage,
    event?: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>,
  ) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onSendToVideo?: (item: GeneratedImage) => void
  className?: string
  emptyState?: ReactNode
  showDescription?: boolean
}

type SelectionBox = {
  left: number
  top: number
  width: number
  height: number
}

type DragState = {
  pointerId: number
  originX: number
  originY: number
  started: boolean
}

type SelectionSnapshot = {
  ids: string[]
  set: Set<string>
}

const EMPTY_SET: ReadonlySet<string> = new Set()
const DRAG_THRESHOLD = 4

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
})

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Data desconhecida"
  }
  return dateFormatter.format(date)
}

const LOADING_PLACEHOLDERS = Array.from({ length: 6 })

export function MediaGallery({
  items,
  isLoading = false,
  selectedId,
  selectedIds,
  onSelect,
  onSelectionChange,
  onSendToVideo,
  className,
  emptyState,
  showDescription = true,
}: MediaGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  const dragStateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)

  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const [dragSelection, setDragSelection] = useState<SelectionSnapshot | null>(null)

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, item: GeneratedImage) => {
      if (!onSelect) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onSelect(item, event)
      }
    },
    [onSelect],
  )

  const renderEmptyState = () => {
    if (emptyState) return emptyState
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/50">
        <Filter className="h-6 w-6 text-white/30" />
        <div>
          <p className="text-sm font-medium tracking-wide text-white">Nenhuma imagem encontrada</p>
          <p className="mt-1 text-xs text-white/40">
            Ajuste os filtros ou gere novas artes para ve-las aqui.
          </p>
        </div>
      </div>
    )
  }

  const selectionOrder = useMemo(() => {
    if (dragSelection) return dragSelection.ids
    if (!selectedIds || selectedIds.size === 0) return []
    return items.filter((item) => selectedIds.has(item.id)).map((item) => item.id)
  }, [dragSelection, items, selectedIds])

  const activeSelectionSet = dragSelection?.set ?? selectedIds ?? EMPTY_SET
  const hasExternalSelection = dragSelection !== null || (selectedIds != null && selectedIds.size > 0)

  const updateSelectionBox = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragStateRef.current
      const container = containerRef.current
      if (!state || !container) return

      const rect = container.getBoundingClientRect()
      const x1 = Math.min(state.originX, clientX)
      const x2 = Math.max(state.originX, clientX)
      const y1 = Math.min(state.originY, clientY)
      const y2 = Math.max(state.originY, clientY)

      setSelectionBox({
        left: x1 - rect.left,
        top: y1 - rect.top,
        width: x2 - x1,
        height: y2 - y1,
      })

      const selected = items
        .filter((item) => {
          const element = itemRefs.current.get(item.id)
          if (!element) return false
          const itemRect = element.getBoundingClientRect()
          return !(
            itemRect.right < x1 ||
            itemRect.left > x2 ||
            itemRect.bottom < y1 ||
            itemRect.top > y2
          )
        })
        .map((item) => item.id)

      setDragSelection({ ids: selected, set: new Set(selected) })
    },
    [items],
  )

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const container = containerRef.current
    if (!container) return

    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-gallery-item="true"]')) {
      return
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      started: false,
    }

    setSelectionBox(null)
    setDragSelection(null)
    suppressClickRef.current = true
    container.setPointerCapture(event.pointerId)
    event.preventDefault()
  }, [])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current
      if (!state || event.pointerId !== state.pointerId) return

      const dx = Math.abs(event.clientX - state.originX)
      const dy = Math.abs(event.clientY - state.originY)
      const distance = Math.max(dx, dy)

      if (!state.started) {
        if (distance < DRAG_THRESHOLD) {
          return
        }
        state.started = true
      }

      event.preventDefault()
      updateSelectionBox(event.clientX, event.clientY)
    },
    [updateSelectionBox],
  )

  const finalizeDragSelection = useCallback(
    (commit: boolean) => {
      if (commit) {
        const ids = dragSelection?.ids ?? []
        onSelectionChange?.(ids)
      }

      dragStateRef.current = null
      setDragSelection(null)
      setSelectionBox(null)

      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    },
    [dragSelection, onSelectionChange],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current
      const container = containerRef.current
      if (!state || event.pointerId !== state.pointerId || !container) return

      container.releasePointerCapture(event.pointerId)
      const didDrag = state.started
      if (didDrag) {
        event.preventDefault()
      }
      finalizeDragSelection(didDrag)
    },
    [finalizeDragSelection],
  )

  const handlePointerCancel = useCallback(() => {
    finalizeDragSelection(false)
  }, [finalizeDragSelection])

  const handleItemClick = useCallback(
    (event: MouseEvent<HTMLDivElement>, item: GeneratedImage) => {
      if (!onSelect) return
      if (suppressClickRef.current) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      onSelect(item, event)
    },
    [onSelect],
  )

  return (
    <div
      ref={containerRef}
      className={cn("relative flex-1 overflow-y-auto px-6 py-6", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {selectionBox && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-[#5b3ef8] bg-[#5b3ef8]/10"
          style={{
            left: `${selectionBox.left}px`,
            top: `${selectionBox.top}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}

      {isLoading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {LOADING_PLACEHOLDERS.map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const description = item.description?.trim() || item.prompt.trim() || "Imagem gerada"
            const createdLabel = formatTimestamp(item.createdAt)
            const isSelectedFromSet = activeSelectionSet.has(item.id)
            const isPrimarySelected = !hasExternalSelection && selectedId != null && item.id === selectedId
            const isSelected = isSelectedFromSet || isPrimarySelected
            const selectionIndex = selectionOrder.indexOf(item.id)
            const showSelectionOrder = selectionOrder.length > 1 && selectionIndex !== -1
            const isVideo = Boolean(item.videoUrl && item.videoUrl.length > 0)
            const poster =
              (item.previewUrl && !item.previewUrl.includes("localhost:3000/auth")
                ? item.previewUrl
                : item.shareUrl && !item.shareUrl.includes("localhost:3000/auth")
                  ? item.shareUrl
                  : item.imagePath) || item.videoUrl || ""

            return (
              <div
                key={item.id}
                ref={(node) => {
                  if (node) {
                    itemRefs.current.set(item.id, node)
                  } else {
                    itemRefs.current.delete(item.id)
                  }
                }}
                data-gallery-item="true"
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                aria-pressed={onSelect ? isSelected : undefined}
                data-selected={isSelected ? true : undefined}
                onClick={onSelect ? (event) => handleItemClick(event, item) : undefined}
                onKeyUp={onSelect ? (event) => handleKeyUp(event, item) : undefined}
                className={cn(
                  "group flex h-full min-h-[220px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#090914] text-left transition hover:border-[#5b3ef8]/60 hover:shadow-lg hover:shadow-[#5b3ef8]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3ef8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090914]",
                  isSelected && "border-[#5b3ef8] shadow-lg shadow-[#5b3ef8]/30",
                )}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  {isVideo ? (
                    <video
                      key={item.videoUrl ?? item.id}
                      src={item.videoUrl ?? undefined}
                      poster={poster}
                      preload="metadata"
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={poster}
                      alt={description}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 ease-out group-hover:scale-105"
                    />
                  )}
                  <span
                    className={cn(
                      "pointer-events-none absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/50 text-xs font-semibold text-white/80 shadow-md transition-opacity duration-200",
                      isSelected ? "opacity-100 border-[#5b3ef8] bg-[#5b3ef8] text-white" : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {showSelectionOrder ? (
                      selectionIndex + 1
                    ) : isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </span>
                  {isVideo && (
                    <span className="pointer-events-none absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white/80 shadow-md">
                      <Play className="h-4 w-4" />
                    </span>
                  )}
                  {onSendToVideo && !isVideo && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onSendToVideo(item)
                      }}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white/80 shadow-lg transition hover:border-[#5b3ef8] hover:bg-[#5b3ef8] hover:text-white"
                    >
                      <VideoIcon className="h-4 w-4" />
                    </button>
                  )}
                  {showDescription && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm text-white/90">{description}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
                          {createdLabel}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-xs text-white/50">
                  <span className="truncate">Seed {item.seed ?? "-"}</span>
                  <span className="uppercase tracking-[0.25em]">{item.aspectRatio || "Livre"}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isLoading && items.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Atualizando galeria...
        </div>
      )}
    </div>
  )
}
