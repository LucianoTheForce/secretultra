"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { CharacterId } from "@/types"
import {
  CHARACTER_CONFIG,
  type CharacterConfig,
  type CharacterPresetCategory,
  type CharacterPresetItem,
} from "@/lib/character-presets"

interface LeftPanelProps {
  selectedCharacter: CharacterId
  onCharacterChange: (character: CharacterId) => void
  characterConfig: CharacterConfig
  selectedPresets: Partial<Record<CharacterPresetCategory, CharacterPresetItem | undefined>>
  onPresetSelect: (category: CharacterPresetCategory, preset: CharacterPresetItem) => void
  className?: string
}

const characters = (Object.keys(CHARACTER_CONFIG) as CharacterId[])
  .filter((id) => id !== "CUSTOM")
  .map((id) => ({
    id,
    name: CHARACTER_CONFIG[id].name,
    preview: CHARACTER_CONFIG[id].references[0] ?? "/ultragaz-character-in-living-room.jpg",
  }))

const sections: { key: CharacterPresetCategory; title: string }[] = [
  { key: "poses", title: "Poses" },
  { key: "expressions", title: "Expressoes" },
  { key: "lighting", title: "Iluminacao" },
  { key: "scenarios", title: "Cenarios" },
]

function PresetGrid({
  items,
  selectedId,
  onSelect,
}: {
  items: CharacterPresetItem[]
  selectedId?: string
  onSelect: (item: CharacterPresetItem) => void
}) {
  if (items.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "group relative aspect-square overflow-hidden rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selectedId === item.id ? "border-primary" : "border-border"
          )}
          aria-label={item.label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
          <span className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white drop-shadow-sm line-clamp-2">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export function LeftPanel({
  selectedCharacter,
  onCharacterChange,
  characterConfig,
  selectedPresets,
  onPresetSelect,
  className,
}: LeftPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<CharacterPresetCategory, boolean>>({
    poses: true,
    expressions: true,
    lighting: true,
    scenarios: true,
  })
  const [showAllSections, setShowAllSections] = useState<Record<CharacterPresetCategory, boolean>>({
    poses: false,
    expressions: false,
    lighting: false,
    scenarios: false,
  })

  const toggleSection = (sectionKey: CharacterPresetCategory) => {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  const toggleShowAll = (sectionKey: CharacterPresetCategory) => {
    setShowAllSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  return (
    <div className={cn("w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="p-4 space-y-5 h-full overflow-auto">
        <Tabs defaultValue="still">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="still">Still</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="animation">Animation</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Personagens Ultragaz
              <Badge variant="secondary" className="text-xs">{characters.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => onCharacterChange(character.id)}
                className={cn(
                  "group relative rounded-md overflow-hidden border",
                  selectedCharacter === character.id ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
                aria-label={`Selecionar personagem ${character.name}`}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={character.preview} alt={character.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 left-1 right-1 text-[11px] font-medium text-white drop-shadow-sm">{character.name}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {sections.map(({ key, title }) => {
          const items = characterConfig.categories[key]
          const isExpanded = expandedSections[key]
          const showAll = showAllSections[key]
          const visibleItems = showAll ? items : items.slice(0, 3)

          return (
            <Card key={key}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>{title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                    {items.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={() => toggleShowAll(key)}
                      >
                        {showAll ? (
                          <>
                            <Minus className="h-3 w-3" />
                            Menos
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Mais
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleSection(key)}
                      aria-label={isExpanded ? `Recolher ${title}` : `Expandir ${title}`}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <PresetGrid
                    items={visibleItems}
                    selectedId={selectedPresets[key]?.id}
                    onSelect={(item) => onPresetSelect(key, item)}
                  />
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
