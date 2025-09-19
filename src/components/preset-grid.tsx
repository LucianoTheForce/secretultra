"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Grid3X3, List } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { POSE_PRESETS, EXPRESSION_PRESETS, BACKGROUND_PRESETS } from "@/lib/constants"
import type { PresetCard } from "@/types"
import { cn } from "@/lib/utils"

interface PresetGridProps {
  selectedPresets: {
    pose?: string
    expression?: string
    background?: string
  }
  onPresetSelect: (category: "pose" | "expression" | "background", presetId: string) => void
  className?: string
}

type ViewMode = "grid" | "list"

export function PresetGrid({ selectedPresets, onPresetSelect, className }: PresetGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const allPresets = useMemo(() => ({
    pose: POSE_PRESETS,
    expression: EXPRESSION_PRESETS,
    background: BACKGROUND_PRESETS,
  }), [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    Object.values(allPresets)
      .flat()
      .forEach((preset) => {
        preset.tags.forEach((tag) => tags.add(tag))
      })
    return Array.from(tags).sort()
  }, [allPresets])

  const filterPresets = (presets: PresetCard[]) => {
    return presets.filter((preset) => {
      const matchesSearch =
        preset.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => preset.tags.includes(tag))

      return matchesSearch && matchesTags
    })
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const PresetCardComponent = ({
    preset,
    isSelected,
    onClick,
  }: {
    preset: PresetCard
    isSelected: boolean
    onClick: () => void
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} layout>
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 border-2 group",
          isSelected
            ? "border-primary bg-primary/5 shadow-md"
            : "border-border hover:border-primary/50 hover:shadow-sm",
        )}
        onClick={onClick}
      >
        <CardContent className={cn("p-3", viewMode === "list" ? "flex items-center space-x-4" : "space-y-3")}>
          <div
            className={cn(
              "relative overflow-hidden rounded-md bg-muted",
              viewMode === "list" ? "w-16 h-16 flex-shrink-0" : "aspect-square",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preset.preview || "/placeholder.svg"}
              alt={preset.label}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </motion.div>
            )}
          </div>

          <div className={cn(viewMode === "list" ? "flex-1 min-w-0" : "space-y-2")}>
            <h4 className="font-medium text-sm truncate">{preset.label}</h4>
            <div className="flex flex-wrap gap-1">
              {preset.tags.slice(0, viewMode === "list" ? 3 : 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {preset.tags.length > (viewMode === "list" ? 3 : 2) && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{preset.tags.length - (viewMode === "list" ? 3 : 2)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Presets</h3>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Filter className="w-4 h-4 mr-2" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {allTags.map((tag) => (
              <DropdownMenuItem key={tag} onClick={() => toggleTag(tag)} className="flex items-center justify-between">
                <span className="capitalize">{tag}</span>
                {selectedTags.includes(tag) && <div className="w-2 h-2 bg-primary rounded-full" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Preset Tabs */}
      <Tabs defaultValue="pose" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pose">
            Poses
            {selectedPresets.pose && <Badge variant="secondary" className="ml-2 w-2 h-2 p-0" />}
          </TabsTrigger>
          <TabsTrigger value="expression">
            Expressions
            {selectedPresets.expression && <Badge variant="secondary" className="ml-2 w-2 h-2 p-0" />}
          </TabsTrigger>
          <TabsTrigger value="background">
            Backgrounds
            {selectedPresets.background && <Badge variant="secondary" className="ml-2 w-2 h-2 p-0" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pose" className="mt-4">
          <motion.div
            className={cn(
              "gap-4",
              viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "space-y-3",
            )}
            layout
          >
            <AnimatePresence>
              {filterPresets(allPresets.pose).map((preset) => (
                <PresetCardComponent
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresets.pose === preset.id}
                  onClick={() => onPresetSelect("pose", preset.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        <TabsContent value="expression" className="mt-4">
          <motion.div
            className={cn(
              "gap-4",
              viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "space-y-3",
            )}
            layout
          >
            <AnimatePresence>
              {filterPresets(allPresets.expression).map((preset) => (
                <PresetCardComponent
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresets.expression === preset.id}
                  onClick={() => onPresetSelect("expression", preset.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        <TabsContent value="background" className="mt-4">
          <motion.div
            className={cn(
              "gap-4",
              viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "space-y-3",
            )}
            layout
          >
            <AnimatePresence>
              {filterPresets(allPresets.background).map((preset) => (
                <PresetCardComponent
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresets.background === preset.id}
                  onClick={() => onPresetSelect("background", preset.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}