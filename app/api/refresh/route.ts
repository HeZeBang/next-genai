import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = (await req.json()) as {
      apiKey: string
    }

    const res = await fetch(
      `https://genai.shanghaitech.edu.cn/htk/user/info/${apiKey}?_t=${Date.now()}`
    )
      .then(res => res.json())
      .then(data => data.result)
      .then(res => {
        return {
          username: res.userInfo.username,
          token: res.token
        }
      })
    return NextResponse.json(res)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }

}