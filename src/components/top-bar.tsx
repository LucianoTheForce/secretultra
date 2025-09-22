"use client"

import React from "react"
import { Download, Share2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { UserProfile } from "@/components/auth/user-profile"

interface TopBarProps {
  isGenerating: boolean
  generationProgress: number
  generationElapsedSeconds: number | null
  lastGenerationDurationSeconds: number | null
  zoom: number
  onZoomChange: (zoom: number) => void
  onGenerate: () => void
  onExport: () => void
  onShare: () => void
  credits: number | null
  totalGenerated?: number | null
  isAdmin?: boolean
  onManageCredits?: () => void
  className?: string
}

export function TopBar({
  isGenerating,
  generationElapsedSeconds,
  lastGenerationDurationSeconds,
  onExport,
  onShare,
  credits,
  totalGenerated,
  isAdmin,
  onManageCredits,
  className,
}: TopBarProps) {
  const formatSeconds = (value: number) => (value >= 10 ? `${Math.round(value)}s` : `${value.toFixed(1)}s`)
  const creditsLabel = credits === null ? "Carregando creditos" : `${credits} creditos`
  const totalGeneratedLabel = typeof totalGenerated === "number" ? `Geradas ${totalGenerated}` : null

  return (
    <div
      className={cn(
        "flex items-center justify-between px-1 py-0.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      {/* Left Section - Brand only */}
      <div className="flex items-center space-x-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca_completa_RGB_negativo.png" alt="ultragaz" className="h-7 w-auto" />
      </div>

      {/* Center spacer */}
      <div />

      {/* Right Section - Actions + Credits + Theme + Profile */}
      <div className="flex items-center space-x-1">
        {isGenerating ? (
          <Badge variant="outline" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            {`Generating ${formatSeconds(generationElapsedSeconds ?? 0)}`}
          </Badge>
        ) : lastGenerationDurationSeconds !== null ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
            {`Last gen ${formatSeconds(lastGenerationDurationSeconds)}`}
          </Badge>
        ) : null}

        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download ZIP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{creditsLabel}</Badge>
        {totalGeneratedLabel && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{totalGeneratedLabel}</Badge>
        )}
        {isAdmin && onManageCredits && (
          <Button variant="outline" size="sm" onClick={onManageCredits}>
            Gerenciar creditos
          </Button>
        )}
        <ModeToggle />
        <UserProfile />
      </div>
    </div>
  )
}
