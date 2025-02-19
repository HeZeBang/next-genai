'use client'

import React, { useContext } from 'react'
import { ArrowLeftIcon, GearIcon } from '@radix-ui/react-icons'
import './index.scss'
import {
  Box,
  Button,
  Dialog,
  Flex,
  IconButton,
  Inset,
  ScrollArea,
  Table,
  Text
} from '@radix-ui/themes'
import cs from 'classnames'
import toast from 'react-hot-toast'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { FiPlus } from 'react-icons/fi'
import ChatContext from './chatContext'
import { ChatMessage } from './interface'

export interface ChatSideBarProps {
  isGenerating?: boolean
}
export const ChatSideBar = (props: ChatSideBarProps) => {
  const {
    currentChatRef,
    chatList,
    DefaultModels,
    toggleSidebar,
    onDeleteChat,
    onChangeChat,
    onCreateChat,
    onOpenModelPanel,
    onCloseModelPanel,
  } = useContext(ChatContext)

  return (
    <Flex direction="column" className={cs('chat-side-bar', { show: toggleSidebar })}>
      <Flex className="p-2 h-full overflow-hidden w-64" direction="column" gap="3">
        <Dialog.Root>
          <Dialog.Trigger>
            <Box
              width="auto"
              // onClick={() => onCreateChat?.(DefaultModels[0])}
              className="bg-token-surface-primary active:scale-95 cursor-pointer"
            >
              <FiPlus className="size-4" />
              <div>
                <Text size="1" color="gray">
                  {DefaultModels.length} Available Models
                </Text>
                <br />
                <Text>New Chat</Text>
              </div>
            </Box>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Create Chat</Dialog.Title>
            <Dialog.Description>Available models:</Dialog.Description>

            <Inset side="x" my="5">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Prompt Price
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="text-right">
                      Completion Price
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {DefaultModels.map((model) => (
                    <Table.Row key={model.id}>
                      <Table.RowHeaderCell className="align-middle font-bold">
                        {model.name}
                      </Table.RowHeaderCell>
                      <Table.Cell className="align-middle text-right">
                        {((model.promptPrice || 0) * 1000000).toFixed(1)} / M tokens
                      </Table.Cell>
                      <Table.Cell className="align-middle text-right">
                        {((model.completionPrice || 0) * 1000000).toFixed(1)} / M tokens
                      </Table.Cell>
                      <Table.Cell className="align-middle">
                        <Dialog.Close>
                          <Button variant="soft" size="2" onClick={() => onCreateChat?.(model)}>
                            Create
                          </Button>
                        </Dialog.Close>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Inset>

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Close
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

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
                  if (props.isGenerating) toast.error('Please wait for the current chat to finish generating.')
                  else
                    if (currentChatRef?.current?.id !== chat.id) onChangeChat?.(chat)
                  onCloseModelPanel?.()
                }}
              >
                <Flex gap="2" align="center" className="overflow-hidden whitespace-nowrap">
                  <div className="truncate">
                    <Text as="p" truncate size="1" color="gray">
                      {chat.model?.name}
                    </Text>
                    <Text as="p" truncate>
                      {(
                        JSON.parse(localStorage.getItem(`ms_${chat.id}`) || '[]') as ChatMessage[]
                      ).at(0)?.content || 'New Chat'}
                    </Text>
                  </div>
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
