'use client'

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { HamburgerMenuIcon, LockClosedIcon, LockOpen1Icon, PlusIcon } from '@radix-ui/react-icons'
import {
  Container,
  Flex,
  Heading,
  IconButton,
  ScrollArea,
  Tooltip,
  Text,
  Blockquote,
  Button,
  Select
} from '@radix-ui/themes'
import ContentEditable from 'react-contenteditable'
import toast from 'react-hot-toast'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FiSend, FiStopCircle } from 'react-icons/fi'
import ChatContext from './chatContext'
import { ChatContextType } from './chatContext'
import type { Chat, ChatMessage, Model, ChatRole } from './interface'
import Message from './Message'
import './index.scss'

const HTML_REGULAR =
  /<(?!img|table|\/table|thead|\/thead|tbody|\/tbody|tr|\/tr|td|\/td|th|\/th|br|\/br).*?>/gi

export interface ChatProps {
  isGenerating: boolean
  setIsGenerating: (state: boolean) => void
}

export interface ChatGPInstance {
  setConversation: (messages: ChatMessage[]) => void
  getConversation: () => ChatMessage[]
  focus: () => void
}

const postChatOrQuestion = async (
  chat: Chat,
  messages: any[],
  input: string,
  groupId: string,
  controller: AbortController,
  model?: Model,
) => {
  const url = '/api/chat'

  const data = {
    prompt: model?.prompt || chat?.model?.prompt,
    messages: [...messages!],
    model: model?.aiType || chat?.model?.aiType,
    input,
    apiKey: localStorage.getItem('apiKey'),
    groupId,
    rootAiType: model?.rootAiType || chat?.model?.rootAiType
  }

  console.log(data.model)

  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 min timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

const Chat = (props: ChatProps, ref: any) => {
  const {
    debug,
    currentChatRef,
    saveMessages,
    onToggleSidebar,
    onOpenModelPanel,
    onCreateChat,
    forceUpdate,
    toggleSidebar,
    models,
    DefaultModels,
    getMessages,
    setMessages,
    // generatingChatId,
    setGeneratingChatId,
  } = useContext(ChatContext) as ChatContextType

  const [isLoading, setIsLoading] = [props.isGenerating, props.setIsGenerating]

  const conversationRef = useRef<ChatMessage[]>()

  const [message, setMessage] = useState('')

  const [currentMessage, setCurrentMessage] = useState<string>('')

  const [currentMessageId, setCurrentMessageId] = useState<string | undefined>('')

  const [scrollToBottom, setScrollToBottom] = useState(true)

  const textAreaRef = useRef<HTMLElement>(null)

  const conversation = useRef<ChatMessage[]>([])

  const bottomOfChatRef = useRef<HTMLDivElement>(null)

  const controllerRef = useRef<AbortController>()

  const stopGeneration = useCallback(
    async (_: any) => {
      controllerRef.current?.abort()
    },
    [currentMessage, controllerRef]
  )

  const sendMessage = useCallback(
    async (e: any) => {
      if (!isLoading) {
        setIsLoading(true)
        setMessage((value) => value.replace(HTML_REGULAR, ''))
        const lockedChatId = currentChatRef?.current?.id
        const lockedModel = currentChatRef?.current?.model
        setCurrentMessageId(lockedChatId)
        e.preventDefault()
        const input = textAreaRef.current?.innerHTML?.replace(HTML_REGULAR, '') || ''

        if (input.length < 1) {
          toast.error('Please type a message to continue.')
          return
        }

        if (!lockedChatId) return
        const message = [...getMessages?.(lockedChatId) || []]
        const newMessages = [...message, { content: input, role: 'user' as ChatRole, model: lockedModel }]
        setMessages?.(lockedChatId, newMessages)
        conversation.current = newMessages
        setMessage('')
        setGeneratingChatId?.(lockedChatId)
        try {
          const controller = new AbortController()
          controllerRef.current = controller
          const response = await postChatOrQuestion(
            { ...(currentChatRef?.current || {}), id: lockedChatId, model: lockedModel },
            message,
            input,
            lockedChatId,
            controller
          )

          if (response.ok) {
            const data = response.body

            if (!data) {
              throw new Error('No data')
            }

            const reader = data.getReader()
            const decoder = new TextDecoder('utf-8')
            let done = false
            let resultContent = ''

            while (!done) {
              try {
                const { value, done: readerDone } = await reader.read()
                const char = decoder.decode(value)
                if (char) {
                  setCurrentMessage((state) => {
                    if (debug) {
                      console.log({ char })
                    }
                    resultContent = state + char
                    return resultContent
                  })
                }
                done = readerDone
              } catch {
                done = true
              }
            }
            // The delay of timeout can not be 0 as it will cause the message to not be rendered in racing condition
            setTimeout(() => {
              if (debug) {
                console.log({ resultContent })
              }
              if (!lockedChatId) return
              const prevMessages = getMessages?.(lockedChatId) || []
              const updatedMessages = [
                ...prevMessages,
                { content: resultContent, role: 'assistant' as ChatRole, model: lockedModel }
              ]
              setMessages?.(lockedChatId, updatedMessages)
              conversation.current = updatedMessages
              setCurrentMessage('')
              setGeneratingChatId?.(null)
            }, 1)
          } else {
            const result = await response.json()
            if (response.status === 401) {
              if (lockedChatId) {
                const prevMessages = getMessages?.(lockedChatId) || []
                setMessages?.(lockedChatId, prevMessages.slice(0, -1))
                conversation.current = prevMessages.slice(0, -1)
              }
              location.href =
                result.redirect +
                `?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`
            } else {
              toast.error(result.error)
            }
          }

          setIsLoading(false)
          setGeneratingChatId?.(null)
        } catch (error: any) {
          console.error(error)
          toast.error(error.message)
          setIsLoading(false)
          setGeneratingChatId?.(null)
        }
      }
    },
    [currentChatRef, debug, isLoading, getMessages, setMessages, setGeneratingChatId]
  )

  const handleKeypress = useCallback(
    (e: any) => {
      // if (e.keyCode == 13 && !e.shiftKey) {
      //   sendMessage(e)
      //   e.preventDefault()
      // }
      // Ctrl + Enter to send
      if (e.keyCode == 13 && e.ctrlKey) {
        sendMessage(e)
        e.preventDefault()
      }
    },
    [sendMessage]
  )

  // const clearMessages = () => {
  //   const chatId = currentChatRef?.current?.id
  //   if (chatId) {
  //     setMessages?.(chatId, [])
  //     conversation.current = []
  //     forceUpdate?.()
  //   }
  // }

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.minHeight = '50px'
      textAreaRef.current.style.minHeight = `${textAreaRef.current.scrollHeight + 2}px`
    }
  }, [message, textAreaRef])

  useEffect(() => {
    if (bottomOfChatRef.current && scrollToBottom) {
      bottomOfChatRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation, currentMessage, isLoading])

  useEffect(() => {
    document.getElementById('bottomOfChat')?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  useEffect(() => {
    const chatId = currentChatRef?.current?.id
    if (chatId) {
      const msgs = getMessages?.(chatId) || []
      conversation.current = msgs
      conversationRef.current = msgs
    }
  }, [currentChatRef, getMessages])

  useEffect(() => {
    if (!isLoading) {
      textAreaRef.current?.focus()
    }
  }, [isLoading])

  useImperativeHandle(ref, () => {
    return {
      setConversation(messages: ChatMessage[]) {
        const chatId = currentChatRef?.current?.id
        if (chatId) {
          setMessages?.(chatId, messages)
          conversation.current = messages
          forceUpdate?.()
        }
      },
      getConversation() {
        return conversationRef.current
      },
      focus: () => {
        textAreaRef.current?.focus()
      }
    }
  })

  return (
    <Flex
      onClick={() => {
        if (toggleSidebar) onToggleSidebar?.()
      }}
      direction="column"
      height="100%"
      width="100%"
      className={toggleSidebar ? 'blur-sm transition-all' : 'transition-all'}
    >
      {currentChatRef?.current ? (
        <Flex direction="column" height="100%" className="relative" gap="3">
          <Flex
            justify="between"
            align="center"
            py="3"
            px="4"
            // style={{ backgroundColor: 'var(--gray-a2)' }}
            className="shadow-sm"
          >
            <Heading size="4" weight="regular" className="font-mono flex-1">
              {currentChatRef?.current?.model?.name || 'None'}
            </Heading>
            <Tooltip content={'New Chat'}>
              <Button
                variant="soft"
                className="rounded-xl mx-1"
                onClick={() => {
                  if (currentChatRef?.current?.model) onCreateChat?.(currentChatRef?.current?.model)
                }}
              >
                <PlusIcon />
              </Button>
            </Tooltip>
            <Tooltip content={'New Chat'}>
              <Button
                variant="soft"
                className="rounded-xl mx-1 md:hidden"
                onClick={onToggleSidebar}
              >
                <HamburgerMenuIcon />
              </Button>
            </Tooltip>
          </Flex>
          <ScrollArea
            className="flex-1 px-4"
            type="auto"
            scrollbars="vertical"
            style={{ height: '100%' }}
          >
            {(getMessages?.(currentChatRef?.current?.id || '') || []).map((item: ChatMessage, index: number) => (
              <Container size="3" key={index}>
                <Message message={item} currentModel={currentChatRef?.current?.model} />
              </Container>
            ))}
            {currentMessage && currentMessageId == currentChatRef?.current?.id && (
              <Container size="3">
                <Message message={{ content: currentMessage, role: 'assistant' }} isLoading currentModel={currentChatRef?.current?.model} />
                {/* TODO: Add custom model */}
              </Container>
            )}
            <div id="bottomOfChat" ref={bottomOfChatRef}></div>
          </ScrollArea>
          <div className="px-4 pb-3">
            <Container size="3">
              <Flex align="end" justify="between" gap="3" direction="column"
                className={`relative border-2 dark:border-neutral-800 rounded-3xl dark:focus-within:border-purple-400 focus-within:border-purple-300 focus-within:shadow-lg transition-all ${isLoading ? "animate-border-beam" : ""}`}
                style={{ overflow: "clip" }}>
                {/* <BorderBeam
                  duration={4}
                  size={100}
                  className='from-transparent via-purple-500 to-transparent'
                  style={{
                    opacity: isLoading ? 1 : 0
                  }}
                /> */}
                <div className="rt-TextAreaRoot rt-r-size-1 flex-1 shadow-none rounded-3xl chat-textarea w-full">
                  <ContentEditable
                    innerRef={textAreaRef}
                    style={{
                      minHeight: '24px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                    className="rt-TextAreaInput text-base"
                    aria-placeholder={`Ask anything... (${'Ctrl + Enter'} to send)`}
                    html={message}
                    disabled={isLoading}
                    onChange={(e) => {
                      if (e.target.value === '<br>') {
                        setMessage('')
                        if (textAreaRef.current)
                          textAreaRef.current.innerHTML = "";
                      }
                    }}
                    onKeyDown={(e) => {
                      handleKeypress(e)
                    }}
                  />
                  <div className="rt-TextAreaChrome"></div>
                </div>
                <Flex className="pb-2 px-2 w-full" justify="between" align="center">
                  <Flex gap="2" align="center">
                    <Select.Root
                      value={currentChatRef?.current?.model?.id}
                      onValueChange={(value) => {
                        const model = DefaultModels.find((m) => m.id === value)
                        if (model && currentChatRef?.current) {
                          setMessage(textAreaRef.current?.getHTML() || '')
                          currentChatRef.current = {
                            ...currentChatRef.current,
                            model
                          }
                          forceUpdate?.()
                        }
                      }}
                    >
                      <Select.Trigger variant="soft" color="gray" className="rounded-xl" />
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>Default</Select.Label>
                          {DefaultModels.map((model) => (
                            <Select.Item key={model.id} value={model.id || ''}>
                              {model.name}
                            </Select.Item>
                          ))}
                        </Select.Group>
                        <Select.Group>
                          <Select.Label>Custom</Select.Label>
                          {models.map((model) => (
                            <Select.Item key={model.id} value={model.id || ''}>
                              {model.name}
                            </Select.Item>
                          ))}
                        </Select.Group>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                  <Flex gap="3">
                    {isLoading && (
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
                    <Tooltip content={'Auto Scrolling'}>
                      <IconButton
                        variant="soft"
                        color="gray"
                        size="2"
                        className="rounded-xl cursor-pointer"
                        onClick={() => setScrollToBottom((state) => !state)}
                      >
                        {scrollToBottom ? (
                          <LockClosedIcon className="size-4" />
                        ) : (
                          <LockOpen1Icon className="size-4" />
                        )}
                      </IconButton>
                    </Tooltip>
                    {currentMessage ? (
                      <Tooltip content={'Stop Generation'}>
                        <IconButton
                          variant="soft"
                          // disabled={isLoading}
                          color="gray"
                          size="2"
                          className="rounded-xl cursor-pointer"
                          onClick={stopGeneration}
                        >
                          <FiStopCircle className="size-4" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip content={'Send Message'}>
                        <IconButton
                          variant="soft"
                          color="gray"
                          size="2"
                          className="rounded-xl cursor-pointer"
                          onClick={sendMessage}
                        >
                          <FiSend className="size-4" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Flex>
                  {/* TODO: Clear Context withoud history */}
                  {/* <Tooltip content={'Clear History'}>
              <IconButton
                variant="soft"
                color="gray"
                size="2"
                className="rounded-xl cursor-pointer"
                disabled={isLoading}
                onClick={clearMessages}
              >
                <AiOutlineClear className="size-4" />
              </IconButton>
            </Tooltip> */}
                </Flex>
              </Flex>
            </Container>
          </div>
        </Flex>
      ) : (
        <Flex direction="column" height="100%" justify="center" align="center">
          <Heading
            className="text-center font-mono lg:text-7xl text-4xl py-2 tracking-tight from-[#FF1CF7] to-[#b249f8] bg-clip-text text-transparent bg-gradient-to-b inline"
            weight="bold"
          >
            Next.GenAI
          </Heading>
          <Text size="4" className="text-gray-500 font-mono">
            Let&apos;s make GenAI prettier.
          </Text>

          <Blockquote className="my-5 py-2 text-gray-500" weight="light">
            First use? Please configure your API key in the settings below.
          </Blockquote>

          <Flex gap="3">
            <Button
              onClick={onToggleSidebar}
              className="md:hidden p-5"
              variant="soft"
              radius="full"
            >
              Start Chat
            </Button>
            <Button
              onClick={() => onOpenModelPanel?.('chat')}
              className="md:hidden p-5"
              variant="outline"
              radius="full"
            >
              Settings
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

export default forwardRef<ChatGPInstance, ChatProps>(Chat)
