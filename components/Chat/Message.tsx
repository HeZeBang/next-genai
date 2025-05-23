'use client'

import { useCallback, useState } from 'react'
import { Avatar, Badge, Flex, IconButton, Spinner, Tooltip } from '@radix-ui/themes'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaRegCopy } from 'react-icons/fa'
import { HiUser } from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'
import { Markdown } from '@/components'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { ChatMessage, Model } from './interface'

export interface MessageProps {
  message: ChatMessage
  isLoading?: boolean
  currentModel?: Model
}

const Message = (props: MessageProps) => {
  const { role, content } = props.message
  const isUser = role === 'user'
  const copy = useCopyToClipboard()
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)

  const onCopy = useCallback(() => {
    copy(content, (isSuccess) => {
      if (isSuccess) {
        setTooltipOpen(true)
      }
    })
  }, [content, copy])

  return (
    <Flex gap="4" className="mb-5">
      <Avatar
        fallback={isUser ? <HiUser className="size-4" /> : <RiRobot2Line className="size-4" />}
        color={isUser ? undefined : 'green'}
        size="2"
        radius="full"
      />
      <div className="flex-1 pt-1 break-all">
        <Badge color={isUser ? 'purple' : 'green'} style={{ marginBottom: '1em' }}>
          {isUser ? 'You' : (props.message.model?.name || props.currentModel?.name || 'AI')}
        </Badge>
        {isUser ? (
          <div
            className="userMessage"
            dangerouslySetInnerHTML={{
              __html: content.replace(
                /<(?!\/?br\/?.+?>|\/?img|\/?table|\/?thead|\/?tbody|\/?tr|\/?td|\/?th.+?>)[^<>]*>/gi,
                ''
              )
            }}
          ></div>
        ) : (
          <Flex direction="column" gap="4">
            <Markdown>{content}</Markdown>
            {props.isLoading && (
              <Flex
                width="6"
                height="6"
                align="center"
                justify="center"
                style={{ color: 'var(--accent-11)' }}
              >
                <AiOutlineLoading3Quarters className="animate-spin size-4" />
              </Flex>
            )}
            <Flex gap="4" align="center">
              <Tooltip open={tooltipOpen} content="Copied!">
                <IconButton
                  className="cursor-pointer"
                  variant="outline"
                  color="gray"
                  onClick={onCopy}
                  onMouseLeave={() => setTooltipOpen(false)}
                >
                  <FaRegCopy />
                </IconButton>
              </Tooltip>
            </Flex>
          </Flex>
        )}
      </div>
    </Flex>
  )
}

export default Message
