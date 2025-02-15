export interface ChatMessage {
  content: string
  role: ChatRole
}

export interface Model {
  id?: string
  role: ChatRole
  avatar?: string
  name?: string
  prompt?: string
  key?: string
  isDefault?: boolean
}

export interface Chat {
  id: string
  model?: Model
  messages?: ChatMessage[]
}

export type ChatRole = 'assistant' | 'user' | 'system'
