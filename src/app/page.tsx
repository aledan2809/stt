"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  FileText,
  Clock,
  Activity,
  ArrowRight,
  Loader2,
  Calendar,
  Cpu
} from "lucide-react"

interface Transcription {
  id: string
  text: string
  provider: string
  language: string
  duration: number | null
  wordCount: number | null
  status: string
  createdAt: string
}

interface Stats {
  totalTranscriptions: number
  totalDuration: number
  totalWords: number
  activeProvider: string
}

export default function DashboardPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [stats, setStats] = useState<Stats>({
    totalTranscriptions: 0,
    totalDuration: 0,
    totalWords: 0,
    activeProvider: "openai-whisper"
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch recent transcriptions
      const transcriptionsRes = await fetch("/api/transcribe")
      if (transcriptionsRes.ok) {
        const data = await transcriptionsRes.json()
        if (Array.isArray(data)) {
          setTranscriptions(data.slice(0, 5))

          // Calculate stats
          const totalDuration = data.reduce((sum: number, t: Transcription) => sum + (t.duration || 0), 0)
          const totalWords = data.reduce((sum: number, t: Transcription) => sum + (t.wordCount || 0), 0)

          setStats(prev => ({
            ...prev,
            totalTranscriptions: data.length,
            totalDuration,
            totalWords
          }))
        }
      }

      // Fetch active provider
      const providersRes = await fetch("/api/settings/providers")
      if (providersRes.ok) {
        const data = await providersRes.json()
        const active = data.providers?.find((p: { isActive: boolean }) => p.isActive)
        if (active) {
          setStats(prev => ({ ...prev, activeProvider: active.name }))
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins} min`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bine ai venit!</h1>
          <p className="text-gray-600 mt-1">
            Dashboard STT Module - Dictare Medicala
          </p>
        </div>
        <Link href="/record">
          <Button className="gap-2">
            <Mic className="w-4 h-4" />
            Dictare noua
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcrieri</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTranscriptions}</div>
            <p className="text-xs text-muted-foreground">Total transcrieri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durata</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            <p className="text-xs text-muted-foreground">Audio procesat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuvinte</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total cuvinte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provider</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.activeProvider}</div>
            <p className="text-xs text-muted-foreground">Provider activ</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transcriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transcrieri recente</CardTitle>
            <CardDescription>Ultimele dictari procesate</CardDescription>
          </div>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1">
              Vezi toate <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transcriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nicio transcriptie inca.</p>
              <p className="text-sm mt-1">Incepe prima dictare pentru a vedea rezultatele aici.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {transcriptions.map((transcription) => (
                  <div
                    key={transcription.id}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {truncateText(transcription.text, 150)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transcription.createdAt)}
                        </span>
                        {transcription.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(transcription.duration)}s
                          </span>
                        )}
                        {transcription.wordCount && (
                          <span>{transcription.wordCount} cuvinte</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {transcription.provider}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/record">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-blue-100">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Dictare noua</h3>
                <p className="text-sm text-gray-500">Inregistreaza sau incarca audio</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-green-100">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Rapoarte</h3>
                <p className="text-sm text-gray-500">Vezi si editeaza rapoartele</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="p-3 rounded-lg bg-purple-100">
                <Cpu className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Configurare provider</h3>
                <p className="text-sm text-gray-500">Schimba providerul STT</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
