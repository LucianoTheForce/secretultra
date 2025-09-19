"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ReferenceFile {
  id: string
  file: File
  preview: string
  type: "style" | "reference"
}

interface ReferenceUploaderProps {
  maxFiles?: number
  onFilesChange: (files: ReferenceFile[]) => void
  className?: string
}

export function ReferenceUploader({ maxFiles = 2, onFilesChange, className }: ReferenceUploaderProps) {
  const [files, setFiles] = useState<ReferenceFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: ReferenceFile[] = []

      Array.from(fileList).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) return

        if (file.type.startsWith("image/")) {
          const id = Math.random().toString(36).substring(2)
          const preview = URL.createObjectURL(file)

          newFiles.push({
            id,
            file,
            preview,
            type: "reference",
          })
        }
      })

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles]
        setFiles(updatedFiles)
        onFilesChange(updatedFiles)
      }
    },
    [files, maxFiles, onFilesChange],
  )

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)

    // Clean up preview URL
    const fileToRemove = files.find((f) => f.id === id)
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Reference Images</span>
          <Badge variant="secondary" className="text-xs">
            {files.length}/{maxFiles}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            files.length >= maxFiles && "opacity-50 pointer-events-none",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={files.length >= maxFiles}
          />

          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {files.length >= maxFiles ? "Maximum files reached" : "Drop images here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each</p>
          </div>
        </div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {file.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="p-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Reference Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Use high-quality images for better results</li>
              <li>• Style references influence the overall aesthetic</li>
              <li>• Character references help maintain consistency</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}