"use client"

import { useState, useRef, useCallback } from "react"
import { ZoomIn, ZoomOut, RotateCcw, Move, MousePointer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CanvasProProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  imageUrl?: string
  className?: string
}

type Tool = "select" | "move"

export function CanvasPro({ zoom, onZoomChange, imageUrl, className }: CanvasProProps) {
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "move") {
        setIsPanning(true)
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [activeTool]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && activeTool === "move") {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y

        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }))

        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [isPanning, activeTool, lastPanPoint]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
      onZoomChange(newZoom)
    },
    [zoom, onZoomChange]
  )

  const resetView = () => {
    onZoomChange(1)
    setPan({ x: 0, y: 0 })
  }

  const getCursor = () => {
    switch (activeTool) {
      case "move":
        return isPanning ? "grabbing" : "grab"
      case "select":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95">
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("select")}
            title="Select Tool"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "move" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("move")}
            title="Move Tool"
          >
            <Move className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="min-w-[60px] justify-center">
            {Math.round(zoom * 100)}%
          </Badge>
          <Button variant="outline" size="sm" onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView} title="Reset View">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Canvas Content */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Main Canvas */}
          <div className="relative w-[800px] h-[600px] overflow-hidden">
            {/* Canvas Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Generated" className="w-full h-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/ultragaz-character-in-living-room.jpg"
                  alt="Ultragaz Character"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Grid removed per request for a cleaner canvas */}
          </div>
        </div>

        {/* Canvas Info */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {activeTool === "select" ? "Select" : "Move"} Tool
          </Badge>
          <Badge variant="outline" className="text-xs">
            {Math.round(pan.x)}, {Math.round(pan.y)}
          </Badge>
        </div>
      </div>
    </div>
  )
}
