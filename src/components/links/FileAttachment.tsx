import { Upload, File, X, Image, FileText, Video, Music, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { db } from '@/core/database'
import { generateId, readFileAsBuffer, bufferToBlob } from '@/core/utils'
import type { Attachment } from '@/core/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'react-hot-toast'
import { useState } from 'react'

interface FileAttachmentProps {
  linkId: string
}

const typeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  'image/': Image,
  'text/': FileText,
  'video/': Video,
  'audio/': Music,
  'application/': FileText,
  'application/pdf': FileText,
}

function getFileIcon(mime: string) {
  const prefix = Object.entries(typeIcons).find(([key]) => mime.startsWith(key))
  return prefix ? prefix[1] : File
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileAttachment({ linkId }: FileAttachmentProps) {
  const attachments = useLiveQuery(() => db.attachments.where('linkId').equals(linkId).toArray(), [linkId]) ?? []
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
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
    toast.success(`Uploaded ${files.length} file(s)`)
    e.target.value = ''
  }

  const handleDelete = async (id: string, name: string) => {
    await db.attachments.delete(id)
    toast.success(`Deleted ${name}`)
  }

  const handleDownload = (attachment: Attachment) => {
    const url = URL.createObjectURL(bufferToBlob(attachment.data, attachment.type))
    const a = document.createElement('a')
    a.href = url
    a.download = attachment.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleOpen = (attachment: Attachment) => {
    const url = URL.createObjectURL(bufferToBlob(attachment.data, attachment.type))
    window.open(url, '_blank')
  }

  const isPreviewable = (type: string) =>
    type.startsWith('image/') || type === 'application/pdf' || type.startsWith('video/') || type.startsWith('audio/')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</label>
        <label className="cursor-pointer">
          <Button type="button" variant="secondary" size="sm" onClick={() => {}}>
            <Upload size={14} /> Upload File
          </Button>
          <input type="file" multiple onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.type)
            const isImage = att.type.startsWith('image/')
            return (
              <div key={att.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors">
                {isImage ? (
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-gray-200 cursor-pointer" onClick={() => handleOpen(att)}>
                    <img src={URL.createObjectURL(bufferToBlob(att.data, att.type))} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <Icon size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate font-medium">{att.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(att.size)}</p>
                </div>
                <button
                  onClick={() => handleOpen(att)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-vault-600 hover:bg-vault-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title={isPreviewable(att.type) ? 'Open' : 'Download'}
                >
                  {isPreviewable(att.type) ? <ExternalLink size={14} /> : <Download size={14} />}
                </button>
                <button onClick={() => handleDownload(att)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Download">
                  <Download size={14} />
                </button>
                <button onClick={() => handleDelete(att.id, att.name)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Delete">
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
