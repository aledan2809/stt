"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Edit, Trash2, Download } from "lucide-react"

interface Report {
  id: string
  title: string
  content: string
  domain: string
  status: string
  patientRef: string | null
  createdAt: string
  updatedAt: string
}

interface ReportCardProps {
  report: Report
  onDelete?: (id: string) => void
}

export function ReportCard({ report, onDelete }: ReportCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const truncateContent = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const handleDelete = async () => {
    if (!confirm("Sigur vrei sa stergi acest raport?")) return
    onDelete?.(report.id)
  }

  return (
    <Card className="hover:border-blue-200 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {report.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              {formatDate(report.createdAt)}
              {report.patientRef && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Ref: {report.patientRef}</span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge
              variant={
                report.status === "final"
                  ? "success"
                  : report.status === "exported"
                  ? "default"
                  : "secondary"
              }
            >
              {report.status === "final"
                ? "Final"
                : report.status === "exported"
                ? "Exportat"
                : "Draft"}
            </Badge>
            <Badge variant="outline">
              {report.domain === "medical"
                ? "Medical"
                : report.domain === "dental"
                ? "Dentar"
                : "General"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-3">
          {truncateContent(report.content, 200)}
        </p>

        <div className="flex items-center justify-between pt-2 border-t">
          <Link href={`/reports/${report.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-4 h-4" />
              Editeaza
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
