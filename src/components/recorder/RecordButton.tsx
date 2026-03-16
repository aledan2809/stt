"use client"

import { cn } from "@/lib/utils"
import { Mic, Square, Pause, Play } from "lucide-react"

type RecordingState = "idle" | "recording" | "paused"

interface RecordButtonProps {
  state: RecordingState
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  disabled?: boolean
}

export function RecordButton({
  state,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled
}: RecordButtonProps) {
  const handleClick = () => {
    if (state === "idle") {
      onStart()
    } else if (state === "recording") {
      onPause()
    } else if (state === "paused") {
      onResume()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Record Button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all",
          "focus:outline-none focus:ring-4 focus:ring-offset-2",
          state === "idle" && "bg-red-500 hover:bg-red-600 focus:ring-red-300",
          state === "recording" && "bg-red-500 animate-pulse-record focus:ring-red-300",
          state === "paused" && "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {state === "idle" && <Mic className="w-10 h-10 text-white" />}
        {state === "recording" && <Pause className="w-10 h-10 text-white" />}
        {state === "paused" && <Play className="w-10 h-10 text-white ml-1" />}

        {/* Pulse rings for recording state */}
        {state === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
            <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" />
          </>
        )}
      </button>

      {/* State Label */}
      <span className={cn(
        "text-sm font-medium",
        state === "idle" && "text-gray-600",
        state === "recording" && "text-red-600",
        state === "paused" && "text-yellow-600"
      )}>
        {state === "idle" && "Apasa pentru a incepe"}
        {state === "recording" && "Inregistrare..."}
        {state === "paused" && "Pauza"}
      </span>

      {/* Stop Button (visible when recording or paused) */}
      {(state === "recording" || state === "paused") && (
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Square className="w-4 h-4" />
          Opreste
        </button>
      )}
    </div>
  )
}
