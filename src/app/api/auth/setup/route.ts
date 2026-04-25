import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authManager } from '@/lib/auth'

const setupSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword']
})

export async function POST(request: NextRequest) {
  try {
    // Check if password is already set
    if (await authManager.isPasswordSet()) {
      return NextResponse.json(
        { error: 'Authentication is already configured' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { password } = setupSchema.parse(body)

    // Set password
    await authManager.setPassword(password)

    // Create session cookie
    const authCookieValue = authManager.createAuthCookie()

    const response = NextResponse.json({
      success: true,
      message: 'Authentication configured successfully'
    })

    response.cookies.set('stt-auth', authCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Setup error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to configure authentication' },
      { status: 500 }
    )
  }
}