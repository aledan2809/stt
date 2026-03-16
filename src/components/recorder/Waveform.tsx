"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface WaveformProps {
  analyser: AnalyserNode | null
  isRecording: boolean
  className?: string
}

export function Waveform({ analyser, isRecording, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      if (!canvas || !ctx) return

      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, width, height)

      if (!analyser || !isRecording) {
        // Draw idle state - flat line
        ctx.beginPath()
        ctx.strokeStyle = "#cbd5e1"
        ctx.lineWidth = 2
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
        return
      }

      // Get frequency data
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteTimeDomainData(dataArray)

      // Draw waveform
      ctx.beginPath()
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2

      const sliceWidth = width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.lineTo(width, height / 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isRecording])

  return (
    <div className={cn("rounded-lg overflow-hidden border bg-slate-50", className)}>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="w-full h-24"
      />
    </div>
  )
}

// Simple bars visualization as fallback
export function WaveformBars({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) => i)

  return (
    <div className="flex items-center justify-center gap-1 h-24 bg-slate-50 rounded-lg border px-4">
      {bars.map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-blue-500 rounded-full transition-all",
            isRecording ? "animate-waveform" : "h-1"
          )}
          style={{
            height: isRecording ? `${Math.random() * 60 + 20}%` : "4px",
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
    </div>
  )
}
