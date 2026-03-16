"use client"

import { useState, useEffect } from "react"
import { ProviderCard } from "./ProviderCard"
import { Loader2 } from "lucide-react"

interface ProviderCapabilities {
  name: string
  supportsRealtime: boolean
  supportsTimestamps: boolean
  supportedLanguages: string[]
  maxFileSize?: number
  requiresApiKey: boolean
}

interface Provider {
  id: string
  name: string
  capabilities: ProviderCapabilities
  isActive: boolean
  isConfigured: boolean
}

export function ProviderSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/settings/providers")
      if (!response.ok) throw new Error("Failed to fetch providers")
      const data = await response.json()
      setProviders(data.providers)
    } catch (err) {
      setError("Nu s-au putut incarca providerii")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const handleSetActive = async (providerId: string) => {
    try {
      const response = await fetch("/api/settings?action=set-active-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      })
      if (!response.ok) throw new Error("Failed to set active provider")
      await fetchProviders()
    } catch (err) {
      console.error("Error setting active provider:", err)
    }
  }

  const handleConfigure = async (providerId: string, apiKey: string) => {
    try {
      const response = await fetch("/api/settings?action=configure-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          config: { apiKey }
        }),
      })
      if (!response.ok) throw new Error("Failed to configure provider")
      await fetchProviders()
    } catch (err) {
      console.error("Error configuring provider:", err)
    }
  }

  const handleTest = async (providerId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/settings/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      })
      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (err) {
      return { success: false, error: "Eroare de retea" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Configureaza si selecteaza providerul STT activ. Providerul activ va fi folosit pentru toate transcrierile.
      </div>
      {providers.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          onSetActive={handleSetActive}
          onConfigure={handleConfigure}
          onTest={handleTest}
        />
      ))}
    </div>
  )
}
