import { NextRequest, NextResponse } from 'next/server'
import { authManager } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const isPasswordSet = await authManager.isPasswordSet()
    const isAuthenticated = await authManager.isAuthenticated(request)

    return NextResponse.json({
      isPasswordSet,
      isAuthenticated,
      requiresSetup: !isPasswordSet
    })
  } catch (error) {
    console.error('Auth status error:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}