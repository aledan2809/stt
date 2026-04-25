"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AudioSettings {
  sampleRate: '16000' | '44100' | '48000'
  format: 'webm' | 'wav' | 'mp3'
  noiseReduction: boolean
  autoDelete: boolean
}

const defaultSettings: AudioSettings = {
  sampleRate: '16000',
  format: 'webm',
  noiseReduction: false,
  autoDelete: true
}

export function AudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<AudioSettings>(defaultSettings)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    // Check if current settings differ from last saved
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(lastSaved))
  }, [settings, lastSaved])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings?key=audio_settings')

      if (response.ok) {
        const data = await response.json()
        const loadedSettings = data.value || defaultSettings
        setSettings(loadedSettings)
        setLastSaved(loadedSettings)
      } else if (response.status === 404) {
        // Settings not found, use defaults
        setSettings(defaultSettings)
        setLastSaved(defaultSettings)
      } else {
        setError('Failed to load audio settings')
      }
    } catch {
      setError('Network error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/settings?action=save-audio-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        setLastSaved(settings)
        setHasChanges(false)
        // Show success message briefly
        setTimeout(() => {
          // Could add a toast here
        }, 1000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch {
      setError('Network error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    setSettings(lastSaved)
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Setări Înregistrare</CardTitle>
          <CardDescription>
            Configurează parametrii pentru înregistrarea audio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sample Rate</Label>
                <p className="text-sm text-muted-foreground">
                  Calitatea înregistrării audio
                </p>
              </div>
              <Select
                value={settings.sampleRate}
                onValueChange={(value: AudioSettings['sampleRate']) => setSettings({...settings, sampleRate: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16000">16 kHz (Recomandat)</SelectItem>
                  <SelectItem value="44100">44.1 kHz (CD Quality)</SelectItem>
                  <SelectItem value="48000">48 kHz (Studio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Format Stocare</Label>
                <p className="text-sm text-muted-foreground">
                  Formatul fișierelor audio salvate
                </p>
              </div>
              <Select
                value={settings.format}
                onValueChange={(value: AudioSettings['format']) => setSettings({...settings, format: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webm">WebM (Opus)</SelectItem>
                  <SelectItem value="wav">WAV (PCM)</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Procesare Audio</CardTitle>
          <CardDescription>
            Opțiuni de procesare automată
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Reducere Zgomot</Label>
              <p className="text-sm text-muted-foreground">
                Aplică filtrare pentru reducerea zgomotului de fundal
              </p>
            </div>
            <Switch
              checked={settings.noiseReduction}
              onCheckedChange={(checked) => setSettings({...settings, noiseReduction: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Ștergere Automată Audio</Label>
              <p className="text-sm text-muted-foreground">
                Șterge fișierul audio după transcripție (GDPR)
              </p>
            </div>
            <Switch
              checked={settings.autoDelete}
              onCheckedChange={(checked) => setSettings({...settings, autoDelete: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save/Reset buttons */}
      {hasChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Ai modificări nesalvate în setările audio.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetSettings}
                  disabled={saving}
                >
                  Resetează
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-500">
        <strong>Notă:</strong> Setările audio se aplică la înregistrările viitoare.
        Pentru format WebM, fișierele vor fi convertite automat la WAV pentru procesare.
      </div>
    </div>
  )
}
