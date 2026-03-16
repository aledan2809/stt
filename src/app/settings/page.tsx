"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderSettings } from "@/components/settings/ProviderSettings"
import { AudioSettings } from "@/components/settings/AudioSettings"
import {
  Settings,
  Cpu,
  Volume2,
  FileText,
  BookOpen
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Setari
        </h1>
        <p className="text-gray-600 mt-1">
          Configureaza providerul STT, optiunile audio si preferintele aplicatiei
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="providers" className="gap-2">
            <Cpu className="w-4 h-4" />
            Provideri STT
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Volume2 className="w-4 h-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Template-uri
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Vocabular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <ProviderSettings />
        </TabsContent>

        <TabsContent value="audio">
          <AudioSettings />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="vocabulary">
          <VocabularyTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplatesTab() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Gestioneaza template-urile pentru structurarea rapoartelor medicale.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TemplateCard
          name="SOAP Note"
          description="Subiectiv, Obiectiv, Assessment, Plan"
          domain="medical"
          isDefault
        />
        <TemplateCard
          name="Consultatie Dentara"
          description="Template pentru consultatie stomatologica"
          domain="dental"
        />
        <TemplateCard
          name="Raport Radiologic"
          description="Structura pentru rapoarte de radiologie"
          domain="medical"
        />
        <TemplateCard
          name="Fisa Observatie"
          description="Fisa de observatie clinica"
          domain="medical"
        />
      </div>
    </div>
  )
}

function TemplateCard({
  name,
  description,
  domain,
  isDefault = false
}: {
  name: string
  description: string
  domain: string
  isDefault?: boolean
}) {
  return (
    <div className="border rounded-lg p-4 bg-white hover:border-blue-300 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {isDefault && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Default
          </span>
        )}
      </div>
      <div className="mt-3 text-xs text-gray-400">
        Domeniu: {domain === "medical" ? "Medical" : "Dentar"}
      </div>
    </div>
  )
}

function VocabularyTab() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Adauga termeni personalizati pentru a imbunatati acuratetea transcriptiei.
      </div>

      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Adauga termen nou..."
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Adauga
        </button>
      </div>

      <div className="border rounded-lg divide-y bg-white">
        <VocabularyItem term="paracetamol" domain="medical" />
        <VocabularyItem term="ibuprofen" domain="medical" />
        <VocabularyItem term="endodontie" domain="dental" />
        <VocabularyItem term="parodontoza" domain="dental" />
        <VocabularyItem term="radiografie panoramica" domain="dental" />
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
          Import CSV
        </button>
        <button className="px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
          Export CSV
        </button>
      </div>
    </div>
  )
}

function VocabularyItem({ term, domain }: { term: string; domain: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-medium">{term}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {domain}
        </span>
      </div>
      <button className="text-red-500 hover:text-red-700 text-sm">
        Sterge
      </button>
    </div>
  )
}
