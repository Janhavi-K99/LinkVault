import { useState, useMemo } from 'react'
import { useAllLinks, useFolders, useUIStore } from '@/store/useStore'
import { useSelection } from '@/store/useSelection'
import { Header } from '@/components/layout/Header'
import { LinkListItem } from '@/components/links/LinkListItem'
import { LinkForm } from '@/components/links/LinkForm'
import { LinkDetailModal } from '@/components/links/LinkDetailModal'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SortSelector } from '@/components/features/SortSelector'
import { BulkActions } from '@/components/links/BulkActions'
import { db } from '@/core/database'
import { Bookmark, Search, Folder as FolderIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { generateId } from '@/core/utils'
import type { Link } from '@/core/types'

export function AllLinks() {
  const allLinks = useAllLinks()
  const { folders } = useFolders()
  const { searchQuery, sortConfig } = useUIStore()
  const { clear } = useSelection()

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [detailLink, setDetailLink] = useState<Link | null>(null)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)
  const [folderFilter, setFolderFilter] = useState<string>('')

  const sorted = useMemo(() => {
    let result = [...allLinks]

    if (folderFilter) {
      result = result.filter((l) => l.folderId === folderFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      const field = sortConfig.field
      const order = sortConfig.order === 'desc' ? -1 : 1
      const aVal = a[field] ?? ''
      const bVal = b[field] ?? ''
      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal as string) * order
      }
      return ((aVal as number) - (bVal as number)) * order
    })

    return result
  }, [allLinks, searchQuery, sortConfig, folderFilter])

  const updateLink = async (id: string, data: Partial<Link>) => {
    await db.links.update(id, { ...data, updatedAt: Date.now() })
  }

  const deleteLink = async (id: string) => {
    await db.links.delete(id)
  }

  const deleteLinks = async (ids: string[]) => {
    await db.links.bulkDelete(ids)
  }

  const duplicateLink = async (id: string) => {
    const original = await db.links.get(id)
    if (!original) return
    const dup: Link = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visitCount: 0,
      lastOpened: null,
    }
    await db.links.add(dup)
    return dup
  }

  const moveLinks = async (ids: string[], targetFolderId: string | null) => {
    for (const id of ids) {
      await db.links.update(id, { folderId: targetFolderId, updatedAt: Date.now() })
    }
  }

  const toggleFavorite = async (id: string) => {
    const link = await db.links.get(id)
    if (!link) return
    await db.links.update(id, { isFavorite: !link.isFavorite, updatedAt: Date.now() })
  }

  const toggleArchive = async (id: string) => {
    const link = await db.links.get(id)
    if (!link) return
    await db.links.update(id, { isArchived: !link.isArchived, updatedAt: Date.now() })
  }

  const openLink = async (id: string) => {
    const link = await db.links.get(id)
    if (!link) return
    await db.links.update(id, {
      visitCount: (link.visitCount ?? 0) + 1,
      lastOpened: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const handleOpen = async (link: Link) => {
    await openLink(link.id)
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteLink = async () => {
    if (!deletingLink) return
    await deleteLink(deletingLink.id)
    toast.success('Link deleted')
    setDeletingLink(null)
  }

  const handleBulkDelete = async (ids: string[]) => {
    await deleteLinks(ids)
    toast.success(`${ids.length} links deleted`)
  }

  const handleBulkMove = async (ids: string[], targetFolderId: string | null) => {
    await moveLinks(ids, targetFolderId)
    toast.success(`Moved ${ids.length} links`)
  }

  return (
    <div>
      <Header title="All Links" onAdd={() => setShowLinkForm(true)} addLabel="Add Link" showViewToggle />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search links..."
            onChange={(e) => useUIStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vault-500/20 focus:border-vault-500"
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <SortSelector />
      </div>

      <BulkActions onDelete={handleBulkDelete} onMove={handleBulkMove} />

      {sorted.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {sorted.map((link) => (
            <LinkListItem
              key={link.id}
              link={link}
              folders={folders}
              onViewDetails={() => setDetailLink(link)}
              onOpen={() => handleOpen(link)}
              onEdit={() => setEditingLink(link)}
              onDelete={() => setDeletingLink(link)}
              onDuplicate={async () => { await duplicateLink(link.id); toast.success('Duplicated') }}
              onToggleFavorite={async () => { await toggleFavorite(link.id) }}
              onToggleArchive={async () => { await toggleArchive(link.id) }}
              onMove={async (fid) => { await moveLinks([link.id], fid || null); toast.success('Moved') }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title={searchQuery ? 'No results found' : 'No links yet'}
          description={searchQuery ? 'Try adjusting your search or filters' : 'Save your first link to get started'}
          action={
            !searchQuery ? (
              <button
                onClick={() => setShowLinkForm(true)}
                className="px-4 py-2 bg-vault-600 text-white rounded-lg text-sm font-medium hover:bg-vault-700 transition-colors cursor-pointer"
              >
                Add Link
              </button>
            ) : undefined
          }
        />
      )}

      <Modal open={showLinkForm} onClose={() => setShowLinkForm(false)} title="Save New Link">
        <LinkForm onDone={() => setShowLinkForm(false)} />
      </Modal>

      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Link">
        {editingLink && <LinkForm link={editingLink} onDone={() => setEditingLink(null)} />}
      </Modal>

      {detailLink && (
        <LinkDetailModal
          link={detailLink}
          folder={folders.find((f) => f.id === detailLink.folderId)}
          open={!!detailLink}
          onClose={() => setDetailLink(null)}
          onEdit={() => { setEditingLink(detailLink); setDetailLink(null) }}
          onDelete={() => { setDeletingLink(detailLink); setDetailLink(null) }}
          onToggleFavorite={async () => { await toggleFavorite(detailLink.id); setDetailLink(null) }}
          onToggleArchive={async () => { await toggleArchive(detailLink.id); setDetailLink(null) }}
          onDuplicate={async () => { await duplicateLink(detailLink.id); toast.success('Duplicated'); setDetailLink(null) }}
        />
      )}

      <ConfirmDialog
        open={!!deletingLink}
        onClose={() => setDeletingLink(null)}
        onConfirm={handleDeleteLink}
        title="Delete Link"
        message={`Delete "${deletingLink?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
