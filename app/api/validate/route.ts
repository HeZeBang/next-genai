import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { apiKey, userid } = (await req.json()) as {
      apiKey: string
      userid: string
    }
    let apiUrl: string
    let apiBaseUrl = process.env.GENAI_API_BASE_URL || 'https://genai.shanghaitech.edu.cn'
    if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
      apiBaseUrl = apiBaseUrl.slice(0, -1)
    }
    apiUrl = `${apiBaseUrl}/htk/ai-user-info/list?userId=${userid}`

    const res = await fetch(apiUrl, {
      headers: {
        'X-Access-Token': `${apiKey}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          throw new Error(data.message || `API 错误: ${data}`)
        }
        return data?.result
      })
      .then((res) => res?.records?.at(0))
      .then((res) => {
        const data = {
          quota: res?.quota,
          used: res?.monthSurplus,
          username: res?.username,
          userid: res?.id
        }
        if (!data.quota) {
          throw new Error('Missing quota in user data')
        }
        if (typeof data.used !== 'number') {
          throw new Error('Invalid or missing "used" (monthSurplus) in user data')
        }
        if (!data.username) {
          throw new Error('Missing username in user data')
        }
        if (!data.userid) {
          throw new Error('Missing userid in user data')
        }
        return data
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
