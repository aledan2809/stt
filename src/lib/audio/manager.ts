import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export interface AudioConversionOptions {
  outputFormat: 'wav' | 'mp3' | 'flac'
  sampleRate: number
  channels: number
  bitrate?: string
}

export interface AudioInfo {
  duration: number
  sampleRate: number
  channels: number
  format: string
  size: number
}

export class AudioManager {
  private static instance: AudioManager
  private tempDir: string

  private constructor() {
    this.tempDir = path.join(os.tmpdir(), 'stt-audio')
    this.ensureTempDir()
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir)
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true })
    }
  }

  /**
   * Convert audio file to specified format using ffmpeg
   */
  public async convertAudio(
    inputBuffer: Buffer,
    options: AudioConversionOptions
  ): Promise<Buffer> {
    const inputPath = path.join(this.tempDir, `input_${Date.now()}.tmp`)
    const outputPath = path.join(
      this.tempDir,
      `output_${Date.now()}.${options.outputFormat}`
    )

    try {
      // Write input buffer to temp file
      await fs.writeFile(inputPath, inputBuffer)

      // Build ffmpeg command
      const args = [
        '-i', inputPath,
        '-ar', options.sampleRate.toString(),
        '-ac', options.channels.toString(),
        '-f', options.outputFormat
      ]

      if (options.outputFormat === 'wav') {
        args.push('-acodec', 'pcm_s16le')
      } else if (options.outputFormat === 'mp3' && options.bitrate) {
        args.push('-b:a', options.bitrate)
      }

      args.push('-y', outputPath)

      // Execute ffmpeg
      await this.executeFFmpeg(args)

      // Read output file
      const outputBuffer = await fs.readFile(outputPath)

      // Cleanup temp files
      await this.cleanup([inputPath, outputPath])

      return outputBuffer
    } catch (error) {
      // Cleanup on error
      await this.cleanup([inputPath, outputPath])
      throw error
    }
  }

  /**
   * Convert WebM audio from MediaRecorder to WAV format for STT providers
   */
  public async webmToWav(webmBuffer: Buffer): Promise<Buffer> {
    return this.convertAudio(webmBuffer, {
      outputFormat: 'wav',
      sampleRate: 16000,
      channels: 1
    })
  }

  /**
   * Get audio file information using ffprobe
   */
  public async getAudioInfo(audioBuffer: Buffer): Promise<AudioInfo> {
    const inputPath = path.join(this.tempDir, `probe_${Date.now()}.tmp`)

    try {
      await fs.writeFile(inputPath, audioBuffer)

      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        inputPath
      ]

      const result = await this.executeFFprobe(args)
      const info = JSON.parse(result)

      // Find audio stream
      const audioStream = info.streams.find((s: { codec_type: string; sample_rate?: string; channels?: number; codec_name?: string }) => s.codec_type === 'audio')
      if (!audioStream) {
        throw new Error('No audio stream found')
      }

      await this.cleanup([inputPath])

      return {
        duration: parseFloat(info.format.duration || '0'),
        sampleRate: parseInt(audioStream.sample_rate || '0'),
        channels: audioStream.channels || 0,
        format: audioStream.codec_name || 'unknown',
        size: parseInt(info.format.size || '0')
      }
    } catch (error) {
      await this.cleanup([inputPath])
      throw error
    }
  }

  /**
   * Validate if audio file is supported
   */
  public validateAudioFile(filename: string, buffer: Buffer): boolean {
    const supportedExtensions = ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.flac']
    const ext = path.extname(filename.toLowerCase())

    if (!supportedExtensions.includes(ext)) {
      return false
    }

    // Check file magic bytes
    const header = buffer.slice(0, 12)

    // WebM
    if (header.includes(Buffer.from('webm', 'ascii'))) return true
    // WAV
    if (header.slice(0, 4).toString('ascii') === 'RIFF' &&
        header.slice(8, 12).toString('ascii') === 'WAVE') return true
    // MP3
    if (header.slice(0, 3).toString('hex') === 'fff' ||
        header.slice(0, 3).toString('ascii') === 'ID3') return true
    // OGG
    if (header.slice(0, 4).toString('ascii') === 'OggS') return true
    // M4A
    if (header.slice(4, 8).toString('ascii') === 'ftyp') return true
    // FLAC
    if (header.slice(0, 4).toString('ascii') === 'fLaC') return true

    return false
  }

  /**
   * Execute ffmpeg command
   */
  private executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args)

      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start ffmpeg: ${error.message}`))
      })
    })
  }

  /**
   * Execute ffprobe command
   */
  private executeFFprobe(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', args)

      let stdout = ''
      let stderr = ''

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`))
        }
      })

      ffprobe.on('error', (error) => {
        reject(new Error(`Failed to start ffprobe: ${error.message}`))
      })
    })
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.access(file)
          await fs.unlink(file)
        } catch {
          // File doesn't exist, ignore
        }
      })
    )
  }

  /**
   * Check if ffmpeg is available
   */
  public async checkFFmpegAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const result = await this.executeFFprobe(['-version'])
      const versionMatch = result.match(/ffprobe version ([^\s]+)/)
      return {
        available: true,
        version: versionMatch ? versionMatch[1] : 'unknown'
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const audioManager = AudioManager.getInstance()