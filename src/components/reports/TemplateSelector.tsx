"use client"

import { cn } from "@/lib/utils"
import { FileText, Check } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  domain: string
}

const defaultTemplates: Template[] = [
  {
    id: "soap",
    name: "SOAP Note",
    description: "Subiectiv, Obiectiv, Assessment, Plan",
    domain: "medical"
  },
  {
    id: "dental",
    name: "Consultatie Dentara",
    description: "Template pentru consultatie stomatologica",
    domain: "dental"
  },
  {
    id: "radiology",
    name: "Raport Radiologic",
    description: "Structura pentru rapoarte de radiologie",
    domain: "medical"
  },
  {
    id: "observation",
    name: "Fisa Observatie",
    description: "Fisa de observatie clinica",
    domain: "medical"
  }
]

interface TemplateSelectorProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  templates?: Template[]
}

export function TemplateSelector({
  selectedId,
  onSelect,
  templates = defaultTemplates
}: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <div
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
          selectedId === null
            ? "border-blue-500 bg-blue-50"
            : "hover:border-gray-300"
        )}
      >
        <FileText className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <p className="font-medium text-sm">Fara template</p>
          <p className="text-xs text-gray-500">Text liber, fara structura</p>
        </div>
        {selectedId === null && (
          <Check className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {templates.map((template) => (
        <div
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            selectedId === template.id
              ? "border-blue-500 bg-blue-50"
              : "hover:border-gray-300"
          )}
        >
          <FileText className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-sm">{template.name}</p>
            <p className="text-xs text-gray-500">{template.description}</p>
          </div>
          {selectedId === template.id && (
            <Check className="w-5 h-5 text-blue-600" />
          )}
        </div>
      ))}
    </div>
  )
}
