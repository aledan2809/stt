"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportEditor } from "@/components/reports/ReportEditor"
import { TemplateSelector } from "@/components/reports/TemplateSelector"
import {
  ArrowLeft,
  Save,
  Download,
  Loader2,
  FileText,
  Calendar,
  Clock
} from "lucide-react"

interface Report {
  id: string
  title: string
  content: string
  domain: string
  status: string
  templateId: string | null
  patientRef: string | null
  createdAt: string
  updatedAt: string
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editable fields
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [domain, setDomain] = useState("medical")
  const [status, setStatus] = useState("draft")
  const [patientRef, setPatientRef] = useState("")
  const [templateId, setTemplateId] = useState<string | null>(null)

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
        setTitle(data.title)
        setContent(data.content)
        setDomain(data.domain)
        setStatus(data.status)
        setPatientRef(data.patientRef || "")
        setTemplateId(data.templateId)
      } else {
        setError("Raportul nu a fost gasit")
      }
    } catch (error) {
      console.error("Error fetching report:", error)
      setError("Eroare la incarcarea raportului")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          domain,
          status,
          patientRef: patientRef || null,
          templateId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save report")
      }

      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Error saving report:", error)
      setError("Nu s-a putut salva raportul")
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "txt" })
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s+/g, "_")}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      // Fallback: download as plain text
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s+/g, "_")}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-600">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.push("/reports")}
          className="mt-4"
        >
          Inapoi la rapoarte
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reports")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editeaza Raport
            </h1>
            <p className="text-gray-600 text-sm">
              Modificat: {report && formatDate(report.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salveaza
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label htmlFor="title">Titlu</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titlul raportului"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Continut</Label>
            <ReportEditor
              content={content}
              onChange={setContent}
              className="mt-1"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Detalii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="exported">Exportat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Domeniu</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="dental">Dentar</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="patientRef">Referinta Pacient</Label>
                <Input
                  id="patientRef"
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="ID sau referinta"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateSelector
                selectedId={templateId}
                onSelect={setTemplateId}
              />
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informatii</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Creat: {formatDate(report.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Modificat: {formatDate(report.updatedAt)}
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {content.split(/\s+/).filter(Boolean).length} cuvinte
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
