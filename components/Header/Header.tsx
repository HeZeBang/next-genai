'use client'

import { useCallback, useContext, useState } from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Avatar, Flex, Heading, IconButton, Select, Tooltip } from '@radix-ui/themes'
import cs from 'classnames'
import NextLink from 'next/link'
import { FaAdjust, FaGithub, FaMoon, FaSun } from 'react-icons/fa'
import { Link } from '../Link'
import { useTheme } from '../Themes'
// import ChatContext from '../Chat/chatContext'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  // const { onToggleSidebar } = useContext(ChatContext)
  // const [, setShow] = useState(false)

  // const toggleNavBar = useCallback(() => {
  //   setShow((state) => !state)
  // }, [])

  return (
    <header
      className={cs('block shadow-sm sticky top-0 dark:shadow-gray-500 py-3 px-4 z-20')}
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Flex align="center" gap="3">
        {/* <Tooltip content={'Toggle Sidebar'}>
          <IconButton
            variant="soft"
            color="gray"
            size="2"
            className="rounded-xl md:hidden cursor-pointer"
            onClick={() => {
              onToggleSidebar?.()
            }}
          >
            <HamburgerMenuIcon className="size-4" />
          </IconButton>
        </Tooltip> */}
        <NextLink href="/">
          <Heading as="h2" size="4" style={{ maxWidth: 200 }} className="font-mono">
            Next.GenAI
          </Heading>
        </NextLink>
        <Flex align="center" gap="3" className="ml-auto">
          <Avatar
            color="gray"
            size="2"
            radius="full"
            fallback={
              <Link href="https://github.com/HeZeBang/next-genai">
                <FaGithub />
              </Link>
            }
          />
          <Select.Root value={theme} onValueChange={setTheme}>
            <Select.Trigger radius="full" />
            <Select.Content>
              <Select.Item value="light">
                <FaSun />
              </Select.Item>
              <Select.Item value="dark">
                <FaMoon />
              </Select.Item>
              <Select.Item value="system">
                <FaAdjust />
              </Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
        {/* <Tooltip content="Navigation">
          <IconButton
            size="3"
            variant="ghost"
            color="gray"
            className="md:hidden"
            onClick={toggleNavBar}
          >
            <HamburgerMenuIcon width="16" height="16" />
          </IconButton>
        </Tooltip> */}
      </Flex>
    </header>
  )
}
