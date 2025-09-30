"use client"

import type { LucideIcon } from "lucide-react"
import {
  CalendarRange,
  Filter,
  Film,
  Image as ImageIcon,
  RefreshCw,
  Search,
  BookOpen,
  X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type MediaTypeFilter = "image" | "video" | "story"
export type DateRangeFilter = "all" | "7d" | "30d" | "365d"

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "365d", label: "Last year" }
] satisfies Array<{ value: DateRangeFilter; label: string }>

const MEDIA_TYPE_OPTIONS = [
  { value: "image", label: "Images", icon: ImageIcon },
  { value: "video", label: "Videos", icon: Film },
  { value: "story", label: "Stories", icon: BookOpen }
] satisfies Array<{ value: MediaTypeFilter; label: string; icon: LucideIcon }>

type GalleryFiltersPanelProps = {
  selectedTypes: Set<MediaTypeFilter>
  onToggleType: (type: MediaTypeFilter) => void
  availableAspectRatios: string[]
  selectedAspectRatios: Set<string>
  onToggleAspectRatio: (ratio: string) => void
  dateRange: DateRangeFilter
  onDateRangeChange: (range: DateRangeFilter) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onClearFilters: () => void
  className?: string
}

export function GalleryFiltersPanel({
  selectedTypes,
  onToggleType,
  availableAspectRatios,
  selectedAspectRatios,
  onToggleAspectRatio,
  dateRange,
  onDateRangeChange,
  searchTerm,
  onSearchChange,
  onClearFilters,
  className
}: GalleryFiltersPanelProps) {
  const trimmedSearch = searchTerm.trim()
  const hasTypeFilter =
    (selectedTypes.size > 0 && selectedTypes.size < MEDIA_TYPE_OPTIONS.length) ||
    selectedTypes.size === 0
  const hasAspectFilter = selectedAspectRatios.size > 0
  const hasDateFilter = dateRange !== "all"
  const hasSearchFilter = trimmedSearch.length > 0
  const activeFilterCount =
    (hasTypeFilter ? 1 : 0) +
    (hasAspectFilter ? 1 : 0) +
    (hasDateFilter ? 1 : 0) +
    (hasSearchFilter ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0

  return (
    <aside
      className={cn(
        "hidden lg:flex w-[320px] flex-shrink-0 flex-col border-l border-[#16151d] bg-[#05050a]/95 text-white backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-semibold text-white">Filters</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            Refine gallery
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 gap-1 rounded-full bg-white/5 px-3 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
            <span className="text-[10px] text-white/50">
              ({activeFilterCount})
            </span>
          </Button>
        )}
      </div>

      <Separator className="bg-white/10" />

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Search
            </p>
            {trimmedSearch.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="text-[11px] uppercase tracking-[0.25em] text-[#7c5cff] hover:text-[#a855f7]"
              >
                Clear
              </button>
            )}
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search prompts or descriptions"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#090914] pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#5b3ef8]"
            />
            {trimmedSearch.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
            <CalendarRange className="h-3.5 w-3.5" />
            <span>Date range</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DATE_RANGE_OPTIONS.map((option) => {
              const isActive = dateRange === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onDateRangeChange(option.value)}
                  className={cn(
                    "rounded-xl border border-white/10 px-3 py-2 text-left text-xs font-medium transition",
                    isActive
                      ? "border-[#5b3ef8] bg-[#5b3ef8]/20 text-white"
                      : "text-white/60 hover:border-white/20 hover:text-white"
                  )}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
            <Filter className="h-3.5 w-3.5" />
            <span>Type</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {MEDIA_TYPE_OPTIONS.map((option) => {
              const isActive = selectedTypes.has(option.value)
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToggleType(option.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                    isActive
                      ? "border-[#5b3ef8] bg-[#5b3ef8]/20 text-white"
                      : "border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                  )}
                  aria-pressed={isActive}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-[#cebfff]" : "text-white/50"
                      )}
                    />
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-10 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.2em]",
                      isActive ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                    )}
                  >
                    {isActive ? "ON" : "OFF"}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Aspect ratio</span>
            </div>
            {availableAspectRatios.length > 0 && (
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/30">
                {selectedAspectRatios.size} selected
              </span>
            )}
          </div>
          {availableAspectRatios.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableAspectRatios.map((ratio) => {
                const isActive = selectedAspectRatios.has(ratio)
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onToggleAspectRatio(ratio)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      isActive
                        ? "border-[#5b3ef8] bg-[#5b3ef8]/20 text-white"
                        : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                    )}
                    aria-pressed={isActive}
                  >
                    {ratio}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-white/40">
              Aspect ratios will appear as your gallery grows.
            </p>
          )}
        </section>
      </div>
    </aside>
  )
}
