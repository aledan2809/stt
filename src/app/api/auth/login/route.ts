import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authManager } from '@/lib/auth'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required')
})

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = loginSchema.parse(body)

    // Check if password is set
    if (!(await authManager.isPasswordSet())) {
      return NextResponse.json(
        { error: 'No password configured. Please set up authentication first.' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await authManager.verifyPassword(password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create session cookie
    const authCookieValue = authManager.createAuthCookie()

    const response = NextResponse.json({ success: true })
    response.cookies.set('stt-auth', authCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Apply rate limiting to login attempts
export const POST = withRateLimit(rateLimiters.auth, handlePOST)