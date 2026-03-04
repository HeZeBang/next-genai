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
    apiUrl = `${apiBaseUrl}/htk/ai/aiModel/list?_t=${Date.now()}&pageNo=1&pageSize=999`

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
        return data?.result?.records || []
      })
      .then((records: any[]) => {
        return records.map((record) => ({
          id: record.aiType,
          role: 'system',
          name: record.aiName,
          prompt: 'You are an AI assistant that helps people find information.',
          aiType: record.aiType,
          rootAiType: record.rootAiType,
          promptPrice: record.promptPrice,
          completionPrice: record.completionPrice,
          isDefault: false
        }))
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
