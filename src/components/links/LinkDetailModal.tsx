import { ExternalLink, Copy, Star, Pencil, Trash2, Calendar, Clock, MousePointerClick, Folder as FolderIcon, Archive, CornerDownRight, Paperclip, List } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FileAttachment } from './FileAttachment'
import { FileDropZone } from './FileDropZone'
import type { Link, Folder } from '@/core/types'
import { formatDateTime, extractDomain, tagColor, formatRelative } from '@/core/utils'
import { toast } from 'react-hot-toast'

interface LinkDetailModalProps {
  link: Link
  folder?: Folder
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onToggleArchive: () => void
  onDuplicate: () => void
}

export function LinkDetailModal({
  link, folder, open, onClose, onEdit, onDelete,
  onToggleFavorite, onToggleArchive, onDuplicate,
}: LinkDetailModalProps) {
  const handleOpen = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(link.url)
    toast.success('URL copied to clipboard')
  }

  return (
    <Modal open={open} onClose={onClose} title="Link Details" size="lg">
      <div className="space-y-5">
        {/* HEADER */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{link.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{extractDomain(link.url)}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={handleOpen} className="p-2 rounded-lg text-gray-500 hover:text-vault-600 hover:bg-vault-50 transition-colors cursor-pointer" title="Open">
                <ExternalLink size={18} />
              </button>
              <button onClick={handleCopy} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" title="Copy URL">
                <Copy size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {link.isFavorite && <Badge color="#fab005">Favorite</Badge>}
            {link.isArchived && <Badge color="#868e96">Archived</Badge>}
            {folder && <Badge color={folder.color}>{folder.name}</Badge>}
          </div>
        </div>

        {/* DESCRIPTION */}
        {link.description && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-sm text-gray-700">{link.description}</p>
          </div>
        )}

        {/* NOTES */}
        {link.notes && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Personal Notes</h4>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {link.notes}
            </div>
          </div>
        )}

        {/* TAGS */}
        {link.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {link.tags.map((t) => (
                <Badge key={t} color={tagColor(t)}>{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOM FIELDS */}
        {link.customFields && link.customFields.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <List size={12} /> Extra Fields
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {link.customFields.map((field, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 uppercase">{field.key}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILES */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Paperclip size={12} /> Attachments
          </h4>
          <FileDropZone linkId={link.id} />
          <div className="mt-3">
            <FileAttachment linkId={link.id} />
          </div>
        </div>

        {/* METADATA */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span>Created: {formatDateTime(link.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span>Updated: {formatRelative(link.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <MousePointerClick size={14} />
            <span>Visited: {link.visitCount ?? 0} times</span>
          </div>
          {link.lastOpened && (
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={14} />
              <span>Last opened: {formatRelative(link.lastOpened)}</span>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={handleOpen}>
              <ExternalLink size={14} /> Open
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy size={14} /> Copy URL
            </Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil size={14} /> Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={onToggleFavorite}>
              <Star size={14} className={link.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''} />
              {link.isFavorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onToggleArchive}>
              <Archive size={14} /> {link.isArchived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onDuplicate}>
              <CornerDownRight size={14} /> Duplicate
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
