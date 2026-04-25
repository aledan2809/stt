"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderSettings } from "@/components/settings/ProviderSettings"
import { AudioSettings } from "@/components/settings/AudioSettings"
import { TemplatesTab } from "@/components/settings/TemplatesTab"
import { VocabularyTab } from "@/components/settings/VocabularyTab"
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
