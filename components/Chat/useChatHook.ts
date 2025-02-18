'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { v4 as uuid } from 'uuid'
import { ChatGPInstance } from './Chat'
import { Chat, ChatMessage, Model } from './interface'

export const DefaultModels: Model[] = [
  {
    id: 'deepseek-v3:671b',
    role: 'system',
    name: 'DeepSeek V3 - 671B',
    prompt: 'You are an AI assistant that helps people find information.',
    rootAiType: 'xinference',
    promptPrice: 0,
    completionPrice: 0,
    isDefault: true
  },
  {
    id: 'deepseek-r1:671b',
    role: 'system',
    name: 'DeepSeek R1 - 671B',
    prompt: 'You are an AI assistant that helps people find information.',
    rootAiType: 'xinference',
    promptPrice: 0,
    completionPrice: 0,
    isDefault: false
  }
]

enum StorageKeys {
  Chat_List = 'chatList',
  Chat_Current_ID = 'chatCurrentID'
}

const uploadFiles = async (files: File[]) => {
  let formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })
  const { data } = await axios<any>({
    method: 'POST',
    url: '/api/document/upload',
    data: formData,
    timeout: 1000 * 60 * 5
  })
  return data
}

let isInit = false

const useChatHook = () => {
  const searchParams = useSearchParams()

  const debug = searchParams.get('debug') === 'true'

  const [_, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const messagesMap = useRef<Map<string, ChatMessage[]>>(new Map<string, ChatMessage[]>())

  const chatRef = useRef<ChatGPInstance>(null)

  const currentChatRef = useRef<Chat | undefined>(undefined)

  const [chatList, setChatList] = useState<Chat[]>([])

  const [models, setModels] = useState<Model[]>([])

  const [editModel, setEditModel] = useState<Model | undefined>()

  const [isOpenModelModal, setIsOpenModelModal] = useState<boolean>(false)

  const [modelModalLoading, setModelModalLoading] = useState<boolean>(false)

  const [openModelPanel, setOpenModelPanel] = useState<boolean>(false)

  const [modelPanelType, setModelPanelType] = useState<string>('')

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false)

  const onOpenModelPanel = (type: string = 'chat') => {
    setModelPanelType(type)
    setOpenModelPanel(true)
  }

  const onCloseModelPanel = useCallback(() => {
    setOpenModelPanel(false)
  }, [setOpenModelPanel])

  const onOpenModelModal = () => {
    setIsOpenModelModal(true)
  }

  const onCloseModelModal = () => {
    setEditModel(undefined)
    setIsOpenModelModal(false)
  }

  const onChangeChat = useCallback((chat: Chat) => {
    const oldMessages = chatRef.current?.getConversation() || []
    const newMessages = messagesMap.current.get(chat.id) || []
    chatRef.current?.setConversation(newMessages)
    chatRef.current?.focus()
    messagesMap.current.set(currentChatRef.current?.id!, oldMessages)
    currentChatRef.current = chat
    forceUpdate()
  }, [])

  const onCreateChat = useCallback(
    (model: Model) => {
      const id = uuid()
      const newChat: Chat = {
        id,
        model: model
      }

      setChatList((state) => {
        return [...state, newChat]
      })

      onChangeChat(newChat)
      onCloseModelPanel()
    },
    [setChatList, onChangeChat, onCloseModelPanel]
  )

  const onToggleSidebar = useCallback(() => {
    setToggleSidebar((state) => !state)
  }, [])

  const onDeleteChat = (chat: Chat) => {
    const index = chatList.findIndex((item) => item.id === chat.id)
    chatList.splice(index, 1)
    setChatList([...chatList])
    localStorage.removeItem(`ms_${chat.id}`)
    if (currentChatRef.current?.id === chat.id) {
      currentChatRef.current = chatList[0]
      if (chatList.length !== 0) onChangeChat(chatList[0])
    }
    if (chatList.length === 0) {
      onOpenModelPanel('chat')
    }
  }

  const onCreateModel = async (values: any) => {
    const { type, name, prompt, files } = values
    const model: Model = {
      id: uuid(),
      role: 'system',
      name,
      prompt,
      key: ''
    }

    if (type === 'document') {
      try {
        setModelModalLoading(true)
        const data = await uploadFiles(files)
        model.key = data.key
      } catch (e) {
        console.log(e)
        toast.error('Error uploading files')
      } finally {
        setModelModalLoading(false)
      }
    }

    setModels((state) => {
      const index = state.findIndex((item) => item.id === editModel?.id)
      if (index === -1) {
        state.push(model)
      } else {
        state.splice(index, 1, model)
      }
      return [...state]
    })

    onCloseModelModal()
  }

  const onEditModel = async (model: Model) => {
    setEditModel(model)
    onOpenModelModal()
  }

  const onDeleteModel = (model: Model) => {
    setModels((state) => {
      const index = state.findIndex((item) => item.id === model.id)
      state.splice(index, 1)
      return [...state]
    })
  }

  const saveMessages = (messages: ChatMessage[]) => {
    if (messages.length > 0) {
      localStorage.setItem(`ms_${currentChatRef.current?.id}`, JSON.stringify(messages))
    } else {
      localStorage.removeItem(`ms_${currentChatRef.current?.id}`)
    }
  }

  useEffect(() => {
    const chatList = (JSON.parse(localStorage.getItem(StorageKeys.Chat_List) || '[]') ||
      []) as Chat[]
    const currentChatId = localStorage.getItem(StorageKeys.Chat_Current_ID)
    if (chatList.length > 0) {
      const currentChat = chatList.find((chat) => chat.id === currentChatId)
      setChatList(chatList)

      chatList.forEach((chat) => {
        const messages = JSON.parse(localStorage.getItem(`ms_${chat?.id}`) || '[]') as ChatMessage[]
        messagesMap.current.set(chat.id!, messages)
      })

      onChangeChat(currentChat || chatList[0])
    } else {
      onCreateChat(DefaultModels[0])
    }

    return () => {
      document.body.removeAttribute('style')
      localStorage.setItem(StorageKeys.Chat_List, JSON.stringify(chatList))
    }
  }, [])

  useEffect(() => {
    if (currentChatRef.current?.id) {
      localStorage.setItem(StorageKeys.Chat_Current_ID, currentChatRef.current.id)
    }
  }, [currentChatRef.current?.id])

  useEffect(() => {
    localStorage.setItem(StorageKeys.Chat_List, JSON.stringify(chatList))
  }, [chatList])

  useEffect(() => {
    const loadedModels = JSON.parse(localStorage.getItem('Models') || '[]') as Model[]
    const updatedModels = loadedModels.map((model) => {
      if (!model.id) {
        model.id = uuid()
      }
      return model
    })
    setModels(updatedModels)
  }, [])

  useEffect(() => {
    localStorage.setItem('Models', JSON.stringify(models))
  }, [models])

  useEffect(() => {
    if (isInit && !openModelPanel && chatList.length === 0) {
      onCreateChat(DefaultModels[0])
    }
    isInit = true
  }, [chatList, openModelPanel, onCreateChat])

  return {
    debug,
    DefaultModels,
    chatRef,
    currentChatRef,
    chatList,
    models,
    editModel,
    isOpenModelModal,
    modelModalLoading,
    openModelPanel,
    modelPanelType,
    toggleSidebar,
    onOpenModelModal,
    onCloseModelModal,
    onCreateChat,
    onDeleteChat,
    onChangeChat,
    onCreateModel,
    onDeleteModel,
    onEditModel,
    saveMessages,
    onOpenModelPanel,
    onCloseModelPanel,
    onToggleSidebar,
    forceUpdate
  }
}

export default useChatHook
