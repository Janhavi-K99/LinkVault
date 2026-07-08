import { ExternalLink, Star, Archive, Copy, Pencil, Trash2, MousePointerClick, Clock, CheckCircle, FileText, Folder as FolderIcon, MoreHorizontal, CornerDownRight, Eye, Paperclip, Download, FolderOpen } from 'lucide-react'
import type { Link, Folder, ExportFormat } from '@/core/types'
import { extractDomain, formatRelative, truncate, tagColor } from '@/core/utils'
import { useSelection } from '@/store/useSelection'
import { Badge } from '@/components/ui/Badge'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/core/database'
import { exportLinks } from '@/core/export'
import { toast } from 'react-hot-toast'
import { useCallback, useState } from 'react'
import { FolderPicker } from '@/components/features/FolderPicker'

interface LinkListItemProps {
  link: Link
  folders: Folder[]
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleFavorite: () => void
  onToggleArchive: () => void
  onMove: (folderId: string) => void
  onViewDetails: () => void
}

export function LinkListItem({
  link, folders, onOpen, onEdit, onDelete,
  onDuplicate, onToggleFavorite, onToggleArchive, onMove, onViewDetails,
}: LinkListItemProps) {
  const { toggle, isSelected } = useSelection()
  const selected = isSelected(link.id)
  const attachmentCount = useLiveQuery(() => db.attachments.where('linkId').equals(link.id).count(), [link.id]) ?? 0
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggle(link.id)
  }

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      const allFolders = await db.folders.toArray()
      await exportLinks([link], allFolders, format)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    }
  }, [link])

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${selected ? 'bg-vault-50 ring-1 ring-vault-200' : 'hover:bg-gray-50'}`}
      onClick={onViewDetails}
    >
      <div className="pt-0.5" onClick={handleCheckboxClick}>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-vault-600 border-vault-600' : 'border-gray-300 group-hover:border-gray-400'}`}>
          {selected && <CheckCircle size={14} className="text-white" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-medium text-gray-900 truncate">{link.title}</h3>
          {link.isFavorite && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
          {link.isArchived && <Archive size={12} className="text-gray-400 shrink-0" />}
          {attachmentCount > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0" title={`${attachmentCount} attachment(s)`}>
              <Paperclip size={11} /> {attachmentCount}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-1 truncate">{extractDomain(link.url)}</p>
        {link.description && (
          <p className="text-xs text-gray-500 mb-1.5 line-clamp-1">{truncate(link.description, 120)}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {link.tags.slice(0, 3).map((t) => (
            <Badge key={t} color={tagColor(t)}>{t}</Badge>
          ))}
          {link.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{link.tags.length - 3}</span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {formatRelative(link.createdAt)}
          </span>
          {(link.visitCount ?? 0) > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MousePointerClick size={10} /> {link.visitCount}
            </span>
          )}
        </div>
      </div>

      <Dropdown
        align="right"
        trigger={
          <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
            <MoreHorizontal size={14} />
          </button>
        }
      >
        <DropdownItem icon={<Eye size={14} />} onClick={(e) => { e?.stopPropagation(); onViewDetails() }}>View Details</DropdownItem>
        <DropdownItem icon={<ExternalLink size={14} />} onClick={(e) => { e?.stopPropagation(); onOpen() }}>Open</DropdownItem>
        <DropdownItem icon={<Copy size={14} />} onClick={(e) => { e?.stopPropagation(); navigator.clipboard.writeText(link.url) }}>Copy URL</DropdownItem>
        <DropdownItem icon={<Pencil size={14} />} onClick={(e) => { e?.stopPropagation(); onEdit() }}>Edit</DropdownItem>
        <DropdownItem icon={<Star size={14} />} onClick={(e) => { e?.stopPropagation(); onToggleFavorite() }}>
          {link.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        </DropdownItem>
        <DropdownItem icon={<CornerDownRight size={14} />} onClick={(e) => { e?.stopPropagation(); onDuplicate() }}>Duplicate</DropdownItem>
        <div className="border-t border-gray-100 pt-1 mt-1">
          <p className="px-3 py-1 text-xs text-gray-400 font-medium">Export as</p>
          <DropdownItem onClick={(e) => { e?.stopPropagation(); handleExport('excel') }}>Excel</DropdownItem>
          <DropdownItem onClick={(e) => { e?.stopPropagation(); handleExport('full') }}>Full (ZIP with attachments)</DropdownItem>
        </div>
        <div className="border-t border-gray-100 pt-1 mt-1">
          <DropdownItem icon={<FolderOpen size={14} />} onClick={(e) => { e?.stopPropagation(); setPickerOpen(true) }}>Move to folder...</DropdownItem>
        </div>
        <div className="border-t border-gray-100 pt-1 mt-1">
          <DropdownItem icon={<Archive size={14} />} onClick={(e) => { e?.stopPropagation(); onToggleArchive() }}>
            {link.isArchived ? 'Unarchive' : 'Archive'}
          </DropdownItem>
          <DropdownItem icon={<Trash2 size={14} />} danger onClick={(e) => { e?.stopPropagation(); onDelete() }}>Delete</DropdownItem>
        </div>
      </Dropdown>
      <FolderPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(folderId) => { onMove(folderId ?? ''); setPickerOpen(false) }}
      />
    </div>
  )
}
