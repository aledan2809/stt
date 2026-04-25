"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  Search,
  Trash2,
  Download,
  Loader2,
  Calendar,
  FileText,
  Filter
} from "lucide-react"

interface Transcription {
  id: string
  text: string
  processedText: string | null
  provider: string
  model: string | null
  language: string
  duration: number | null
  confidence: number | null
  wordCount: number | null
  status: string
  createdAt: string
}

export default function HistoryPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTranscriptions()
  }, [])

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch("/api/transcribe")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setTranscriptions(data)
        }
      }
    } catch (error) {
      console.error("Error fetching transcriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sigur vrei să ștergi această transcripție?")) return

    try {
      const response = await fetch(`/api/transcribe/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setTranscriptions((prev) => prev.filter((t) => t.id !== id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    } catch (error) {
      console.error("Error deleting transcription:", error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Sigur vrei să ștergi ${selectedIds.size} transcripții?`)) return

    const idsToDelete = Array.from(selectedIds)
    for (const id of idsToDelete) {
      try {
        await fetch(`/api/transcribe/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error(`Error deleting ${id}:`, error)
      }
    }

    setTranscriptions((prev) => prev.filter((t) => !selectedIds.has(t.id)))
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    const dataToExport = selectedIds.size > 0
      ? transcriptions.filter((t) => selectedIds.has(t.id))
      : filteredTranscriptions

    const exportData = dataToExport.map((t) => ({
      id: t.id,
      text: t.text,
      provider: t.provider,
      language: t.language,
      duration: t.duration,
      wordCount: t.wordCount,
      createdAt: t.createdAt,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcriptii_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTranscriptions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTranscriptions.map((t) => t.id)))
    }
  }

  const filteredTranscriptions = transcriptions.filter((t) => {
    const matchesSearch = searchQuery === "" ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider = providerFilter === "all" || t.provider === providerFilter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesProvider && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const providers = Array.from(new Set(transcriptions.map((t) => t.provider)))

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Istoric Transcrieri
        </h1>
        <p className="text-gray-600 mt-1">
          Toate transcrierile procesate
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cauta in transcrieri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toti providerii</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="completed">Finalizate</SelectItem>
                <SelectItem value="processing">In procesare</SelectItem>
                <SelectItem value="failed">Esuate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {filteredTranscriptions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredTranscriptions.length && filteredTranscriptions.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selectate`
                  : "Selecteaza toate"}
              </span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sterge ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Transcriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transcrieri</CardTitle>
          <CardDescription>
            {filteredTranscriptions.length} transcrieri gasite
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTranscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nicio transcriptie gasita.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredTranscriptions.map((transcription) => (
                  <div
                    key={transcription.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedIds.has(transcription.id)
                        ? "border-blue-300 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(transcription.id)}
                        onChange={() => toggleSelect(transcription.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 line-clamp-3">
                          {transcription.text}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(transcription.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(transcription.duration)}
                          </span>
                          {transcription.wordCount && (
                            <span>{transcription.wordCount} cuvinte</span>
                          )}
                          {transcription.confidence && (
                            <span>
                              Acuratete: {Math.round(transcription.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">
                          {transcription.provider}
                        </Badge>
                        <Badge
                          variant={
                            transcription.status === "completed"
                              ? "default"
                              : transcription.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            transcription.status === "completed"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : transcription.status === "failed"
                              ? ""
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          }
                        >
                          {transcription.status === "completed"
                            ? "Finalizat"
                            : transcription.status === "failed"
                            ? "Esuat"
                            : "In procesare"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transcription.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
