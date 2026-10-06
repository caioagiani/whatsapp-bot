import { Fragment, memo, type ReactNode } from 'react'

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g

// WhatsApp inline formatting: *bold* _italic_ ~strike~ `mono`
const FORMAT_RE = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g
const TAGS: Record<string, string> = { '*': 'strong', _: 'em', '~': 's', '`': 'code' }

const formatInline = (text: string, keyPrefix: string): ReactNode[] =>
  text.split(FORMAT_RE).map((part, i) => {
    const mark = part[0]
    if (part.length > 2 && TAGS[mark] && part.endsWith(mark)) {
      const Tag = TAGS[mark] as 'strong'
      return <Tag key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</Tag>
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
  })

export const RichText = memo(function RichText({ text }: { text: string }) {
  // ```blocks``` first, then links, then inline marks.
  const blocks = text.split(/(```[\s\S]+?```)/g)
  return (
    <>
      {blocks.map((block, b) => {
        if (block.startsWith('```') && block.endsWith('```') && block.length > 6) {
          return <pre key={b}>{block.slice(3, -3)}</pre>
        }
        return block.split(URL_RE).map((part, i) =>
          i % 2 === 1 ? (
            <a key={`${b}-${i}`} href={part} target="_blank" rel="noreferrer noopener">
              {part}
            </a>
          ) : (
            <Fragment key={`${b}-${i}`}>{formatInline(part, `${b}-${i}`)}</Fragment>
          ),
        )
      })}
    </>
  )
})

/** Renders FTS snippets where matches are wrapped in << >>. */
export function Highlight({ text }: { text: string }) {
  return (
    <>
      {text.split(/(<<.*?>>)/g).map((part, i) =>
        part.startsWith('<<') ? <mark key={i}>{part.slice(2, -2)}</mark> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}
