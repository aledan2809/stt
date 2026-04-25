"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit3, FileText } from 'lucide-react'

interface Template {
  id: string
  name: string
  structure: {
    sections: Array<{
      id: string
      name: string
      prompt?: string
      required: boolean
    }>
  }
  domain: 'general' | 'medical' | 'dental'
  isDefault: boolean
  createdAt: string
}

export function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [, setEditingTemplate] = useState<Template | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: 'medical' as 'general' | 'medical' | 'dental',
    isDefault: false,
    sections: [
      { id: '1', name: 'Anamneza', prompt: '', required: true },
      { id: '2', name: 'Examen clinic', prompt: '', required: true },
      { id: '3', name: 'Diagnostic', prompt: '', required: true },
      { id: '4', name: 'Plan tratament', prompt: '', required: false }
    ]
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        setError(data.error || 'Failed to load templates')
      }
    } catch {
      setError('Network error loading templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      setError('')
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain,
          isDefault: formData.isDefault,
          structure: { sections: formData.sections }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTemplates([...templates, data])
        setShowCreateForm(false)
        resetForm()
      } else {
        setError(data.error || 'Failed to create template')
      }
    } catch {
      setError('Network error creating template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest template?')) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete template')
      }
    } catch {
      setError('Network error deleting template')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      domain: 'medical',
      isDefault: false,
      sections: [
        { id: '1', name: 'Anamneza', prompt: '', required: true },
        { id: '2', name: 'Examen clinic', prompt: '', required: true },
        { id: '3', name: 'Diagnostic', prompt: '', required: true },
        { id: '4', name: 'Plan tratament', prompt: '', required: false }
      ]
    })
  }

  const getDomainLabel = (domain: string) => {
    switch (domain) {
      case 'medical': return 'Medical'
      case 'dental': return 'Dentar'
      case 'general': return 'General'
      default: return domain
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Gestionează template-urile pentru structurarea rapoartelor medicale.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-3"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Gestionează template-urile pentru structurarea rapoartelor medicale.
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Template nou
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template nou</CardTitle>
            <CardDescription>
              Creează un template pentru structurarea rapoartelor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Nume template</Label>
                <Input
                  id="templateName"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ex: Consultație cardiologică"
                />
              </div>
              <div>
                <Label htmlFor="templateDomain">Domeniu</Label>
                <Select value={formData.domain} onValueChange={(value: 'general' | 'medical' | 'dental') => setFormData({...formData, domain: value})}>
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

            <div className="space-y-2">
              <Label>Secțiuni template</Label>
              {formData.sections.map((section, index) => (
                <div key={section.id} className="flex gap-2 items-center">
                  <Input
                    value={section.name}
                    onChange={(e) => {
                      const newSections = [...formData.sections]
                      newSections[index].name = e.target.value
                      setFormData({...formData, sections: newSections})
                    }}
                    placeholder="Nume secțiune"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSections = formData.sections.filter((_, i) => i !== index)
                      setFormData({...formData, sections: newSections})
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSection = {
                    id: Date.now().toString(),
                    name: '',
                    prompt: '',
                    required: false
                  }
                  setFormData({...formData, sections: [...formData.sections, newSection]})
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adaugă secțiune
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate}>
                Creează template
              </Button>
              <Button variant="outline" onClick={() => {setShowCreateForm(false); resetForm()}}>
                Anulează
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  {template.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {template.structure.sections.length} secțiuni
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 mb-3">
              {template.structure.sections.slice(0, 3).map(section => (
                <div key={section.id} className="text-xs text-gray-600">
                  • {section.name}
                </div>
              ))}
              {template.structure.sections.length > 3 && (
                <div className="text-xs text-gray-400">
                  ... și încă {template.structure.sections.length - 3} secțiuni
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              Domeniu: {getDomainLabel(template.domain)}
            </div>
          </div>
        ))}

        {templates.length === 0 && !loading && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Nu există template-uri create</p>
            <p className="text-sm">Creează primul template pentru a structura rapoartele</p>
          </div>
        )}
      </div>
    </div>
  )
}