import { useCallback, useState, useRef } from 'react'
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, MoreHorizontal, Download, GripVertical, FolderOpen, Copy } from 'lucide-react'
import type { Folder as FolderType, ExportFormat } from '@/core/types'
import { useNavigate, useParams } from 'react-router-dom'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { toast } from 'react-hot-toast'
import { db } from '@/core/database'
import { useFolders } from '@/store/useStore'
import { useTabStore } from '@/store/useTabStore'
import { exportLinks } from '@/core/export'
import { FolderPicker } from '@/components/features/FolderPicker'

interface FolderTreeProps {
  folders: FolderType[]
  onEdit: (folder: FolderType) => void
  onDelete: (folder: FolderType) => void
}

export function FolderTree({ folders, onEdit, onDelete }: FolderTreeProps) {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const { getDescendantIds, reorderFolders, moveFolder, duplicateFolder } = useFolders()
  const { openTab, setActiveId } = useTabStore()
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const autoExpand = new Set<string>()
    if (currentId) {
      let parent: FolderType | undefined = folders.find((f) => f.id === currentId)
      while (parent) {
        if (parent.parentId) autoExpand.add(parent.parentId)
        parent = folders.find((f) => f.id === parent?.parentId)
      }
    }
    return autoExpand
  })
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const getChildren = (parentId: string | null) =>
    folders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order)

  const getFolderLinks = async (folderId: string) => {
    const descIds = getDescendantIds(folderId)
    const links = await db.links.where('folderId').anyOf(descIds).toArray()
    if (links.length === 0) { toast.error('No links in this folder'); return null }
    return links
  }

  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragOverRef = useRef<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverRef.current !== id) {
      dragOverRef.current = id
      setDragOverId(id)
    }
  }

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (dragOverRef.current === id) {
      dragOverRef.current = null
      setDragOverId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)
    dragOverRef.current = null
    const draggedId = dragId
    setDragId(null)
    if (!draggedId || draggedId === targetId) return

    const dragged = folders.find((f) => f.id === draggedId)
    const target = folders.find((f) => f.id === targetId)
    if (!dragged || !target) return

    const parentId = dragged.parentId
    if (parentId !== target.parentId) return

    const siblings = getChildren(parentId)
    const reordered = siblings
      .filter((f) => f.id !== draggedId)
      .flatMap((f) => (f.id === targetId ? [dragged, f] : [f]))

    try {
      await reorderFolders(reordered.map((f) => f.id))
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const renderFolder = (folder: FolderType, depth: number) => {
    const children = getChildren(folder.id)
    const isExpanded = expanded.has(folder.id)
    const isActive = currentId === folder.id
    const isDragging = dragId === folder.id
    const isOver = dragOverId === folder.id && dragId !== folder.id

    return (
      <div key={folder.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={(e) => handleDragLeave(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
          onDragEnd={() => { setDragId(null); setDragOverId(null); dragOverRef.current = null }}
          onClick={() => { openTab({ id: folder.id, label: folder.name, type: 'folder' }); navigate(`/folders/${folder.id}`) }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${isActive ? 'bg-vault-50 text-vault-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'} ${isDragging ? 'opacity-40' : ''} ${isOver ? 'ring-2 ring-vault-400' : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <span className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={12} />
          </span>

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
            className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: folder.color }}
          >
            <Folder size={10} />
          </div>

          <span className="text-sm truncate flex-1">{folder.name}</span>

          <Dropdown
            align="right"
            trigger={
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <MoreHorizontal size={12} />
              </button>
            }
          >
            <div>
              <p className="px-3 py-1 text-xs text-gray-400 font-medium">Export folder as</p>
              <DropdownItem icon={<Download size={14} />} onClick={async () => {
                const links = await getFolderLinks(folder.id)
                if (!links) return
                await exportLinks(links, folders, 'excel')
                toast.success(`Exported ${links.length} link(s) as Excel`)
              }}>Excel</DropdownItem>
              <DropdownItem onClick={async () => {
                const links = await getFolderLinks(folder.id)
                if (!links) return
                await exportLinks(links, folders, 'full')
                toast.success(`Exported ${links.length} link(s) with attachments`)
              }}>Full (ZIP with attachments)</DropdownItem>
            </div>
            <div className="border-t border-gray-100 pt-1 mt-1">
              <DropdownItem icon={<FolderOpen size={14} />} onClick={() => setMoveFolderId(folder.id)}>Move...</DropdownItem>
              <DropdownItem icon={<Copy size={14} />} onClick={async () => {
                await duplicateFolder(folder.id)
                toast.success(`Duplicated "${folder.name}"`)
              }}>Duplicate</DropdownItem>
              <DropdownItem icon={<Pencil size={14} />} onClick={() => onEdit(folder)}>Edit</DropdownItem>
              <DropdownItem icon={<Trash2 size={14} />} danger onClick={() => onDelete(folder)}>Delete</DropdownItem>
            </div>
          </Dropdown>
        </div>

        {isExpanded && children.length > 0 && (
          <div>
            {children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const roots = getChildren(null)

  return (
    <>
      <FolderPicker
        open={!!moveFolderId}
        onClose={() => setMoveFolderId(null)}
        onSelect={async (newParentId) => {
          if (moveFolderId) {
            await moveFolder(moveFolderId, newParentId)
            toast.success('Folder moved')
          }
          setMoveFolderId(null)
        }}
        excludeTreeId={moveFolderId ?? undefined}
      />
      <div className="space-y-0.5">{roots.map((f) => renderFolder(f, 0))}</div>
    </>
  )
}
