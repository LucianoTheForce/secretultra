"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent, MouseEvent } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { StudioSidebar, type StudioNavKey } from "@/components/studio-sidebar"
import { GalleryFiltersPanel, type DateRangeFilter, type MediaTypeFilter } from "@/components/gallery-filters-panel"
import { MediaGallery } from "@/components/media-gallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCredits } from "@/hooks/use-credits"
import type { GeneratedImage } from "@/types"
import { ArrowLeft, Copy, Download, Sparkles, Wand2 } from "lucide-react"

const DEFAULT_MEDIA_TYPES: MediaTypeFilter[] = ["image"]

export default function StudioGalleryPage() {
  const router = useRouter()
  const { data: creditData } = useCredits()

  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<MediaTypeFilter>>(
    () => new Set<MediaTypeFilter>(DEFAULT_MEDIA_TYPES),
  )
  const [selectedAspectRatios, setSelectedAspectRatios] = useState<Set<string>>(() => new Set())
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null)
  const previousHistoryRef = useRef<GeneratedImage[]>([])


  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const res = await fetch("/api/images/history", { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = (await res.json()) as { images?: GeneratedImage[] }
        if (Array.isArray(json.images) && json.images.length > 0) {
          const sorted = [...json.images].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          const sortedIds = new Set(sorted.map((image) => image.id))
          const previousHistory = previousHistoryRef.current
          previousHistoryRef.current = sorted
          setHistory(sorted)
          setSelectedIds((prev) => {
            if (prev.size === 0) {
              return new Set()
            }
            const validIds = [...prev].filter((id) => sortedIds.has(id))
            return new Set(validIds)
          })
          setSelectedId((prev) => {
            if (prev && sortedIds.has(prev)) {
              return prev
            }
            return null
          })
          setSelectionAnchor((prev) => {
            if (prev === null) return null
            const anchorId = previousHistory[prev]?.id
            if (!anchorId) return null
            const nextIndex = sorted.findIndex((image) => image.id === anchorId)
            return nextIndex === -1 ? null : nextIndex
          })
          setPreviewImage((prev) => {
            if (!prev) return null
            return sorted.find((image) => image.id === prev.id) ?? null
          })
        } else {
          previousHistoryRef.current = []
          setHistory([])
          setSelectedId(null)
          setSelectedIds(new Set())
          setSelectionAnchor(null)
          setPreviewImage(null)
        }
      } catch (error) {
        console.error("[gallery] Failed to load history", error)
        setHistoryError(error instanceof Error ? error.message : "Falha ao carregar a galeria")
      } finally {
        setHistoryLoading(false)
      }
    }

    void loadHistory()
  }, [])

  const availableAspectRatios = useMemo(() => {
    const ratios = new Set<string>()
    for (const item of history) {
      const ratio = (item.aspectRatio ?? "").trim()
      if (ratio.length > 0) {
        ratios.add(ratio)
      }
    }
    return Array.from(ratios).sort()
  }, [history])

  const filteredGalleryItems = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase()
    const includeImages = selectedTypes.size === 0 || selectedTypes.has("image")

    let maxAgeDays: number | null = null
    if (dateRange === "7d") maxAgeDays = 7
    else if (dateRange === "30d") maxAgeDays = 30
    else if (dateRange === "365d") maxAgeDays = 365

    return history.filter((item) => {
      if (!includeImages) {
        return false
      }

      if (selectedAspectRatios.size > 0) {
        const ratio = (item.aspectRatio ?? "").trim()
        if (!selectedAspectRatios.has(ratio)) {
          return false
        }
      }

      if (maxAgeDays !== null) {
        const createdAt = new Date(item.createdAt)
        if (Number.isNaN(createdAt.getTime())) {
          return false
        }
        const ageMs = Date.now() - createdAt.getTime()
        if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
          return false
        }
      }

      if (trimmedSearch.length > 0) {
        const haystack = `${item.description ?? ""} ${item.prompt ?? ""}`.toLowerCase()
        if (!haystack.includes(trimmedSearch)) {
          return false
        }
      }

      return true
    })
  }, [history, selectedTypes, selectedAspectRatios, dateRange, searchTerm])

  const galleryEmptyState = useMemo(() => {
    if (historyError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-semibold">N\u00e3o foi poss\u00edvel carregar a galeria</p>
          <p className="text-xs opacity-80">{historyError}</p>
        </div>
      )
    }

    if (!historyLoading && filteredGalleryItems.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          <p className="text-sm font-semibold">Nenhuma imagem encontrada</p>
          <p className="text-xs text-white/50">Ajuste os filtros ou gere novas imagens para v\u00ea-las aqui.</p>
        </div>
      )
    }

    return undefined
  }, [filteredGalleryItems.length, historyError, historyLoading])

  const handleSidebarSelect = useCallback((key: StudioNavKey) => {
    if (key === "generate") {
      setPreviewImage(null)
      router.push("/studio")
    }
  }, [router])

  const handleToggleMediaType = useCallback((type: MediaTypeFilter) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const handleToggleAspectRatio = useCallback((ratio: string) => {
    setSelectedAspectRatios((prev) => {
      const next = new Set(prev)
      if (next.has(ratio)) {
        next.delete(ratio)
      } else {
        next.add(ratio)
      }
      return next
    })
  }, [])

  const handleDateRangeChange = useCallback((range: DateRangeFilter) => {
    setDateRange(range)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedTypes(new Set<MediaTypeFilter>(DEFAULT_MEDIA_TYPES))
    setSelectedAspectRatios(new Set<string>())
    setDateRange("all")
    setSearchTerm("")
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectedId(null)
    setSelectionAnchor(null)
    setPreviewImage(null)
  }, [])

  const handleGallerySelect = useCallback(
    (item: GeneratedImage, event?: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
      const index = history.findIndex((image) => image.id === item.id)
      if (index === -1) return

      const metaKey = event && 'metaKey' in event ? event.metaKey : false
      const ctrlKey = event && 'ctrlKey' in event ? event.ctrlKey : false
      const shiftPressed = Boolean(event && 'shiftKey' in event && event.shiftKey)
      const ctrlPressed = Boolean(metaKey || ctrlKey)

      setSelectedIds((prev) => {
        if (shiftPressed && history.length > 0) {
          const anchor = selectionAnchor ?? index
          const startIndex = Math.min(anchor, index)
          const endIndex = Math.max(anchor, index)
          const range = history.slice(startIndex, endIndex + 1).map((image) => image.id)
          return new Set(range)
        }

        if (ctrlPressed) {
          const next = new Set(prev)
          if (next.has(item.id)) {
            next.delete(item.id)
          } else {
            next.add(item.id)
          }
          return next.size > 0 ? next : new Set([item.id])
        }

        return new Set([item.id])
      })

      setSelectionAnchor(shiftPressed ? (selectionAnchor ?? index) : index)
      setSelectedId(item.id)

      if (!ctrlPressed && !shiftPressed) {
        setPreviewImage(item)
      }
    },
    [history, selectionAnchor],
  )

  const handleGalleryDragSelection = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        setSelectedIds(new Set())
        setSelectedId(null)
        setSelectionAnchor(null)
        setPreviewImage(null)
        return
      }

      setSelectedIds(new Set(ids))
      const lastId = ids[ids.length - 1] ?? null
      setSelectedId(lastId)

      const anchorId = ids[0] ?? null
      if (anchorId) {
        const anchorIndex = history.findIndex((image) => image.id === anchorId)
        setSelectionAnchor(anchorIndex === -1 ? null : anchorIndex)
      } else {
        setSelectionAnchor(null)
      }

      setPreviewImage((prev) => {
        if (ids.length === 1) {
          return history.find((image) => image.id === ids[0]) ?? prev
        }
        if (prev && ids.includes(prev.id)) {
          return prev
        }
        return null
      })
    },
    [history],
  )

  const previewCreatedAt = useMemo(() => {
    if (!previewImage) return null
    const date = new Date(previewImage.createdAt)
    if (Number.isNaN(date.getTime())) return null
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date)
  }, [previewImage])

  const handleClosePreview = useCallback(() => {
    setPreviewImage(null)
  }, [])

  const handleOpenInStudio = useCallback(() => {
    if (!previewImage) return
    setPreviewImage(null)
    router.push("/studio")
  }, [previewImage, router])

  const handleDownload = useCallback(() => {
    if (!previewImage) return
    const url = previewImage.imagePath || previewImage.previewUrl
    if (!url) return
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.target = "_blank"
    anchor.rel = "noopener noreferrer"
    anchor.download = previewImage.id ?? "galeria"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }, [previewImage])

  const handleCopyPrompt = useCallback(() => {
    if (!previewImage?.prompt) return
    void navigator.clipboard?.writeText(previewImage.prompt).catch(() => {})
  }, [previewImage])

  const sidebarCredits = creditData?.credits ?? null
  const sidebarTotal = creditData?.totalGenerated ?? null
  const hasUnlimitedCredits = Boolean(creditData?.hasUnlimitedCredits)
  const isAdmin = Boolean(creditData?.isAdmin)

  const selectedItems = useMemo(() => {
    if (selectedIds.size === 0) return []
    return history.filter((image) => selectedIds.has(image.id))
  }, [history, selectedIds])

  const selectedCount = selectedIds.size

  const handleBulkDownload = useCallback(() => {
    if (selectedItems.length === 0) return
    selectedItems.forEach((item) => {
      const url = item.imagePath || item.previewUrl
      if (!url) return
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.target = "_blank"
      anchor.rel = "noopener noreferrer"
      anchor.download = item.id ?? "galeria"
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    })
  }, [selectedItems])

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-slate-100">
      <StudioSidebar
        credits={sidebarCredits}
        totalGenerated={sidebarTotal}
        isGenerating={false}
        onManageCredits={isAdmin ? () => router.push("/admin/credits") : undefined}
        activeKey="my-images"
        onSelect={handleSidebarSelect}
        hasUnlimitedCredits={hasUnlimitedCredits}
        isAdmin={isAdmin}
        onAdminNavigate={isAdmin ? () => router.push("/admin") : undefined}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden">
          {previewImage ? (
            <div className="flex flex-1 flex-col overflow-hidden bg-neutral-950/40">
              <div className="relative flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="absolute left-6 top-6 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label="Voltar para galeria"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-neutral-900">
                  <Image
                    src={previewImage.previewUrl || previewImage.imagePath}
                    alt={previewImage.description ?? previewImage.prompt ?? "Imagem da galeria"}
                    fill
                    sizes="(min-width: 1280px) 55vw, (min-width: 768px) 70vw, 100vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <MediaGallery
                items={filteredGalleryItems}
                isLoading={historyLoading}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={handleGallerySelect}
                onSelectionChange={handleGalleryDragSelection}
                className="flex-1"
                emptyState={galleryEmptyState}
                showDescription={false}
              />
              {selectedCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-white/60">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      {selectedCount === 1 ? "1 imagem selecionada" : `${selectedCount} imagens selecionadas`}
                    </span>
                    <span className="hidden text-[10px] uppercase tracking-[0.4em] text-white/40 md:inline">
                      Shift seleciona intervalo. Ctrl alterna itens.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/60 transition hover:text-white"
                    >
                      Limpar selecao
                    </button>
                    <Button
                      variant="outline"
                      className="flex h-9 items-center gap-2 rounded-lg border-white/20 px-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
                      onClick={handleBulkDownload}
                      disabled={selectedItems.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Baixar selecionados
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {previewImage ? (
          <div className="flex w-full flex-col gap-6 border-t border-white/10 bg-neutral-950/90 p-6 lg:h-full lg:w-[360px] lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:overflow-y-auto lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {previewImage.model && (
                <Badge variant="secondary" className="bg-white/10 text-xs uppercase tracking-[0.3em]">
                  {previewImage.model}
                </Badge>
              )}
              {previewImage.aspectRatio && (
                <Badge variant="outline" className="border-white/20 text-xs uppercase tracking-[0.25em]">
                  {previewImage.aspectRatio}
                </Badge>
              )}
              {previewImage.seed && (
                <Badge variant="outline" className="border-white/20 text-xs uppercase tracking-[0.25em]">
                  Seed {previewImage.seed}
                </Badge>
              )}
              {previewCreatedAt && (
                <Badge variant="outline" className="border-white/20 text-xs uppercase tracking-[0.25em]">
                  {previewCreatedAt}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Prompt</p>
                <p className="mt-2 whitespace-pre-line text-sm text-white/90">
                  {previewImage.prompt || "Prompt indisponivel"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-8 gap-2 text-xs text-white/70 hover:text-white"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar prompt
                </Button>
              </div>

              {previewImage.description && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Descricao</p>
                  <p className="mt-2 text-sm text-white/80">{previewImage.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5b3ef8] text-sm font-semibold text-white transition hover:bg-[#6e54ff]"
                onClick={handleOpenInStudio}
              >
                <Sparkles className="h-4 w-4" />
                Trabalhar no studio
              </Button>
              <Button
                variant="outline"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-white/20 text-sm text-white transition hover:bg-white/10"
                onClick={handleOpenInStudio}
              >
                <Wand2 className="h-4 w-4" />
                Gerar variacao
              </Button>
              <Button
                variant="outline"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-white/20 text-sm text-white transition hover:bg-white/10"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Baixar imagem
              </Button>
            </div>
          </div>
        ) : (
          <GalleryFiltersPanel
            selectedTypes={selectedTypes}
            onToggleType={handleToggleMediaType}
            availableAspectRatios={availableAspectRatios}
            selectedAspectRatios={selectedAspectRatios}
            onToggleAspectRatio={handleToggleAspectRatio}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>
    </div>
  )
}


