"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportCard } from "@/components/reports/ReportCard"
import {
  FileText,
  Search,
  Plus,
  Loader2,
  Filter,
} from "lucide-react"

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setReports(data)
        } else if (data.reports) {
          setReports(data.reports)
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error("Error deleting report:", error)
    }
  }

  const filteredReports = reports.filter((r) => {
    const matchesSearch = searchQuery === "" ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDomain = domainFilter === "all" || r.domain === domainFilter
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesDomain && matchesStatus
  })

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Rapoarte
          </h1>
          <p className="text-gray-600 mt-1">
            Gestioneaza rapoartele medicale
          </p>
        </div>
        <Link href="/record">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Raport nou
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cauta rapoarte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Domeniu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="dental">Dentar</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="exported">Exportat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Niciun raport gasit.</p>
              <p className="text-sm mt-1">
                Creeaza un raport nou din pagina de dictare.
              </p>
              <Link href="/record">
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Dictare noua
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
