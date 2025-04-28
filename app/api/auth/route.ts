import { NextRequest, NextResponse } from 'next/server'
import { loginGenAI } from './login'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username: string
      password: string
    }

    loginGenAI(username, password)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
