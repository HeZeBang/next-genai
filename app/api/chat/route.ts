import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export interface Message {
  role: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, messages, model, input, apiKey, groupId, rootAiType } = (await req.json()) as {
      prompt: string
      messages: Message[]
      model: string
      input: string
      apiKey: string
      groupId: string
      rootAiType: string
    }
    const messagesWithHistory = [
      { content: prompt, role: model == 'o1-mini' ? 'user' : 'system' },
      ...messages
      // { content: input, role: 'user' }
    ]

    const { apiUrl } = getApiConfig()
    const stream = await getGenAIStream(
      apiUrl,
      apiKey,
      model,
      messagesWithHistory,
      input,
      groupId,
      rootAiType
    )

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

const getApiConfig = () => {
  let apiUrl: string
  let apiBaseUrl = process.env.GENAI_API_BASE_URL || 'https://genai.shanghaitech.edu.cn'
  if (apiBaseUrl && apiBaseUrl.endsWith('/')) {
    apiBaseUrl = apiBaseUrl.slice(0, -1)
  }
  apiUrl = `${apiBaseUrl}/htk/chat/start/chat`

  return { apiUrl }
}

const getGenAIStream = async (
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  input: string,
  groupId: string,
  rootAiType: string
) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const res = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': `${apiKey}`
    },
    method: 'POST',
    body: JSON.stringify({
      // model: model,
      // frequency_penalty: 0,
      // max_tokens: 4000,

      messages: messages,
      // presence_penalty: 0,
      stream: true,
      // temperature: 0.5,
      // top_p: 0.95
      chatInfo: input,
      type: '3',
      aiType: model,
      aiSecType: '1',
      chatGroupId: `${groupId}`,
      promptTokens: 0,
      imageUrl: '',
      width: '',
      height: '',
      rootAiType: `${rootAiType}`,
      // maxToken: 16384
      maxToken: null
    })
  })

  if (res.status !== 200) {
    const statusText = res.statusText
    const responseBody = await res.text()
    console.error(`GenAI API response error: ${responseBody}`)
    throw new Error(
      `The GenAI API has encountered an error with a status code of ${res.status} ${statusText}: ${responseBody}`
    )
  }

  if (res.headers.get('Content-Type') == 'application/json') {
    const response = await res.json()
    console.error('GenAI API error:', response)
    throw new Error(response.message || 'Unknown error')
  }

  return new ReadableStream({
    async start(controller) {
      let isReasoning = false
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data

          // TODO: remove this old flag
          if (data === '[DONE]') {
            controller.close()
            return
          }

          try {
            const json = JSON.parse(data)
            if (json.code == 500) {
              throw new Error(json.errMsg)
            }
          } catch (e) {
            throw e
          }

          try {
            const json = JSON.parse(data)
            // console.log(isReasoning, data)
            let text = json.choices[0]?.delta?.content || json.choices[0]?.delta?.reasoning_content
            if (text !== undefined) {
              if (json.choices[0]?.delta?.reasoning_content !== undefined) {
                if (!isReasoning) {
                  text = `<think>\n\n${text}`
                  isReasoning = true
                }
              } else if (isReasoning) {
                text = `</think>\n\n${text}`
                isReasoning = false
              }
            }
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            console.error('Error parsing event data: ', data, e)
            controller.error(e)
          }
        }
      }

      const parser = createParser(onParse)

      try {
        for await (const chunk of res.body as any) {
          // An extra newline is required to make AzureGenAI work.
          const str = decoder.decode(chunk).replace('[DONE]\n', '[DONE]\n\n')
          parser.feed(str)
        }
      } catch (e) {
        console.error('Error parsing event data: ', e)
        controller.close()
      }
    }
  })
}
