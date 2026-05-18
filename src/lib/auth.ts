import { NextRequest } from 'next/server'
import { prisma } from './db'
import { encrypt, decrypt } from './crypto'

const AUTH_COOKIE_NAME = 'stt-auth'
const AUTH_SETTING_KEY = 'auth_password_hash'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

export interface AuthSession {
  isValid: boolean
  expiresAt: number
}

export class AuthManager {
  private static instance: AuthManager

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Set authentication password (hashed and stored in settings)
   */
  async setPassword(password: string): Promise<void> {
    if (password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    const hash = await this.hashPassword(password)
    const encryptedHash = encrypt(hash)

    await prisma.setting.upsert({
      where: { key: AUTH_SETTING_KEY },
      update: { value: encryptedHash, encrypted: true },
      create: { key: AUTH_SETTING_KEY, value: encryptedHash, encrypted: true }
    })
  }

  /**
   * Check if password is set
   */
  async isPasswordSet(): Promise<boolean> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: AUTH_SETTING_KEY }
      })
      return !!setting
    } catch {
      return false
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: AUTH_SETTING_KEY }
      })

      if (!setting) {
        return false
      }

      const decryptedHash = decrypt(setting.value)
      return await this.verifyPasswordHash(password, decryptedHash)
    } catch {
      return false
    }
  }

  /**
   * Create authentication session
   */
  createSession(): AuthSession {
    return {
      isValid: true,
      expiresAt: Date.now() + SESSION_DURATION
    }
  }

  /**
   * Verify authentication session
   */
  verifySession(sessionData: string): boolean {
    try {
      const decrypted = decrypt(sessionData)
      const session: AuthSession = JSON.parse(decrypted)
      return session.isValid && session.expiresAt > Date.now()
    } catch {
      return false
    }
  }

  /**
   * Get auth cookie from request
   */
  getAuthCookie(request: NextRequest): string | null {
    return request.cookies.get(AUTH_COOKIE_NAME)?.value || null
  }

  /**
   * Create auth cookie value
   */
  createAuthCookie(): string {
    const session = this.createSession()
    return encrypt(JSON.stringify(session))
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(request: NextRequest): Promise<boolean> {
    // Skip auth check if password is not set (first-time setup)
    if (!(await this.isPasswordSet())) {
      return true
    }

    const authCookie = this.getAuthCookie(request)
    if (!authCookie) {
      return false
    }

    return this.verifySession(authCookie)
  }

  /**
   * Hash password using Web Crypto API
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + process.env.ENCRYPTION_KEY?.slice(0, 16))

    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Verify password hash
   */
  private async verifyPasswordHash(password: string, hash: string): Promise<boolean> {
    const newHash = await this.hashPassword(password)
    return newHash === hash
  }
}

export const authManager = AuthManager.getInstance()