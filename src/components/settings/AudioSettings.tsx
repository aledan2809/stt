"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AudioSettings() {
  const [sampleRate, setSampleRate] = useState("16000")
  const [noiseReduction, setNoiseReduction] = useState(false)
  const [autoDelete, setAutoDelete] = useState(true)
  const [format, setFormat] = useState("webm")

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Setari Inregistrare</CardTitle>
          <CardDescription>
            Configureaza parametrii pentru inregistrarea audio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Sample Rate</Label>
                <p className="text-sm text-muted-foreground">
                  Calitatea inregistrarii audio
                </p>
              </div>
              <Select value={sampleRate} onValueChange={setSampleRate}>
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
                  Formatul fisierelor audio salvate
                </p>
              </div>
              <Select value={format} onValueChange={setFormat}>
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
            Optiuni de procesare automata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Reducere Zgomot</Label>
              <p className="text-sm text-muted-foreground">
                Aplica filtrare pentru reducerea zgomotului de fundal
              </p>
            </div>
            <Switch
              checked={noiseReduction}
              onCheckedChange={setNoiseReduction}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Stergere Automata Audio</Label>
              <p className="text-sm text-muted-foreground">
                Sterge fisierul audio dupa transcriptie (GDPR)
              </p>
            </div>
            <Switch
              checked={autoDelete}
              onCheckedChange={setAutoDelete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
