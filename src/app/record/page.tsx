"use client"

import { useState, useRef, useCallback } from "react"
import { RecordButton } from "@/components/recorder/RecordButton"
import { WaveformBars } from "@/components/recorder/Waveform"
import { LiveTranscript } from "@/components/recorder/LiveTranscript"
import { AudioUpload } from "@/components/recorder/AudioUpload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mic, Upload, Clock, FileText, Save, RotateCcw } from "lucide-react"

type RecordingState = "idle" | "recording" | "paused"

export default function RecordPage() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [template, setTemplate] = useState("none")
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm"
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setRecordingState("recording")

      // Start timer
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Nu s-a putut accesa microfonul. Verifica permisiunile.")
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause()
      setRecordingState("paused")
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume()
      setRecordingState("recording")
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }

        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop())

        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })

        setRecordingState("idle")

        // Transcribe
        await transcribeAudio(blob)
        resolve()
      }

      mediaRecorderRef.current!.stop()
    })
  }, [])

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("options", JSON.stringify({
        language: "ro",
        includeTimestamps: false
      }))

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Eroare la transcriptie")
      }

      const data = await response.json()
      setTranscript(data.text)
    } catch (err) {
      console.error("Transcription error:", err)
      setError(err instanceof Error ? err.message : "Eroare la transcriptie")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("audio", selectedFile)
      formData.append("options", JSON.stringify({
        language: "ro",
        includeTimestamps: false
      }))

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Eroare la transcriptie")
      }

      const data = await response.json()
      setTranscript(data.text)
      setSelectedFile(null)
    } catch (err) {
      console.error("Transcription error:", err)
      setError(err instanceof Error ? err.message : "Eroare la transcriptie")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setTranscript("")
    setSelectedFile(null)
    setDuration(0)
    setError(null)
  }

  const handleSaveReport = async () => {
    if (!transcript) return

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Dictare ${new Date().toLocaleDateString("ro-RO")}`,
          content: transcript,
          domain: "medical",
          status: "draft"
        })
      })

      if (!response.ok) throw new Error("Failed to save report")

      // Could redirect to the report page here
      // Show success message - could be replaced with toast notification
      console.log("Raport salvat cu succes!")
    } catch {
      setError("Nu s-a putut salva raportul")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mic className="w-6 h-6" />
          Dictare
        </h1>
        <p className="text-gray-600 mt-1">
          Inregistreaza sau incarca audio pentru transcriptie
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Recording */}
        <div className="space-y-4">
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="record" className="flex-1 gap-2">
                <Mic className="w-4 h-4" />
                Inregistreaza
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                Incarca fisier
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-6">
                    {/* Timer */}
                    <div className="flex items-center gap-2 text-2xl font-mono text-gray-700">
                      <Clock className="w-5 h-5" />
                      {formatDuration(duration)}
                    </div>

                    {/* Waveform */}
                    <WaveformBars isRecording={recordingState === "recording"} />

                    {/* Record Button */}
                    <RecordButton
                      state={recordingState}
                      onStart={startRecording}
                      onStop={stopRecording}
                      onPause={pauseRecording}
                      onResume={resumeRecording}
                      disabled={isProcessing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <AudioUpload
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onClear={() => setSelectedFile(null)}
                    disabled={isProcessing}
                  />

                  {selectedFile && (
                    <Button
                      onClick={handleFileUpload}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? "Se proceseaza..." : "Transcrie fisierul"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Template (optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteaza template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fara template</SelectItem>
                  <SelectItem value="soap">SOAP Note</SelectItem>
                  <SelectItem value="dental">Consultatie Dentara</SelectItem>
                  <SelectItem value="radiology">Raport Radiologic</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transcript */}
        <div className="space-y-4">
          <LiveTranscript
            text={transcript}
            isProcessing={isProcessing}
            className="min-h-[300px]"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!transcript && !selectedFile}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reseteaza
            </Button>
            <Button
              onClick={handleSaveReport}
              disabled={!transcript || isProcessing}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              Salveaza ca raport
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
