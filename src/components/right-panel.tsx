"use client"

import { useState } from "react"
import { Ruler, Move3D, RefreshCw, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FORMAT_OPTIONS = ["16:9", "1:1", "3:4", "4:3", "9:16"] as const
export type FormatOption = (typeof FORMAT_OPTIONS)[number]

interface RightPanelProps {
  className?: string
  selectedFormat: FormatOption
  onFormatChange: (format: FormatOption) => void
}

export function RightPanel({ className, selectedFormat, onFormatChange }: RightPanelProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, z: 0 })
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 })

  return (
    <div className={cn("w-96 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="p-4 space-y-5 h-full overflow-auto">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Ruler className="w-4 h-4" />
              <span>Formats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            {FORMAT_OPTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={selectedFormat === option ? "default" : "outline"}
                onClick={() => onFormatChange(option)}
              >
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Move3D className="w-4 h-4" />
              <span>Transform</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["x", "y", "z"].map((axis) => (
              <div key={axis} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase">{axis}</Label>
                  <Badge variant="outline" className="text-xs">
                    {transform[axis as keyof typeof transform]}
                  </Badge>
                </div>
                <Slider
                  value={[transform[axis as keyof typeof transform]]}
                  onValueChange={([value]) =>
                    setTransform((prev) => ({ ...prev, [axis]: value }))
                  }
                  max={100}
                  min={-100}
                  step={1}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Rotation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["x", "y", "z"].map((axis) => (
              <div key={axis} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase">{axis}</Label>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(rotation[axis as keyof typeof rotation])}deg
                  </Badge>
                </div>
                <Slider
                  value={[rotation[axis as keyof typeof rotation]]}
                  onValueChange={([value]) =>
                    setRotation((prev) => ({ ...prev, [axis]: value }))
                  }
                  max={180}
                  min={-180}
                  step={1}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Scale</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["x", "y", "z"].map((axis) => (
              <div key={axis} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase">{axis}</Label>
                  <Badge variant="outline" className="text-xs">
                    {scale[axis as keyof typeof scale].toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[scale[axis as keyof typeof scale]]}
                  onValueChange={([value]) =>
                    setScale((prev) => ({ ...prev, [axis]: value }))
                  }
                  max={2}
                  min={0.1}
                  step={0.1}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Scene Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Aspect Ratio</span>
              <Badge variant="secondary">{selectedFormat}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Layer</span>
              <Badge variant="secondary">Character</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
