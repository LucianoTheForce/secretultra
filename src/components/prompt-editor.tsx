"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Wand2, Shuffle, AlertCircle, CheckCircle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { QUALITY_TIPS } from "@/lib/constants"
import type { Prompt } from "@/types"
import { cn, debounce } from "@/lib/utils"

interface PromptEditorProps {
  prompt: Prompt
  onPromptChange: (prompt: Prompt) => void
  className?: string
}

interface QualityTip {
  tip: string
  severity: "info" | "warning" | "error"
}

export function PromptEditor({ prompt, onPromptChange, className }: PromptEditorProps) {
  const [qualityTips, setQualityTips] = useState<QualityTip[]>([])
  const [tokenCount, setTokenCount] = useState(0)

  // Mock token counting (in real implementation, this would call the actual tokenizer)
  const countTokens = useCallback((text: string): number => {
    return Math.ceil(text.split(/\s+/).length * 1.3)
  }, [])

  // Debounced quality analysis
  const analyzeQuality = useMemo(() =>
    debounce((text: string) => {
      const tips: QualityTip[] = []

      QUALITY_TIPS.forEach((rule) => {
        if (rule.condition(text)) {
          tips.push({
            tip: rule.tip,
            severity: rule.severity,
          })
        }
      })

      setQualityTips(tips)
      setTokenCount(countTokens(text))
    }, 300),
    [countTokens]
  )

  useEffect(() => {
    analyzeQuality(prompt.text)
  }, [prompt.text, analyzeQuality])

  const handlePromptChange = (field: keyof Prompt, value: string | number) => {
    const updatedPrompt = { ...prompt, [field]: value }
    onPromptChange(updatedPrompt)
  }

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000)
    handlePromptChange("seed", randomSeed)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5" />
            <span>Prompt Editor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your image</Label>
            <Textarea
              id="prompt"
              placeholder="Create stunning images from descriptive prompts..."
              value={prompt.text}
              onChange={(e) => handlePromptChange("text", e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>~{tokenCount} tokens</span>
              <span>{prompt.text.length} characters</span>
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="negatives">Negative prompt (optional)</Label>
            <Textarea
              id="negatives"
              placeholder="What to avoid in the image..."
              value={prompt.negatives || ""}
              onChange={(e) => handlePromptChange("negatives", e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          <Separator />

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Advanced Settings</h4>

            {/* Creativity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Creativity</Label>
                <Badge variant="outline" className="text-xs">
                  {prompt.creativity.toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[prompt.creativity]}
                onValueChange={([value]) => handlePromptChange("creativity", value)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Seed */}
            <div className="space-y-2">
              <Label htmlFor="seed">Seed</Label>
              <div className="flex space-x-2">
                <Input
                  id="seed"
                  type="number"
                  placeholder="Random"
                  value={prompt.seed === "random" ? "" : prompt.seed || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    handlePromptChange("seed", value === "" ? "random" : Number.parseInt(value))
                  }}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={generateRandomSeed} title="Generate random seed">
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use the same seed for consistent results</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Quality Tips */}
      {qualityTips.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Quality Tips</span>
                <Badge variant="secondary" className="text-xs">
                  {qualityTips.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                  >
                    {getSeverityIcon(tip.severity)}
                    <p className="text-sm flex-1">{tip.tip}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}


