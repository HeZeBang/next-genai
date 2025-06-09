'use client'

import { ClassAttributes, Fragment, HTMLAttributes, useCallback, useState, memo, useMemo } from 'react'
import { ChevronUpIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { Button, Callout, ChevronDownIcon, IconButton, Tooltip } from '@radix-ui/themes'
import cs from 'classnames'
import { RxClipboardCopy } from 'react-icons/rx'
import ReactMarkdown, { ExtraProps } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import './index.scss'

export interface MarkdownProps {
  className?: string
  children: string
}

const HighlightCode = memo((
  props: ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps
) => {
  const { children, className, ref, ...rest } = props
  const match = /language-(\w+)/.exec(className || '')
  const copy = useCopyToClipboard()
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)

  const code = useMemo(() => {
    return match ? String(children).replace(/\n$/, '') : ''
  }, [children, match])

  const onCopy = useCallback(() => {
    copy(code, (isSuccess) => {
      if (isSuccess) {
        setTooltipOpen(true)
      }
    })
  }, [code, copy])

  return match ? (
    <Fragment>
      <Tooltip open={tooltipOpen} content="Copied!">
        <IconButton
          className="absolute right-4 top-4 cursor-pointer"
          variant="solid"
          onClick={onCopy}
          onMouseLeave={() => setTooltipOpen(false)}
        >
          <RxClipboardCopy />
        </IconButton>
      </Tooltip>
      <SyntaxHighlighter {...rest} style={vscDarkPlus} language={match[1]} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </Fragment>
  ) : (
    <code ref={ref} {...rest} className={cs('highlight', className)}>
      {children}
    </code>
  )
})

HighlightCode.displayName = 'HighlightCode'

const ThinkComponent = memo(({ className, children }: MarkdownProps) => {
  const [thinkOpen, setThinkOpen] = useState<boolean>(true)
  return (
    // <div
    //   style={{
    //     backgroundColor: 'rgba(0, 136, 255, 0.22)',
    //     padding: '10px',
    //     borderRadius: '5px'
    //   }}
    // >
    //   {children}
    // </div>
    <>
      <Callout.Root color="gray" variant="surface">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text
          style={{
            marginTop: '-1.25em',
            marginBottom: '-1.25em'
          }}
        >
          <p>
            <Button
              onClick={() => setThinkOpen((thinkOpen) => !thinkOpen)}
              size="2"
              variant="ghost"
            >
              <b>Reasoned</b>
              {thinkOpen ? <ChevronUpIcon width={15} /> : <ChevronDownIcon width={15} />}
            </Button>
          </p>
          {thinkOpen && children}
        </Callout.Text>
      </Callout.Root>
    </>
  )
})

ThinkComponent.displayName = 'ThinkComponent'

export const Markdown = memo(({ className, children }: MarkdownProps) => {
  const processGenMath = useCallback((markdown: string) => {
    // Convert `\(...\)`, `\[...\]` -> `$...$` 和 `$$...$$`
    const processedMarkdown = markdown
      .replaceAll(/\\\((\s*?.*?\s*?)\\\)/g, '$$$1$$')
      .replaceAll(/\\\[(\s*?[\s\S]*?\s*?)\\\]/g, '$$$$$1$$$$')

    return processedMarkdown
  }, [])

  const thinkPatch = useCallback((markdown: string) => {
    return markdown
      .replaceAll(/<think>\s*/g, '<think>\n\n')
      .replaceAll(/\s*<\/think>/g, '\n\n</think>')
  }, [])

  // 缓存处理后的 markdown 内容
  const processedContent = useMemo(() => {
    return thinkPatch(processGenMath(children))
  }, [children, thinkPatch, processGenMath])

  // 缓存 remarkPlugins 和 rehypePlugins 数组
  const remarkPlugins = useMemo(() => [remarkParse, remarkMath, remarkRehype, remarkGfm], [])
  const rehypePlugins = useMemo(() => [rehypeRaw, [rehypeKatex, { output: 'mathml' }] as any, rehypeStringify], [])

  // 缓存 components 对象，避免每次重新创建
  const components = useMemo(() => ({
    // TODO: fix error
    //@ts-ignore
    think: ThinkComponent,
    code(props: any) {
      return <HighlightCode {...props} />
    }
  }), [])

  // console.log(thinkPatch(processGenMath(children)));
  return (
    <ReactMarkdown
      className={cs('prose dark:prose-invert max-w-none', className)}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {processedContent}
    </ReactMarkdown>
  )
})

Markdown.displayName = 'Markdown'
