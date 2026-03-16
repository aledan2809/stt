"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Upload, File, X } from "lucide-react"

interface AudioUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
  disabled?: boolean
  className?: string
}

const ACCEPTED_TYPES = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/webm",
  "audio/ogg",
]

export function AudioUpload({
  onFileSelect,
  selectedFile,
  onClear,
  disabled,
  className
}: AudioUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file && ACCEPTED_TYPES.includes(file.type)) {
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (selectedFile) {
    return (
      <div className={cn(
        "border-2 border-dashed rounded-lg p-6 bg-blue-50 border-blue-300",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        "hover:border-blue-400 hover:bg-blue-50",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="audio-upload"
      />
      <label
        htmlFor="audio-upload"
        className={cn(
          "flex flex-col items-center gap-3",
          !disabled && "cursor-pointer"
        )}
      >
        <div className="p-3 bg-gray-100 rounded-full">
          <Upload className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-700">
            Trage si plaseaza un fisier audio
          </p>
          <p className="text-sm text-gray-500 mt-1">
            sau click pentru a selecta
          </p>
        </div>
        <p className="text-xs text-gray-400">
          WAV, MP3, M4A, WebM, OGG (max 100MB)
        </p>
      </label>
    </div>
  )
}
