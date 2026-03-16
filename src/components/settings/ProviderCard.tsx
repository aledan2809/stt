"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Languages,
  Server,
  HardDrive,
  Gauge,
  Target,
} from "lucide-react"

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

interface WhisperModel {
  id: string
  name: string
  ram: string
  speed: string
  accuracy: string
  description: string
}

interface ProviderCardProps {
  provider: Provider
  onSetActive: (providerId: string) => Promise<void>
  onConfigure: (providerId: string, apiKey: string) => Promise<void>
  onTest: (providerId: string) => Promise<{ success: boolean; error?: string }>
}

export function ProviderCard({ provider, onSetActive, onConfigure, onTest }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  // Whisper local state
  const [whisperModels, setWhisperModels] = useState<WhisperModel[]>([])
  const [whisperSelectedModel, setWhisperSelectedModel] = useState("small")
  const [whisperRunning, setWhisperRunning] = useState(false)
  const [whisperCurrentModel, setWhisperCurrentModel] = useState<string | undefined>()
  const [whisperStarting, setWhisperStarting] = useState(false)
  const [whisperStopping, setWhisperStopping] = useState(false)
  const [whisperError, setWhisperError] = useState<string | null>(null)

  // Load whisper status when this is the whisper-local card
  useEffect(() => {
    if (provider.id === "whisper-local") {
      fetchWhisperStatus()
    }
  }, [provider.id])

  const fetchWhisperStatus = async () => {
    try {
      const res = await fetch("/api/whisper-server")
      const data = await res.json()
      setWhisperModels(data.models || [])
      setWhisperSelectedModel(data.savedModel || "small")
      setWhisperRunning(data.running || false)
      setWhisperCurrentModel(data.model)
    } catch {
      // ignore
    }
  }

  const handleWhisperStart = async () => {
    setWhisperStarting(true)
    setWhisperError(null)
    try {
      const res = await fetch("/api/whisper-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", model: whisperSelectedModel }),
      })
      const data = await res.json()
      if (data.success) {
        setWhisperRunning(true)
        setWhisperCurrentModel(data.model || whisperSelectedModel)
      } else {
        setWhisperError(data.error || "Nu s-a putut porni serverul")
      }
    } catch (err) {
      setWhisperError("Eroare la pornirea serverului")
    } finally {
      setWhisperStarting(false)
    }
  }

  const handleWhisperStop = async () => {
    setWhisperStopping(true)
    try {
      await fetch("/api/whisper-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      })
      // Wait a moment then check
      await new Promise(r => setTimeout(r, 1500))
      setWhisperRunning(false)
      setWhisperCurrentModel(undefined)
    } finally {
      setWhisperStopping(false)
    }
  }

  const handleWhisperModelChange = async (modelId: string) => {
    setWhisperSelectedModel(modelId)
    try {
      const res = await fetch("/api/whisper-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-model", model: modelId }),
      })
      const data = await res.json()
      if (data.needsRestart) {
        setWhisperError("Model schimbat. Opreste si reporneste serverul pentru a aplica.")
      }
    } catch {
      // ignore
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return
    setIsSaving(true)
    try {
      await onConfigure(provider.id, apiKey)
      setApiKey("")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await onTest(provider.id)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, error: "Eroare la testare" })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSetActive = async () => {
    // For whisper-local, auto-start server if not running
    if (provider.id === "whisper-local" && !whisperRunning) {
      setWhisperStarting(true)
      setWhisperError(null)
      try {
        const res = await fetch("/api/whisper-server", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", model: whisperSelectedModel }),
        })
        const data = await res.json()
        if (data.success) {
          setWhisperRunning(true)
          setWhisperCurrentModel(data.model || whisperSelectedModel)
        } else {
          setWhisperError(data.error || "Nu s-a putut porni serverul")
          setWhisperStarting(false)
          return // Don't activate if server failed to start
        }
      } catch {
        setWhisperError("Eroare la pornirea serverului")
        setWhisperStarting(false)
        return
      }
      setWhisperStarting(false)
    }
    await onSetActive(provider.id)
  }

  const isWhisperLocal = provider.id === "whisper-local"

  return (
    <Card className={provider.isActive ? "border-blue-500 border-2" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {provider.capabilities.name}
              {provider.isActive && (
                <Badge variant="default" className="bg-blue-600">Activ</Badge>
              )}
              {provider.isConfigured && !provider.isActive && (
                <Badge variant="secondary">Configurat</Badge>
              )}
              {isWhisperLocal && whisperRunning && (
                <Badge variant="default" className="bg-green-600">Server pornit</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {provider.id === "openai-whisper" && "OpenAI Whisper API - Acuratete buna pentru romana"}
              {provider.id === "deepgram" && "Deepgram Nova-2 - Transcriptie rapida cu suport romana"}
              {provider.id === "vatis-tech" && "Vatis Tech - Cea mai buna acuratete pentru romana (97%)"}
              {provider.id === "whisper-local" && "Whisper local (faster-whisper) - Gratis, fara API key, ruleaza pe calculatorul tau"}
            </CardDescription>
          </div>
          <Switch
            checked={provider.isActive}
            onCheckedChange={handleSetActive}
            disabled={!provider.isConfigured || whisperStarting}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capabilities */}
        <div className="flex flex-wrap gap-2">
          {provider.capabilities.supportsRealtime && (
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              Real-time
            </Badge>
          )}
          {provider.capabilities.supportsTimestamps && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Timestamps
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Languages className="w-3 h-3" />
            {provider.capabilities.supportedLanguages.includes("ro") ? "Romana" : "Multi-lang"}
          </Badge>
          {isWhisperLocal && (
            <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
              Gratis
            </Badge>
          )}
        </div>

        {/* Whisper Local - Model Selection */}
        {isWhisperLocal && whisperModels.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Model AI
            </Label>
            <div className="grid gap-2">
              {whisperModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleWhisperModelChange(m.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    whisperSelectedModel === m.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.name}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {m.ram}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {m.speed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {m.accuracy}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                  {whisperCurrentModel === m.id && whisperRunning && (
                    <Badge variant="outline" className="mt-1 text-green-700 border-green-300 text-xs">
                      Activ acum
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Server Controls */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleWhisperStart}
                disabled={whisperStarting || whisperRunning}
                size="sm"
                className="gap-2"
              >
                {whisperStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Se porneste... (incarca modelul)
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4" />
                    {whisperRunning ? "Server pornit" : "Porneste serverul"}
                  </>
                )}
              </Button>
              {whisperRunning && (
                <Button
                  onClick={handleWhisperStop}
                  disabled={whisperStopping}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  {whisperStopping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Opreste"
                  )}
                </Button>
              )}
            </div>

            {whisperError && (
              <p className="text-sm text-amber-600">{whisperError}</p>
            )}
          </div>
        )}

        {/* API Key Input (for cloud providers) */}
        {provider.capabilities.requiresApiKey && (
          <div className="space-y-2">
            <Label htmlFor={`apikey-${provider.id}`}>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={`apikey-${provider.id}`}
                  type={showApiKey ? "text" : "password"}
                  placeholder={provider.isConfigured ? "••••••••••••" : "Introdu API key..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || isSaving}
                size="default"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salveaza"}
              </Button>
            </div>
          </div>
        )}

        {/* Test Connection */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {testResult && (
              <>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={testResult.success ? "text-green-600" : "text-red-600"}>
                  {testResult.success ? "Conexiune reusita" : testResult.error}
                </span>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={(!provider.isConfigured && !isWhisperLocal) || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se testeaza...
              </>
            ) : (
              "Testeaza conexiunea"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
