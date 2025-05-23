export interface ChatMessage {
  content: string
  role: ChatRole
  model?: Model
}

export interface Model {
  id?: string
  role: ChatRole
  avatar?: string
  name?: string
  prompt?: string
  aiType: string
  rootAiType: string
  description?: string
  promptPrice?: number
  completionPrice?: number
  key?: string
  isDefault?: boolean
}

export interface Chat {
  id: string
  model?: Model
  messages?: ChatMessage[]
}

export type ChatRole = 'assistant' | 'user' | 'system'
