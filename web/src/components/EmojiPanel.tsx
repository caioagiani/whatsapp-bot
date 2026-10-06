import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'

export default function EmojiPanel({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="emoji-panel">
      <EmojiPicker
        onEmojiClick={(e) => onPick(e.emoji)}
        theme={Theme.AUTO}
        emojiStyle={EmojiStyle.NATIVE}
        lazyLoadEmojis
        searchPlaceHolder="Pesquisar emoji"
        previewConfig={{ showPreview: false }}
        width="100%"
        height={320}
      />
    </div>
  )
}
