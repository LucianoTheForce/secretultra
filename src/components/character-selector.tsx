"use client"

import React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CHARACTER_CONFIG } from "@/lib/character-presets"
import type { CharacterId } from "@/types"

interface CharacterSelectorProps {
  selectedCharacter: CharacterId
  onCharacterChange: (character: CharacterId) => void
  className?: string
}

const CHARACTER_ITEMS = (Object.keys(CHARACTER_CONFIG) as CharacterId[])
  .filter((id) => id !== "CUSTOM")
  .map((id) => ({
    id,
    name: CHARACTER_CONFIG[id].name,
    description:
      id === "ULTRINHO"
        ? "Versao infantil do mascote, perfeito para conteudo kids"
        : "O mascote oficial da Ultragaz, simpatico e carismatico",
    preview: CHARACTER_CONFIG[id].references[0] ?? "/placeholder.svg",
  }))

export function CharacterSelector({ selectedCharacter, onCharacterChange, className }: CharacterSelectorProps) {
  const selectedInfo = CHARACTER_ITEMS.find((character) => character.id === selectedCharacter)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Character</h3>
        <Badge variant="secondary" className="text-xs">
          {CHARACTER_ITEMS.length} available
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {CHARACTER_ITEMS.map((character) => (
          <Card
            key={character.id}
            className={cn(
              "cursor-pointer transition-all duration-200 border-2",
              selectedCharacter === character.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            )}
            onClick={() => onCharacterChange(character.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={character.preview || "/placeholder.svg"}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedCharacter === character.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{character.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{character.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedInfo && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">{selectedInfo.name} selecionado</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            As referencias desse personagem são usadas internamente durante a geração.
          </p>
        </div>
      )}
    </div>
  )
}
