"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Upload, Download, BookOpen } from 'lucide-react'

interface VocabularyTerm {
  id: string
  term: string
  domain: 'general' | 'medical' | 'dental'
  pronunciation?: string
  createdAt: string
}

export function VocabularyTab() {
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [newTerm, setNewTerm] = useState('')
  const [newDomain, setNewDomain] = useState<'general' | 'medical' | 'dental'>('medical')
  const [newPronunciation, setNewPronunciation] = useState('')
  const [addingTerm, setAddingTerm] = useState(false)

  // Filter state
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVocabulary()
  }, [])

  const fetchVocabulary = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vocabulary')
      const data = await response.json()

      if (response.ok) {
        setTerms(data.terms || [])
      } else {
        setError(data.error || 'Failed to load vocabulary')
      }
    } catch {
      setError('Network error loading vocabulary')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTerm = async () => {
    if (!newTerm.trim()) return

    try {
      setError('')
      setAddingTerm(true)

      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: newTerm.trim(),
          domain: newDomain,
          pronunciation: newPronunciation.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTerms([data, ...terms])
        setNewTerm('')
        setNewPronunciation('')
      } else {
        setError(data.error || 'Failed to add term')
      }
    } catch {
      setError('Network error adding term')
    } finally {
      setAddingTerm(false)
    }
  }

  const handleDeleteTerm = async (termId: string) => {
    try {
      const response = await fetch(`/api/vocabulary/${termId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTerms(terms.filter(t => t.id !== termId))
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete term')
      }
    } catch {
      setError('Network error deleting term')
    }
  }

  const handleImportCSV = async (file: File) => {
    try {
      setError('')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/vocabulary/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        await fetchVocabulary() // Refresh list
        alert(`Importate ${data.imported} termeni cu succes`)
      } else {
        setError(data.error || 'Failed to import CSV')
      }
    } catch {
      setError('Network error importing CSV')
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/vocabulary/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vocabulary-${Date.now()}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to export CSV')
      }
    } catch {
      setError('Network error exporting CSV')
    }
  }

  const getDomainLabel = (domain: string) => {
    switch (domain) {
      case 'medical': return 'Medical'
      case 'dental': return 'Dentar'
      case 'general': return 'General'
      default: return domain
    }
  }

  const getDomainVariant = (domain: string) => {
    switch (domain) {
      case 'medical': return 'default'
      case 'dental': return 'secondary'
      case 'general': return 'outline'
      default: return 'outline'
    }
  }

  // Filter terms
  const filteredTerms = terms.filter(term => {
    const matchesDomain = filterDomain === 'all' || term.domain === filterDomain
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesDomain && matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Adaugă termeni personalizați pentru a îmbunătăți acuratețea transcripției.
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Adaugă termeni personalizați pentru a îmbunătăți acuratețea transcripției.
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Add term form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Adaugă termen nou</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="newTerm">Termen</Label>
              <Input
                id="newTerm"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="ex: parodontoza, endodontie"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTerm()}
              />
            </div>
            <div>
              <Label htmlFor="newDomain">Domeniu</Label>
              <Select value={newDomain} onValueChange={(value: 'general' | 'medical' | 'dental') => setNewDomain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="dental">Dentar</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="newPronunciation">Pronunție (opțional)</Label>
            <Input
              id="newPronunciation"
              value={newPronunciation}
              onChange={(e) => setNewPronunciation(e.target.value)}
              placeholder="ex: pa-ro-don-to-za"
            />
          </div>

          <Button
            onClick={handleAddTerm}
            disabled={!newTerm.trim() || addingTerm}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {addingTerm ? 'Se adaugă...' : 'Adaugă termen'}
          </Button>
        </CardContent>
      </Card>

      {/* Filters and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="search" className="text-sm">Căutare</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută termeni..."
              className="w-48"
            />
          </div>
          <div>
            <Label htmlFor="filterDomain" className="text-sm">Filtrează domeniu</Label>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="dental">Dentar</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('csvFile')?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleImportCSV(file)
                e.target.value = '' // Reset file input
              }
            }}
          />
        </div>
      </div>

      {/* Terms list */}
      <div className="border rounded-lg bg-white">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>
              {terms.length === 0
                ? 'Nu există termeni în vocabular'
                : 'Nu au fost găsiți termeni cu filtrele selectate'
              }
            </p>
            <p className="text-sm">
              {terms.length === 0
                ? 'Adaugă primul termen pentru a îmbunătăți transcripția'
                : 'Încearcă să modifici filtrele sau să adaugi noi termeni'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTerms.map((vocabularyTerm) => (
              <div key={vocabularyTerm.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-medium">{vocabularyTerm.term}</span>
                    {vocabularyTerm.pronunciation && (
                      <span className="text-sm text-gray-500 ml-2">
                        [{vocabularyTerm.pronunciation}]
                      </span>
                    )}
                  </div>
                  <Badge variant={getDomainVariant(vocabularyTerm.domain) as "default" | "secondary" | "outline" | "destructive"}>
                    {getDomainLabel(vocabularyTerm.domain)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTerm(vocabularyTerm.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Total: {filteredTerms.length} {filteredTerms.length === 1 ? 'termen' : 'termeni'}
        {filterDomain !== 'all' && ` în domeniul ${getDomainLabel(filterDomain).toLowerCase()}`}
      </div>
    </div>
  )
}