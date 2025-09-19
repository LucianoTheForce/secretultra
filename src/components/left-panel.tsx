"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CharacterId } from "@/types"

interface LeftPanelProps {
  selectedCharacter: CharacterId
  onCharacterChange: (character: CharacterId) => void
  onPresetSelect?: (category: "pose" | "expression" | "background" | "lighting", presetId: string) => void
  className?: string
}

const CHARACTERS: Array<{ id: CharacterId; name: string; preview: string }> = [
  { id: "ULLY", name: "Lily", preview: "/ultragaz-character-in-living-room.jpg" },
  { id: "ULTRINHO", name: "Ultrinho", preview: "/3d-boy-character-with-glasses.jpg" },
]

function SectionGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square rounded-md bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">+</span>
        </div>
      ))}
    </div>
  )
}

export function LeftPanel({ selectedCharacter, onCharacterChange, className }: LeftPanelProps) {
  return (
    <div className={cn("w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="p-4 space-y-5 h-full overflow-auto">
        {/* Mode Tabs */}
        <Tabs defaultValue="still">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="still">Still</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="animation">Animation</TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Personagens */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Personagens Ultragaz
              <Badge variant="secondary" className="text-xs">{CHARACTERS.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => onCharacterChange(c.id)}
                className={cn(
                  "group relative rounded-md overflow-hidden border",
                  selectedCharacter === c.id ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
                aria-label={`Selecionar personagem ${c.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.preview} alt={c.name} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 left-1 right-1 text-[11px] font-medium text-white drop-shadow-sm">{c.name}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Poses */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">Poses <Plus className="w-4 h-4" /></CardTitle>
          </CardHeader>
          <CardContent>
            <SectionGrid />
          </CardContent>
        </Card>

        {/* Expressões */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">Expressões <Plus className="w-4 h-4" /></CardTitle>
          </CardHeader>
          <CardContent>
            <SectionGrid />
          </CardContent>
        </Card>

        {/* Iluminação */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">Iluminação <Plus className="w-4 h-4" /></CardTitle>
          </CardHeader>
          <CardContent>
            <SectionGrid />
          </CardContent>
        </Card>

        {/* Cenários */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">Cenários <Plus className="w-4 h-4" /></CardTitle>
          </CardHeader>
          <CardContent>
            <SectionGrid />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}