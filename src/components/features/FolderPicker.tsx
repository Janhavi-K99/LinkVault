import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useFolders } from '@/store/useStore'
import type { Folder } from '@/core/types'
import { Folder as FolderIcon, FileText, ChevronRight, ChevronDown } from 'lucide-react'

interface FolderPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (folderId: string | null) => void
  excludeTreeId?: string
}

export function FolderPicker({ open, onClose, onSelect, excludeTreeId }: FolderPickerProps) {
  const { folders, getDescendantIds } = useFolders()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(folders.map((f) => f.parentId).filter(Boolean) as string[]))

  const excludeSet = excludeTreeId ? new Set(getDescendantIds(excludeTreeId)) : new Set<string>()

  const getChildren = (parentId: string | null) =>
    folders.filter((f) => f.parentId === parentId && !excludeSet.has(f.id)).sort((a, b) => a.order - b.order)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (folder: Folder, depth: number) => {
    const children = getChildren(folder.id)
    const isExpanded = expanded.has(folder.id)

    return (
      <div key={folder.id}>
        <div
          onClick={() => { onSelect(folder.id); onClose() }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-vault-50 text-gray-700 hover:text-vault-700 transition-colors"
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(folder.id) }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: folder.color }}
          >
            <FolderIcon size={12} />
          </div>
          <span className="text-sm font-medium truncate">{folder.name}</span>
        </div>
        {isExpanded && children.length > 0 && (
          <div>{children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const roots = getChildren(null)

  return (
    <Modal open={open} onClose={onClose} title="Move to folder" size="md">
      <div className="space-y-1">
        <div
          onClick={() => { onSelect(null); onClose() }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-vault-50 text-gray-700 hover:text-vault-700 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
            <FileText size={12} />
          </div>
          <span className="text-sm font-medium">No folder</span>
        </div>
        {roots.map((f) => renderNode(f, 0))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  )
}
