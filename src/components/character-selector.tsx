"use client"

import React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CharacterId } from "@/types"

interface CharacterSelectorProps {
  selectedCharacter: CharacterId
  onCharacterChange: (character: CharacterId) => void
  className?: string
}

const CHARACTER_DATA: Record<string, { id: CharacterId; name: string; description: string; preview: string }> = {
  ULLY: {
    id: "ULLY",
    name: "Ully",
    description: "O mascote oficial da Ultragaz, simpatico e carismatico",
    preview: "/ultragaz-character-in-living-room.jpg",
  },
  ULTRINHO: {
    id: "ULTRINHO",
    name: "Ultrinho",
    description: "Versao infantil do mascote, perfeito para conteudo kids",
    preview: "/3d-boy-character-with-glasses.jpg",
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Character",
    description: "Create your own unique character design",
    preview: "/placeholder.svg",
  },
}

export function CharacterSelector({ selectedCharacter, onCharacterChange, className }: CharacterSelectorProps) {

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Character</h3>
        <Badge variant="secondary" className="text-xs">
          {Object.keys(CHARACTER_DATA).length} available
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.values(CHARACTER_DATA).map((character) => (
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

      {selectedCharacter && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">{CHARACTER_DATA[selectedCharacter].name} selected</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Character sheet will be automatically included in generations
          </p>
        </div>
      )}
    </div>
  )
}
