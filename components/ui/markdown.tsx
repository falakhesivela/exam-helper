"use client"

import type { ComponentProps } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

const remarkPlugins = [remarkGfm, remarkBreaks]

/** Inline elements shared by both renderers; sized relative to the parent. */
const inlineElements: Components = {
  strong: ({ node: _, ...props }) => (
    <strong className="font-semibold" {...props} />
  ),
  code: ({ node: _, ...props }) => (
    <code
      className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      {...props}
    />
  ),
  a: ({ node: _, ...props }) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
      {...props}
    />
  ),
}

const blockElements: Components = {
  ...inlineElements,
  p: ({ node: _, ...props }) => <p className="leading-relaxed" {...props} />,
  ul: ({ node: _, ...props }) => (
    <ul className="flex flex-col gap-1 pl-5 [&>li]:list-disc" {...props} />
  ),
  ol: ({ node: _, ...props }) => (
    <ol className="flex flex-col gap-1 pl-5 [&>li]:list-decimal" {...props} />
  ),
  li: ({ node: _, ...props }) => <li className="leading-relaxed" {...props} />,
  h1: ({ node: _, ...props }) => (
    <p role="heading" aria-level={3} className="text-[1.05em] font-semibold" {...props} />
  ),
  h2: ({ node: _, ...props }) => (
    <p role="heading" aria-level={3} className="text-[1.05em] font-semibold" {...props} />
  ),
  h3: ({ node: _, ...props }) => (
    <p role="heading" aria-level={4} className="font-semibold" {...props} />
  ),
  h4: ({ node: _, ...props }) => (
    <p role="heading" aria-level={4} className="font-semibold" {...props} />
  ),
  // contain-[inline-size] on the scroll wrappers: without it, the content's
  // max-content width propagates through the wrapper's intrinsic size and
  // widens fit-content ancestors (mx-auto page columns) past the phone
  // viewport instead of scrolling.
  pre: ({ node: _, ...props }) => (
    <pre
      className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-[0.85em] leading-relaxed contain-[inline-size] [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  blockquote: ({ node: _, ...props }) => (
    <blockquote
      className="border-l-2 border-border pl-3 text-muted-foreground"
      {...props}
    />
  ),
  hr: ({ node: _, ...props }) => <hr className="border-border" {...props} />,
  table: ({ node: _, ...props }) => (
    <div className="overflow-x-auto rounded-lg border border-border contain-[inline-size]">
      <table className="w-full min-w-max" {...props} />
    </div>
  ),
  thead: ({ node: _, ...props }) => <thead className="bg-muted/50" {...props} />,
  tr: ({ node: _, ...props }) => (
    <tr className="border-b border-border last:border-b-0" {...props} />
  ),
  th: ({ node: _, ...props }) => (
    <th className="px-3 py-2 text-left font-medium" {...props} />
  ),
  td: ({ node: _, ...props }) => <td className="px-3 py-2" {...props} />,
}

/**
 * Inline contexts (headings, option rows, list items, table cells) can't
 * contain block tags, so paragraphs and lists degrade to styled spans.
 */
const inlineOnlyElements: Components = {
  ...inlineElements,
  // Plain span so the first paragraph flows inline after preceding text
  // (e.g. a question number); the wrapper makes later siblings break.
  p: ({ node: _, ...props }) => <span {...props} />,
  ul: ({ node: _, ...props }) => <span className="block" {...props} />,
  ol: ({ node: _, ...props }) => <span className="block" {...props} />,
  li: ({ node: _, ...props }) => (
    <span className="block pl-4 -indent-2.5">• {props.children}</span>
  ),
  h1: ({ node: _, ...props }) => (
    <span className="block font-semibold" {...props} />
  ),
  h2: ({ node: _, ...props }) => (
    <span className="block font-semibold" {...props} />
  ),
  h3: ({ node: _, ...props }) => (
    <span className="block font-semibold" {...props} />
  ),
  h4: ({ node: _, ...props }) => (
    <span className="block font-semibold" {...props} />
  ),
  pre: ({ node: _, ...props }) => (
    <span className="block whitespace-pre-wrap font-mono text-[0.85em]" {...props} />
  ),
  blockquote: ({ node: _, ...props }) => (
    <span className="block border-l-2 border-border pl-3" {...props} />
  ),
}

interface MarkdownProps {
  children: string
  className?: string
}

/**
 * Renders AI-generated markdown (bold, code, lists, tables, links) with
 * app styling. Font size is inherited, so set text-* on `className`.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={blockElements}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Markdown constrained to phrasing content, for text inside headings,
 * buttons, table cells, or flex rows where block tags would be invalid
 * or break the layout. Renders as a single wrapping span.
 */
export function MarkdownInline({
  children,
  className,
  ...rest
}: MarkdownProps & Omit<ComponentProps<"span">, "children" | "className">) {
  return (
    <span
      className={cn("min-w-0 [&>span+span]:mt-1 [&>span+span]:block", className)}
      {...rest}
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} components={inlineOnlyElements}>
        {children}
      </ReactMarkdown>
    </span>
  )
}
