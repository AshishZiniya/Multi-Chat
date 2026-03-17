import { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import * as Popover from '@radix-ui/react-popover'
import MaterialIcon from './MaterialIcon'
import { systemInstructionsAtom } from '../store/canvasAtoms'

const AUTOSAVE_MS = 100

interface SystemInstructionsContentProps {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
}

function SystemInstructionsContent({ value, onChange, open }: SystemInstructionsContentProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => onChange(draft), AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [draft, onChange])

  return (
    <div className="w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-xl bg-white dark:bg-black shadow-xl border border-black/10 dark:border-white/20">
      <div className="shrink-0 px-5 pt-4 pb-1">
        <h2 id="system-instructions-title" className="text-lg font-semibold text-black dark:text-white">
          How should I respond?
        </h2>
      </div>
      <div className="flex flex-col px-5 pb-5 pt-0 gap-4">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Be concise and prefer code. Or: You're helping me with gardening notes."
          className="min-h-[200px] w-full px-4 py-3 rounded-lg border border-black/10 dark:border-white/20 bg-black/4 dark:bg-white/5 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-transparent resize-none"
        />
        <p className="text-sm text-black/60 dark:text-white/60">
          Tell me how you&#39;d like me to behave. I&#39;ll add this to my instructions. Leave it blank to use my defaults.
        </p>
      </div>
    </div>
  )
}

export default function SystemInstructionsButton() {
  const [systemInstructions, setSystemInstructions] = useAtom(systemInstructionsAtom)
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="aspect-square size-10 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/20 bg-white dark:bg-black shadow-sm text-black dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="How should I respond?"
          aria-label="How should I respond?"
        >
          <MaterialIcon name="hearing" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={8}
          align="end"
          className="z-9999 focus:outline-none"
          aria-labelledby="system-instructions-title"
        >
          <SystemInstructionsContent
            value={systemInstructions}
            onChange={setSystemInstructions}
            open={open}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
