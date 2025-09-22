"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  Palette, Camera, Sparkles, Lightbulb, Brush, Box, Eye, Layers,
  Play, Film, Smile, Minimize2, Image as ImageIcon, Shapes,
  Zap, Droplets, Square, Circle, Flame, Sun,
  Sunrise, Moon, Star, Cloud, Sunset, Flashlight,
  Aperture, Maximize2, Users, Focus, Fish, Move3d,
  Gem, Wine, Coins, HardHat, Trees, Shirt,
  Layers2, Mountain, Infinity, Grid3x3, SquareStack,
  CircleDot, CircleX, Target, Search, FlipHorizontal,
  Ban, Flower, Chrome, Tv, Contrast
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CharacterId, Prompt } from "@/types"
import type { CharacterPresetCategory, CharacterPresetItem } from "@/lib/character-presets"

export const FORMAT_OPTIONS = ["21:9", "16:9", "4:3", "1:1", "9:16"] as const
export type FormatOption = (typeof FORMAT_OPTIONS)[number]

interface RightPanelProps {
  className?: string
  selectedFormat: FormatOption | null
  onFormatChange: (format: FormatOption | null) => void
  prompt: Prompt
  onPromptChange: (update: Partial<Prompt>) => void
  onReset?: () => void
  onApplyHelper?: (helper: string) => void
  characters?: { id: CharacterId; name: string; preview: string }[]
  selectedCharacter?: CharacterId
  onCharacterSelect?: (id: CharacterId) => void
  presetSections?: { key: CharacterPresetCategory; title: string }[]
  categoryItems?: Record<CharacterPresetCategory, CharacterPresetItem[]>
  selectedPresets?: Partial<Record<CharacterPresetCategory, CharacterPresetItem | undefined>>
  onPresetSelect?: (category: CharacterPresetCategory, preset: CharacterPresetItem) => void
}

const STYLE_OPTIONS = [
  { 
    id: "style", 
    label: "Style", 
    icon: Brush,
    options: [
      { value: "Futuristic", icon: Zap },
      { value: "Cinematic", icon: Film },
      { value: "Playful", icon: Smile },
      { value: "Minimal", icon: Minimize2 },
      { value: "Realistic", icon: ImageIcon },
      { value: "Abstract", icon: Shapes }
    ],
    selected: "Futuristic"
  },
  { 
    id: "color", 
    label: "Color", 
    icon: Palette,
    options: [
      { value: "Vibrant", icon: Zap },
      { value: "Pastel", icon: Droplets },
      { value: "Monochrome", icon: Square },
      { value: "Analogous", icon: Circle },
      { value: "Warm", icon: Flame },
      { value: "Cool", icon: Droplets },
    ],
    selected: "Vibrant"
  },
  { 
    id: "lighting", 
    label: "Lighting", 
    icon: Lightbulb,
    options: [
      { value: "Backlight", icon: Sunrise },
      { value: "Glowing", icon: Star },
      { value: "Direct Sunlight", icon: Sun },
      { value: "Neon Light", icon: Zap },
      { value: "Soft", icon: Cloud },
      { value: "Dramatic", icon: Flashlight }
    ],
    selected: "Glowing"
  },
  { 
    id: "camera", 
    label: "Camera", 
    icon: Camera,
    options: [
      { value: "Wide Angle", icon: Maximize2 },
      { value: "Macro", icon: Focus },
      { value: "Portrait", icon: Users },
      { value: "Telephoto", icon: Aperture },
      { value: "Fish-eye", icon: CircleDot },
      { value: "Tilt-shift", icon: Move3d },
    ],
    selected: "Wide Angle"
  },
  { 
    id: "material", 
    label: "Materials", 
    icon: Box,
    options: [
      { value: "Pearl, Foil", icon: Gem },
      { value: "Glass", icon: Wine },
      { value: "Liquid Metal", icon: Droplets },
      { value: "Ceramic", icon: HardHat },
      { value: "Wood", icon: Trees },
      { value: "Fabric", icon: Shirt }
    ],
    selected: "Glass"
  },
  { 
    id: "depth", 
    label: "Depth", 
    icon: Layers,
    options: [
      { value: "Shallow", icon: Layers2 },
      { value: "Medium", icon: SquareStack },
      { value: "Deep", icon: Mountain },
      { value: "Infinite", icon: Infinity },
      { value: "Layered", icon: Grid3x3 },
    ],
    selected: "Medium"
  },
  { 
    id: "focus", 
    label: "Focus", 
    icon: Eye,
    options: [
      { value: "Sharp", icon: Target },
      { value: "Soft", icon: CircleX },
      { value: "Selective", icon: Focus },
      { value: "Bokeh", icon: Search },
      { value: "Tilt-shift", icon: FlipHorizontal }
    ],
    selected: "Sharp"
  },
  { 
    id: "effects", 
    label: "Effects", 
    icon: Sparkles,
    options: [
      { value: "None", icon: Ban },
      { value: "Bloom", icon: Flower },
      { value: "Chromatic", icon: Zap },
      { value: "Vignette", icon: CircleDot },
      { value: "Film Grain", icon: Film },
      { value: "HDR", icon: Contrast }
    ],
    selected: "Bloom"
  },
]

const DEFAULTS = {
  chaos: 35,
  quality: 0.7,
  version: "6.0",
  styleSelections: {} as Record<string, string>
}

function StyleDropdownItem({
  item,
  selectedValue,
  onSelect,
}: {
  item: typeof STYLE_OPTIONS[0]
  selectedValue: string | undefined
  onSelect: (value: string) => void
}) {
  const Icon = item.icon
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl bg-[#10101b] p-4 hover:bg-[#141421] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[#7c7b91]" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-white">{item.label}</span>
            <span className="text-xs text-[#7c7b91]">{selectedValue || "None"}</span>
          </div>
        </div>
        <svg 
          className={cn("h-4 w-4 text-[#7c7b91] transition-transform", isOpen && "rotate-180")}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-neutral-600/30 bg-neutral-800/95 backdrop-blur-2xl shadow-2xl">
          <div className="p-3 max-h-72 overflow-y-auto">
            {item.options.map((option) => {
              const OptionIcon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                    selectedValue === option.value 
                      ? "bg-[#5b3ef8] text-white shadow-lg" 
                      : "text-[#b3b1c8] hover:bg-neutral-700/60 hover:text-white"
                  )}
                >
                  <OptionIcon className={cn(
                    "h-4 w-4",
                    selectedValue === option.value ? "text-white" : "text-[#7c7b91]"
                  )} />
                  <span className="flex-1 text-left">{option.value}</span>
                  {selectedValue === option.value && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function RightPanel({
  className,
  selectedFormat,
  onFormatChange,
  prompt,
  onPromptChange,
  onReset,
  onApplyHelper,
  characters,
  selectedCharacter,
  onCharacterSelect,
  presetSections,
  categoryItems,
  selectedPresets,
  onPresetSelect,
}: RightPanelProps) {
  const [styleSelections, setStyleSelections] = useState<Record<string, string>>(DEFAULTS.styleSelections)

  const handleReset = () => {
    setStyleSelections({})
    onFormatChange(null)
    onReset?.()
  }

  const handleStyleSelect = (styleId: string, value: string) => {
    setStyleSelections(prev => {
      // If clicking the same value, deselect it
      if (prev[styleId] === value) {
        const newSelections = { ...prev }
        delete newSelections[styleId]
        return newSelections
      }
      return {
        ...prev,
        [styleId]: value
      }
    })
  }

  const handleApply = () => {
    if (!onApplyHelper) return
    const helper = STYLE_OPTIONS
      .map(opt => `${opt.label}: ${styleSelections[opt.id]}`)
      .concat([`Aspect Ratio: ${selectedFormat}`])
      .join("\n")

    onApplyHelper(helper)
  }

  return (
    <aside
      className={cn(
        "flex w-[260px] flex-col border-l border-[#16151d] bg-[#07070d] text-white",
        className,
      )}
    >
      <div className="flex items-start justify-between px-6 py-5 border-b border-[#16151d]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#5e5d73]">Prompt Helper</p>
          <h2 className="text-lg font-semibold text-white">Fine tune your shot</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-[#b3b1c8] hover:text-white" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {characters && selectedCharacter && onCharacterSelect && (
          <section className="space-y-4">
            <CharacterQuickSelect
              characters={characters}
              selectedCharacter={selectedCharacter}
              onSelect={onCharacterSelect}
            />
          </section>
        )}
        
        <section className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#5e5d73]">Technical</p>
          <div className="space-y-4 rounded-2xl border border-[#191927] bg-[#0c0c15] p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#b3b1c8]">
                <span>Ratio</span>
                {selectedFormat && (
                  <Badge variant="secondary" className="bg-[#141421] text-[#d6d4ef]">
                    {selectedFormat}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 justify-between">
                {FORMAT_OPTIONS.map((option) => {
                  // Calculate visual dimensions based on ratio
                  const ratioStyles = {
                    "21:9": "w-14 h-6",   // Ultra wide
                    "16:9": "w-12 h-7",   // Wide
                    "4:3": "w-10 h-8",    // Standard
                    "1:1": "w-9 h-9",     // Square
                    "9:16": "w-7 h-12",   // Portrait
                  }
                  
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        "rounded-lg border-2 transition-all flex items-center justify-center",
                        ratioStyles[option as keyof typeof ratioStyles],
                        selectedFormat === option
                          ? "border-[#5b3ef8] bg-[#5b3ef8]/20"
                          : "border-[#2a2938] bg-[#10101b] hover:border-[#3a3948]"
                      )}
                      onClick={() => onFormatChange(selectedFormat === option ? null : option)}
                      title={option}
                    >
                      <span className="text-[9px] text-white/60">{option}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
        
        {presetSections && categoryItems && selectedPresets && onPresetSelect && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#191927] bg-[#0c0c15] p-4">
              <div className="space-y-4">
                {presetSections.map(({ key, title }) => (
                  <PresetQuickPick
                    key={key}
                    category={key}
                    title={title}
                    items={categoryItems[key]}
                    selected={selectedPresets[key]}
                    onSelect={onPresetSelect}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#5e5d73]">Styling</p>
          <div className="space-y-2">
            {STYLE_OPTIONS.map((item) => (
              <StyleDropdownItem
                key={item.id}
                item={item}
                selectedValue={styleSelections[item.id]}
                onSelect={(value) => handleStyleSelect(item.id, value)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="px-5 pb-6 pt-4 border-t border-[#16151d]">
        <Button
          className="w-full rounded-2xl bg-[#5b3ef8] text-white hover:bg-[#6b4ef8]"
          size="lg"
          onClick={handleApply}
        >
          Apply to Prompt
        </Button>
      </div>
    </aside>
  )
}

function CharacterQuickSelect({
  characters,
  selectedCharacter,
  onSelect,
}: {
  characters: { id: CharacterId; name: string; preview: string }[]
  selectedCharacter: CharacterId
  onSelect: (id: CharacterId) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#5e5d73]">Character</p>
      <div className="flex flex-col gap-2">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => onSelect(character.id)}
            className={cn(
              "group relative h-20 w-full overflow-hidden rounded-2xl border text-left transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3ef8]",
              selectedCharacter === character.id
                ? "border-[#5b3ef8]"
                : "border-[#191927] hover:border-[#2a2938]",
            )}
          >
            <Image
              src={character.preview}
              alt={character.name}
              fill
              sizes="320px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-sm font-semibold text-white">{character.name}</p>
              {selectedCharacter === character.id && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#a78bfa]">Active</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PresetQuickPick({
  category,
  title,
  items,
  selected,
  onSelect,
}: {
  category: CharacterPresetCategory
  title: string
  items: CharacterPresetItem[]
  selected?: CharacterPresetItem
  onSelect: (category: CharacterPresetCategory, preset: CharacterPresetItem) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#5e5d73]">
        <span>{title}</span>
        <Badge variant="outline" className="border-[#191927] bg-[#141421] text-[10px] text-[#d6d4ef]">
          {items.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(category, item)}
            className={cn(
              "group relative h-20 overflow-hidden rounded-2xl border text-left transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3ef8]",
              selected?.id === item.id 
                ? "border-[#5b3ef8]" 
                : "border-[#191927] hover:border-[#2a2938]",
            )}
          >
            <Image
              src={item.image}
              alt={item.label}
              fill
              sizes="150px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[10px] font-semibold text-white line-clamp-2">{item.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
