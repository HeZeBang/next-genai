import { NextRequest, NextResponse } from 'next/server'
import { loginGenAI } from './login'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username: string
      password: string
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const token = await loginGenAI(username, password)
    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
