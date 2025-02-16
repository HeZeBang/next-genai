'use client'

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { CopyIcon, MagnifyingGlassIcon, ReloadIcon } from '@radix-ui/react-icons'
import {
  Badge,
  Box,
  Button,
  Code,
  Container,
  DataList,
  Dialog,
  Flex,
  Link,
  Heading,
  IconButton,
  ScrollArea,
  Text,
  TextField
} from '@radix-ui/themes'
import { debounce } from 'lodash-es'
import { AiOutlineClose, AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai'
import { LuMessageSquarePlus } from 'react-icons/lu'
import { ChatContext, Model } from '@/components'

export interface ModelPanelProps { }
enum TokenState {
  Invalid = -1,
  Validating = 0,
  Valid = 1
}

const ModelPanel = (_props: ModelPanelProps) => {
  const {
    modelPanelType,
    DefaultModels,
    models,
    openModelPanel,
    onDeleteModel,
    onEditModel,
    onCreateChat,
    // onOpenModelModal,
    onCloseModelPanel
  } = useContext(ChatContext)

  const [promptList, setPromptList] = useState<Model[]>([])
  const [searchText, setSearchText] = useState('')
  const [tokenText, setTokenText] = useState('')
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState<TokenState>(0)
  const [quota, setQuota] = useState(4.0)
  const [surplus, setSurplus] = useState(0)

  const handleSearch = useCallback(
    debounce((type: string, list: Model[], searchText: string) => {
      setPromptList(
        list.filter((item) => {
          if (type === 'chat') {
            return (
              !item.key && (item.prompt?.includes(searchText) || item.name?.includes(searchText))
            )
          } else {
            return (
              item.key && (item.prompt?.includes(searchText) || item.name?.includes(searchText))
            )
          }
        })
      )
    }, 350),
    []
  )

  const refreshToken = async () => {
    const data = {
      apiKey: localStorage.getItem('apiKey')
    }
    try {
      await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then((resp) => resp.json())
        .then((data) => {
          localStorage.setItem('apiKey', data.token)
          setToken(data.token)
          localStorage.setItem('username', data.username)
          localStorage.setItem('userid', data.userid)
        })
        .catch((err) => console.error(err))
    } catch (err) {
      console.error(err)
    }
  }

  const validateToken = async () => {
    const data = {
      apiKey: localStorage.getItem('apiKey'),
      userid: localStorage.getItem('userid')
    }
    setIsValidating(TokenState.Validating)
    try {
      await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then((resp) => resp.json())
        .then((data) => {
          if (data.success === false) throw new Error('Not Valid')
          setQuota(data.quota)
          setSurplus(data.used)
          localStorage.setItem('username', data.username)
          localStorage.setItem('userid', data.userid)
          setIsValidating(TokenState.Valid)
        })
        .catch((err) => {
          console.error(err)
          setIsValidating(TokenState.Invalid)
        })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    validateToken()
  }, [token])

  useEffect(() => {
    handleSearch(modelPanelType, [...DefaultModels, ...models], searchText)
  }, [modelPanelType, searchText, DefaultModels, models, handleSearch])

  return openModelPanel ? (
    <Flex
      direction="column"
      width="100%"
      height="100%"
      className="absolute top-0 z-10 flex-1"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Flex
        justify="between"
        align="center"
        py="3"
        px="4"
        style={{ backgroundColor: 'var(--gray-a2)' }}
      >
        <Heading size="4">Settings</Heading>
        <IconButton size="2" variant="ghost" color="gray" radius="full" onClick={onCloseModelPanel}>
          <AiOutlineClose className="size-4" />
        </IconButton>
      </Flex>
      <Container size="3" className="grow-0 px-4">
        <Heading className="my-3" size="5">
          API Key
        </Heading>
        <Text as="p" size="2" className="mb-3">
          Next.GenAI needs your API key to access ShanghaiTech GenAI API.
        </Text>
        <DataList.Root>
          <DataList.Item align="center">
            <DataList.Label minWidth="88px">Status</DataList.Label>
            <DataList.Value>
              <Flex align="center" gap="2">
                {isValidating === TokenState.Validating && (
                  <Badge color="yellow" variant="soft" size="2">
                    Validating
                  </Badge>
                )}
                {isValidating === TokenState.Valid && (
                  <Badge color="green" variant="soft" size="2">
                    Valid
                  </Badge>
                )}
                {isValidating === TokenState.Invalid && (
                  <Badge color="red" variant="soft" size="2">
                    Invalid
                  </Badge>
                )}
                <IconButton
                  size="1"
                  aria-label="Refresh"
                  color="gray"
                  variant="ghost"
                  onClick={validateToken}
                >
                  <ReloadIcon />
                </IconButton>
              </Flex>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="88px">API Key</DataList.Label>
            <DataList.Value>
              <Flex align="center" gap="2">
                <Code variant="ghost">{localStorage.getItem('apiKey') || 'No API Key'}</Code>
                <IconButton
                  size="1"
                  aria-label="Copy value"
                  color="gray"
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(localStorage.getItem('apiKey') || '')
                  }}
                >
                  <CopyIcon />
                </IconButton>
              </Flex>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="88px">Name</DataList.Label>
            <DataList.Value>{localStorage.getItem('username') || 'Unknown'}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="88px">ID</DataList.Label>
            <DataList.Value>{localStorage.getItem('userid') || 'Unknown'}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="88px">Month Quota</DataList.Label>
            <DataList.Value>
              {surplus} / {quota}
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>
        <Dialog.Root>
          <Dialog.Trigger>
            <Button className="my-2">Retrieve API Key</Button>
          </Dialog.Trigger>

          <Dialog.Content maxWidth="450px">
            <Dialog.Title>Retrieve API Key</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              To retrieve your API Key, please follow the steps below.
              <br />
              <br />
              1. Go to{' '}
              <Link
                href="https://genai.shanghaitech.edu.cn/htk/user/login"
                target="_blank"
                referrerPolicy="no-referrer"
                underline="always"
              >
                GenAI Login Page
              </Link>
              <br />
              2. Login by your ShanghaiTech Account. If you are already logged in, skip this step.
              <br />
              3. Copy the link of the page you are redirected to after login. <br />
              It should be like{' '}
              <code>https://genai.shanghaitech.edu.cn/dashboard/analysis?token=...</code>
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  URL
                </Text>
                <TextField.Root
                  defaultValue=""
                  placeholder="https://genai.shanghaitech.edu.cn/dashboard/analysis?token=..."
                  onChange={({ target }) => {
                    setTokenText(target.value)
                  }}
                />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button
                  disabled={
                    !tokenText.startsWith(
                      'https://genai.shanghaitech.edu.cn/dashboard/analysis?token='
                    )
                  }
                  onClick={() => {
                    const tok = tokenText.replace(
                      'https://genai.shanghaitech.edu.cn/dashboard/analysis?token=',
                      ''
                    )
                    // setToken(tok)
                    localStorage.setItem('apiKey', tok)
                    refreshToken()
                  }}
                >
                  Save
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

        <Heading className="mt-3" size="5">
          Models
        </Heading>
        <Flex gap="4" py="3">
          <TextField.Root
            size="3"
            className="flex-1"
            radius="large"
            placeholder="Search Model Template"
            onChange={({ target }) => {
              setSearchText(target.value)
            }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
          {/* TODO: Create Bot */}
          {/* <Button size="3" radius="large" variant="surface" onClick={onOpenModelModal}>
            Create
          </Button> */}
        </Flex>
      </Container>
      <ScrollArea className="flex-1" type="auto" scrollbars="vertical">
        <Container size="3" className="px-4">
          <Flex direction="column" className="divide-y">
            {promptList.map((prompt) => (
              <Flex
                key={prompt.id}
                align="center"
                justify="between"
                gap="3"
                py="3"
                style={{ borderColor: 'var(--gray-a5)' }}
              >
                <Box width="100%">
                  <Text as="p" size="3" weight="bold" className="mb-2">
                    {prompt.name}
                  </Text>
                  <Text as="p" size="2" className="line-clamp-2">
                    Prompt: {prompt.prompt || ''}
                  </Text>
                </Box>
                <Flex gap="3">
                  <IconButton
                    size="2"
                    variant="soft"
                    radius="full"
                    onClick={() => {
                      onCreateChat?.(prompt)
                    }}
                  >
                    <LuMessageSquarePlus className="size-4" />
                  </IconButton>
                  <IconButton
                    size="2"
                    variant="soft"
                    color="gray"
                    radius="full"
                    onClick={() => {
                      onEditModel?.(prompt)
                    }}
                  >
                    <AiOutlineEdit className="size-4" />
                  </IconButton>
                  <IconButton
                    size="2"
                    variant="soft"
                    color="crimson"
                    radius="full"
                    onClick={() => {
                      onDeleteModel?.(prompt)
                    }}
                  >
                    <AiOutlineDelete className="size-4" />
                  </IconButton>
                </Flex>
              </Flex>
            ))}
          </Flex>
          <Heading className="my-3" size="5">
            Cache
          </Heading>
          <Button
            color="red"
            onClick={() => {
              localStorage.clear()
              location.reload()
            }}
          >
            Remove All Messages
          </Button>
        </Container>
      </ScrollArea>
    </Flex>
  ) : null
}

export default ModelPanel
