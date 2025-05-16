'use client'

import { createContext, MutableRefObject } from 'react'
import { Chat, ChatMessage, Model } from './interface'

export type ChatContextType = {
  debug?: boolean
  modelPanelType: string
  DefaultModels: Model[]
  currentChatRef?: MutableRefObject<Chat | undefined>
  chatList: Chat[]
  models: Model[]
  isOpenModelModal?: boolean
  editModel?: Model
  modelModalLoading?: boolean
  openModelPanel?: boolean
  toggleSidebar?: boolean
  onOpenModelModal?: () => void
  onCloseModelModal?: () => void
  setCurrentChat?: (chat: Chat) => void
  onCreateModel?: (model: Model) => void
  onDeleteChat?: (chat: Chat) => void
  onDeleteModel?: (model: Model) => void
  onEditModel?: (model: Model) => void
  onCreateChat?: (model: Model) => void
  onChangeChat?: (chat: Chat) => void
  saveMessages?: (messages: ChatMessage[], destination?: string) => void
  getMessages?: (chatId: string) => ChatMessage[]
  setMessages?: (chatId: string, messages: ChatMessage[]) => void
  onOpenModelPanel?: (type?: string) => void
  onCloseModelPanel?: () => void
  onToggleSidebar?: () => void
  forceUpdate?: () => void
}

const ChatContext = createContext<ChatContextType>({
  modelPanelType: 'chat',
  DefaultModels: [],
  chatList: [],
  models: []
})

export default ChatContext
