"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LiveTranscriptProps {
  text: string
  isProcessing: boolean
  className?: string
}

export function LiveTranscript({ text, isProcessing, className }: LiveTranscriptProps) {
  return (
    <div className={cn(
      "border rounded-lg bg-white overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <span className="text-sm font-medium text-gray-700">Transcriptie</span>
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Se proceseaza...
          </div>
        )}
      </div>
      <ScrollArea className="h-64 p-4">
        {text ? (
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
        ) : (
          <p className="text-gray-400 italic">
            Textul transcris va aparea aici...
          </p>
        )}
      </ScrollArea>
    </div>
  )
}
