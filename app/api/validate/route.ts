import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { apiKey, userid } = (await req.json()) as {
      apiKey: string
      userid: string
    }
    const res = await fetch(
      `https://genai.shanghaitech.edu.cn/htk/ai-user-info/list?userId=${userid}`,
      {
        headers: {
          'X-Access-Token': `${apiKey}`
        }
      }
    )
      .then((res) => res.json())
      .then((data) => data.result)
      .then((res) => res.records.at(0))
      .then((res) => {
        const data = {
          quota: res.quota,
          used: res.monthSurplus,
          username: res.username,
          userid: res.id
        }
        if (!!data.quota && !!data.used && data.username && data.userid) return data
        else throw new Error('One of data is undefined')
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
