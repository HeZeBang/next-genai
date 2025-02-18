import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = (await req.json()) as {
      apiKey: string
    }
    let apiUrl: string
    let apiBaseUrl = process.env.GENAI_API_BASE_URL || 'https://genai.shanghaitech.edu.cn'
    if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
      apiBaseUrl = apiBaseUrl.slice(0, -1)
    }
    apiUrl = `${apiBaseUrl}/htk/user/info/${apiKey}?_t=${Date.now()}`

    const res = await fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => data.result)
      .then((res) => {
        return {
          username: res.userInfo.username,
          userid: res.userInfo.id,
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
