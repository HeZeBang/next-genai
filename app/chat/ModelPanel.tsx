'use client'

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  Heading,
  IconButton,
  ScrollArea,
  Text,
  TextField
} from '@radix-ui/themes'
import { debounce } from 'lodash-es'
import toast from 'react-hot-toast'
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
    onCloseModelPanel,
    fetchModels
  } = useContext(ChatContext)

  const [promptList, setPromptList] = useState<Model[]>([])
  const [searchText, setSearchText] = useState('')
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState<TokenState>(0)
  const [quota, setQuota] = useState(4.0)
  const [surplus, setSurplus] = useState(0)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const hiddenFormRef = useRef<HTMLFormElement>(null)
  const hiddenUsernameRef = useRef<HTMLInputElement>(null)
  const hiddenPasswordRef = useRef<HTMLInputElement>(null)

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
          fetchModels?.()
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
          if (data.success === false) throw new Error(data.error || 'Token is invalid or expired')
          setQuota(data.quota)
          setSurplus(data.used)
          localStorage.setItem('username', data.username)
          localStorage.setItem('userid', data.userid)
          setIsValidating(TokenState.Valid)
        })
        .catch((err) => {
          console.warn(err)
          toast.error(`${err}`)
          setIsValidating(TokenState.Invalid)
        })
    } catch (err) {
      console.error(err)
    }
  }

  const handleAutoLogin = async () => {
    if (!loginUsername || !loginPassword) return
    setLoginLoading(true)
    setLoginError('')
    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      })
      const data = await resp.json()
      if (!data.success) {
        setLoginError(data.error || 'Login failed')
        return
      }
      localStorage.setItem('apiKey', data.token)
      // Prompt browser to save credentials:
      // Chrome/Edge: Credential Management API
      if ('PasswordCredential' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cred = new (window as any).PasswordCredential({ id: loginUsername, password: loginPassword })
          await navigator.credentials.store(cred)
        } catch { /* non-fatal */ }
      }
      // Firefox: submit a hidden form targeting an iframe so the browser detects a password form submission
      if (hiddenUsernameRef.current && hiddenPasswordRef.current && hiddenFormRef.current) {
        hiddenUsernameRef.current.value = loginUsername
        hiddenPasswordRef.current.value = loginPassword
        hiddenFormRef.current.submit()
      }
      await refreshToken()
      setLoginDialogOpen(false)
      setLoginUsername('')
      setLoginPassword('')
      setLoginError('')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Network error, please try again')
    } finally {
      setLoginLoading(false)
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
      <ScrollArea className="flex-1" type="auto" scrollbars="vertical">
        <Flex
          justify="between"
          align="center"
          py="3"
          px="4"
          style={{ backgroundColor: 'var(--color-background)' }}
          className="sticky top-0 shadow-md"
        >
          <Heading size="4" className="font-mono font-normal">
            Settings
          </Heading>
          <IconButton
            size="2"
            variant="ghost"
            color="gray"
            radius="full"
            onClick={onCloseModelPanel}
          >
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
          <Dialog.Root open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
            <Dialog.Trigger>
              <Button className="my-2">Login via ShanghaiTech Account</Button>
            </Dialog.Trigger>

            <Dialog.Content maxWidth="400px">
              <Dialog.Title>Login via ShanghaiTech Account</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Use ShanghaiTech unified identity authentication to automatically obtain the API Key.
              </Dialog.Description>

              <form
                onSubmit={(e) => { e.preventDefault(); handleAutoLogin() }}
                autoComplete="on"
              >
                <Flex direction="column" gap="3">
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Student ID
                    </Text>
                    <TextField.Root
                      name="username"
                      autoComplete="username"
                      placeholder="Student ID"
                      value={loginUsername}
                      disabled={loginLoading}
                      onChange={({ target }) => setLoginUsername(target.value)}
                    />
                  </label>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Password
                    </Text>
                    <TextField.Root
                      name="password"
                      autoComplete="current-password"
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      disabled={loginLoading}
                      onChange={({ target }) => setLoginPassword(target.value)}
                    />
                  </label>
                  {loginError && (
                    <Text size="2" color="red">
                      {loginError}
                    </Text>
                  )}
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button
                      type="button"
                      variant="soft"
                      color="gray"
                      disabled={loginLoading}
                      onClick={() => {
                        setLoginUsername('')
                        setLoginPassword('')
                        setLoginError('')
                      }}
                    >
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    disabled={loginLoading || !loginUsername || !loginPassword}
                  >
                    {loginLoading ? <ReloadIcon className="animate-spin" /> : 'Login'}
                  </Button>
                </Flex>
              </form>
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
                    <b>Prompt:</b> {prompt.prompt || ''}
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
      <HiddenCredentialForm
        formRef={hiddenFormRef}
        usernameRef={hiddenUsernameRef}
        passwordRef={hiddenPasswordRef}
      />
    </Flex>
  ) : null
}

// Hidden form targeting a hidden iframe — lets Firefox detect a password form
// submission and offer to save credentials (Firefox ignores the Credential
// Management API but does watch for native form submits with password fields).
function HiddenCredentialForm({
  formRef,
  usernameRef,
  passwordRef,
}: {
  formRef: React.RefObject<HTMLFormElement>
  usernameRef: React.RefObject<HTMLInputElement>
  passwordRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <>
      <iframe name="_pw_save_frame" style={{ display: 'none' }} title="" />
      <form
        ref={formRef}
        method="post"
        action=""
        target="_pw_save_frame"
        style={{ display: 'none' }}
        autoComplete="on"
      >
        <input ref={usernameRef} type="text" name="username" autoComplete="username" readOnly />
        <input ref={passwordRef} type="password" name="password" autoComplete="current-password" readOnly />
      </form>
    </>
  )
}

export default ModelPanel
