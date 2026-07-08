import { useState } from 'react'
import { Download, Trash2, FolderOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSelection } from '@/store/useSelection'
import { db } from '@/core/database'
import { exportLinks } from '@/core/export'
import { toast } from 'react-hot-toast'
import type { ExportFormat } from '@/core/types'
import { FolderPicker } from '@/components/features/FolderPicker'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

interface BulkActionsProps {
  onDelete: (ids: string[]) => void
  onMove: (ids: string[], folderId: string | null) => void
}

export function BulkActions({ onDelete, onMove }: BulkActionsProps) {
  const { selectedIds, clear, count } = useSelection()
  const [pickerOpen, setPickerOpen] = useState(false)

  if (count() === 0) return null

  const ids = Array.from(selectedIds)

  const exportSelected = async (format: ExportFormat) => {
    try {
      const links = await db.links.where('id').anyOf(ids).toArray()
      const allFolders = await db.folders.toArray()
      const folderIds = new Set(links.map((l) => l.folderId).filter(Boolean) as string[])
      const relatedFolders = allFolders.filter((f) => folderIds.has(f.id))
      await exportLinks(links, relatedFolders, format)
      toast.success(`Exported ${links.length} link(s) as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <>
      <FolderPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(folderId) => { onMove(ids, folderId); clear(); setPickerOpen(false) }}
      />
      <div className="flex items-center gap-2 px-4 py-2 bg-vault-50 rounded-lg border border-vault-200 animate-in slide-in-from-bottom-1 duration-200">
        <span className="text-sm font-medium text-vault-700">{count()} selected</span>
        <div className="flex-1" />
        <Dropdown
          trigger={
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export
            </Button>
          }
        >
          <DropdownItem onClick={() => exportSelected('excel')}>Export as Excel</DropdownItem>
          <DropdownItem onClick={() => exportSelected('full')}>Export All (ZIP with attachments)</DropdownItem>
        </Dropdown>
        <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
          <FolderOpen size={14} /> Move
        </Button>
        <Button variant="danger" size="sm" onClick={() => { onDelete(ids); clear() }}>
          <Trash2 size={14} /> Delete
        </Button>
        <button onClick={clear} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
          <X size={16} />
        </button>
      </div>
    </>
  )
}
