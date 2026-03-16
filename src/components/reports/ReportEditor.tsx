"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react"

interface ReportEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
}

export function ReportEditor({ content, onChange, className }: ReportEditorProps) {
  const [localContent, setLocalContent] = useState(content)

  const handleChange = (value: string) => {
    setLocalContent(value)
    onChange(value)
  }

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = localContent.substring(start, end)
    const newText =
      localContent.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      localContent.substring(end)

    handleChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      )
    }, 0)
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertFormatting("**")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertFormatting("*")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertFormatting("## ", "\n")}
          title="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertFormatting("- ", "\n")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => insertFormatting("1. ", "\n")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        value={localContent}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Scrie continutul raportului..."
        className="min-h-[400px] border-0 rounded-none resize-none focus-visible:ring-0"
      />
    </div>
  )
}
