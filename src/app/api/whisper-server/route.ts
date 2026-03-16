// STT Module - Whisper Local Server Management API
// Handles auto-start/stop and model switching

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const WHISPER_PORT = 8787;
const WHISPER_URL = `http://127.0.0.1:${WHISPER_PORT}`;

const MODELS = [
  {
    id: 'tiny',
    name: 'Tiny',
    ram: '~1 GB',
    speed: 'Foarte rapid',
    accuracy: '~70%',
    description: 'Cel mai rapid, potrivit pentru teste rapide. Acuratete scazuta.',
  },
  {
    id: 'base',
    name: 'Base',
    ram: '~1 GB',
    speed: 'Rapid',
    accuracy: '~75%',
    description: 'Rapid cu acuratete acceptabila. Bun pentru dictari simple.',
  },
  {
    id: 'small',
    name: 'Small',
    ram: '~2 GB',
    speed: 'Moderat',
    accuracy: '~82%',
    description: 'Echilibru intre viteza si acuratete. Recomandat pentru inceput.',
  },
  {
    id: 'medium',
    name: 'Medium',
    ram: '~5 GB',
    speed: 'Lent',
    accuracy: '~88%',
    description: 'Acuratete buna pentru romana. Necesita mai multa memorie.',
  },
  {
    id: 'large-v3',
    name: 'Large V3',
    ram: '~10 GB',
    speed: 'Foarte lent',
    accuracy: '~92%',
    description: 'Cea mai buna acuratete. Necesita GPU sau multa RAM.',
  },
];

async function isServerRunning(): Promise<{ running: boolean; model?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${WHISPER_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return { running: true, model: data.model };
    }
    return { running: false };
  } catch {
    return { running: false };
  }
}

async function getSavedModel(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'whisper_local_model' },
  });
  return setting?.value ? JSON.parse(setting.value) : 'small';
}

// GET - server status + available models
export async function GET() {
  try {
    const status = await isServerRunning();
    const savedModel = await getSavedModel();

    return NextResponse.json({
      ...status,
      savedModel,
      models: MODELS,
      setupReady: true, // venv exists check happens client-side
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - start server, stop server, or change model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'start') {
      const status = await isServerRunning();
      if (status.running) {
        return NextResponse.json({
          success: true,
          message: 'Server already running',
          model: status.model,
        });
      }

      const model = body.model || await getSavedModel();

      // Save model preference
      await prisma.setting.upsert({
        where: { key: 'whisper_local_model' },
        update: { value: JSON.stringify(model) },
        create: { key: 'whisper_local_model', value: JSON.stringify(model), encrypted: false },
      });

      // Start whisper server as detached process
      const whisperDir = path.join(process.cwd(), 'whisper');
      const venvPython = path.join(whisperDir, 'venv', 'Scripts', 'python.exe');
      const serverScript = path.join(whisperDir, 'transcribe_server.py');

      const child = spawn(venvPython, [serverScript, '--model', model, '--port', String(WHISPER_PORT)], {
        cwd: whisperDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });

      child.unref();

      // Wait for server to be ready (model loading takes time)
      const maxWait = 120000; // 2 min for large models
      const start = Date.now();
      let ready = false;

      while (Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 1000));
        const check = await isServerRunning();
        if (check.running) {
          ready = true;
          break;
        }
      }

      if (!ready) {
        return NextResponse.json(
          { error: `Server-ul nu a pornit in ${maxWait / 1000}s. Verifica daca setup-whisper.bat a fost rulat.` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Whisper server started with model ${model}`,
        model,
      });
    }

    if (action === 'stop') {
      try {
        await fetch(`${WHISPER_URL}/shutdown`, { method: 'POST' });
      } catch {
        // Server might not respond to shutdown, try to kill by port
      }
      return NextResponse.json({ success: true, message: 'Stop signal sent' });
    }

    if (action === 'set-model') {
      const model = body.model as string;
      if (!MODELS.find(m => m.id === model)) {
        return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
      }

      await prisma.setting.upsert({
        where: { key: 'whisper_local_model' },
        update: { value: JSON.stringify(model) },
        create: { key: 'whisper_local_model', value: JSON.stringify(model), encrypted: false },
      });

      // If server is running, it needs restart with new model
      const status = await isServerRunning();
      const needsRestart = status.running && status.model !== model;

      return NextResponse.json({
        success: true,
        model,
        needsRestart,
        message: needsRestart
          ? 'Model salvat. Serverul trebuie repornit pentru a folosi noul model.'
          : 'Model salvat.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
