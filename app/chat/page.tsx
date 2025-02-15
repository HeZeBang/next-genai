'use client'
import { Suspense } from 'react'
import { Flex } from '@radix-ui/themes'
import { Chat, ChatContext, ChatSideBar, useChatHook } from '@/components'
import ModelModal from './ModelModal'
import ModelPanel from './ModelPanel'

const ChatProvider = () => {
  const provider = useChatHook()

  return (
    <ChatContext.Provider value={provider}>
      <Flex style={{ height: 'calc(100% - 56px)' }} className="relative">
        <ChatSideBar />
        <div className="flex-1 relative">
          <Chat ref={provider.chatRef} />
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
