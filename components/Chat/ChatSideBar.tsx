'use client'

import React, { useContext } from 'react'
import { Box, Flex, IconButton, ScrollArea, Text } from '@radix-ui/themes'
import cs from 'classnames'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { BiMessageDetail } from 'react-icons/bi'
import { FiPlus } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import ChatContext from './chatContext'

import './index.scss'
import { GearIcon } from '@radix-ui/react-icons'

export const ChatSideBar = () => {
  const {
    currentChatRef,
    chatList,
    DefaultModels,
    toggleSidebar,
    onDeleteChat,
    onChangeChat,
    onCreateChat,
    onOpenModelPanel
  } = useContext(ChatContext)

  return (
    <Flex direction="column" className={cs('chat-side-bar', { show: toggleSidebar })}>
      <Flex className="p-2 h-full overflow-hidden w-64" direction="column" gap="3">
        <Box
          width="auto"
          onClick={() => onCreateChat?.(DefaultModels[0])}
          className="bg-token-surface-primary active:scale-95 cursor-pointer"
        >
          <FiPlus className="size-4" />
          <Text>New Chat</Text>
        </Box>
        <ScrollArea className="flex-1 " style={{ width: '100%' }} type="auto">
          <Flex direction="column" gap="3">
            {chatList.map((chat) => (
              <Box
                key={chat.id}
                width="auto"
                className={cs('bg-token-surface active:scale-95 truncate cursor-pointer', {
                  active: currentChatRef?.current?.id === chat.id
                })}
                onClick={() => {
                  if (currentChatRef?.current?.id !== chat.id)
                    onChangeChat?.(chat)
                }}
              >
                <Flex gap="2" align="center" className="overflow-hidden whitespace-nowrap">
                  <BiMessageDetail className="size-4" />
                  <Text as="p" className="truncate">
                    {chat.model?.name}
                  </Text>
                </Flex>
                <IconButton
                  size="2"
                  className="cursor-pointer"
                  variant="ghost"
                  color="gray"
                  radius="full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat?.(chat)
                  }}
                >
                  <AiOutlineCloseCircle className="size-4" />
                </IconButton>
              </Box>
            ))}
          </Flex>
        </ScrollArea>
        <Box
          width="auto"
          onClick={() => onOpenModelPanel?.('chat')}
          className="bg-token-surface-primary active:scale-95 cursor-pointer"
        >
          <GearIcon className="size-4" />
          <Text>Settings</Text>
        </Box>
      </Flex>
    </Flex>
  )
}

export default ChatSideBar
