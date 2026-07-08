import { useCallback, useRef, useState } from 'react'
import { Upload, Clipboard, Image, File } from 'lucide-react'
import { db } from '@/core/database'
import { generateId, readFileAsBuffer } from '@/core/utils'
import type { Attachment } from '@/core/types'
import { toast } from 'react-hot-toast'

interface FileDropZoneProps {
  linkId: string
}

export function FileDropZone({ linkId }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const storeFiles = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`)
        continue
      }
      const data = await readFileAsBuffer(file)
      const attachment: Attachment = {
        id: generateId(),
        linkId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data,
        createdAt: Date.now(),
      }
      await db.attachments.add(attachment)
    }
    toast.success(`Added ${files.length} file(s)`)
  }, [linkId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) storeFiles(e.dataTransfer.files)
  }, [storeFiles])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      e.preventDefault()
      await storeFiles(files)
    }
  }, [storeFiles])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragging ? 'border-vault-500 bg-vault-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => { if (e.target.files?.length) storeFiles(e.target.files); e.target.value = '' }}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Upload size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clipboard size={12} /> Paste images from clipboard &middot; Max 50MB per file
        </p>
      </div>
    </div>
  )
}
