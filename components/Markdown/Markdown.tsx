'use client'

import { ClassAttributes, Fragment, HTMLAttributes, useCallback, useState } from 'react'
import {
  Blockquote,
  Button,
  Callout,
  ChevronDownIcon,
  IconButton,
  Link,
  Tooltip
} from '@radix-ui/themes'
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
import { MathJax, MathJaxContext } from 'better-react-mathjax'

import './index.scss'
import { ChevronUpIcon, InfoCircledIcon } from '@radix-ui/react-icons'

export interface MarkdownProps {
  className?: string
  children: string
}

const HighlightCode = (
  props: ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps
) => {
  const { children, className, ref, ...rest } = props
  const match = /language-(\w+)/.exec(className || '')
  const copy = useCopyToClipboard()
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)

  const code = match ? String(children).replace(/\n$/, '') : ''

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
}

const ThinkComponent = ({ className, children }: MarkdownProps) => {
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
}

export const Markdown = ({ className, children }: MarkdownProps) => {
  const processGenMath = (markdown: string) => {
    // Convert `\(...\)`, `\[...\]` -> `$...$` 和 `$$...$$`
    const processedMarkdown = markdown
      .replaceAll(/\\\((\s*?.*?\s*?)\\\)/g, '$$$1$$')
      .replaceAll(/\\\[(\s*?[\s\S]*?\s*?)\\\]/g, '$$$$$1$$$$')

    return processedMarkdown
  }
  const thinkPatch = (markdown: string) => {
    return markdown
      .replaceAll(/<think>\s*/g, '<think>\n\n')
      .replaceAll(/\s*<\/think>/g, '\n\n</think>')
  }
  // console.log(thinkPatch(processGenMath(children)));
  return (
    <ReactMarkdown
      className={cs('prose dark:prose-invert max-w-none', className)}
      remarkPlugins={[remarkParse, remarkMath, remarkRehype, remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeKatex, { output: 'mathml' }], rehypeStringify]}
      components={{
        // TODO: fix error
        //@ts-ignore
        think: ThinkComponent,
        code(props) {
          return <HighlightCode {...props} />
        }
      }}
    >
      {thinkPatch(processGenMath(children))}
    </ReactMarkdown>
  )
}
