'use client'
import { Suspense, useState } from 'react'
import { Flex } from '@radix-ui/themes'
import { Chat, ChatContext, ChatSideBar, useChatHook } from '@/components'
import ModelModal from './ModelModal'
import ModelPanel from './ModelPanel'

const ChatProvider = () => {
  const provider = useChatHook()
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ChatContext.Provider value={provider}>
      <Flex style={{ height: 'calc(100% - 56px)' }} className="relative">
        <ChatSideBar
          isGenerating={isGenerating}
        />
        <div className="flex-1 relative">
          <Chat ref={provider.chatRef}
            isGenerating={isGenerating}
            setIsGenerating={(state: boolean) => setIsGenerating(state)} />
          <ModelPanel />
        </div>
      </Flex>
      <ModelModal />
    </ChatContext.Provider>
  )
}

const ChatPage = () => {
  return (
    <Suspense>
      <ChatProvider />
    </Suspense>
  )
}

export default ChatPage
