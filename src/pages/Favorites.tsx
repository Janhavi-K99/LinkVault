import { useState } from 'react'
import { useFavoriteLinks, useFolders, useUIStore } from '@/store/useStore'
import { Header } from '@/components/layout/Header'
import { LinkListItem } from '@/components/links/LinkListItem'
import { LinkForm } from '@/components/links/LinkForm'
import { LinkDetailModal } from '@/components/links/LinkDetailModal'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SortSelector } from '@/components/features/SortSelector'
import { db } from '@/core/database'
import { Heart } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { generateId } from '@/core/utils'
import type { Link } from '@/core/types'

export function Favorites() {
  const links = useFavoriteLinks()
  const { folders } = useFolders()
  const { sortConfig } = useUIStore()
  const [detailLink, setDetailLink] = useState<Link | null>(null)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)

  const sorted = [...links].sort((a, b) => {
    const field = sortConfig.field
    const order = sortConfig.order === 'desc' ? -1 : 1
    const aVal = a[field] ?? ''
    const bVal = b[field] ?? ''
    if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * order
    return ((aVal as number) - (bVal as number)) * order
  })

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

  const deleteLink = async (id: string) => {
    await db.links.delete(id)
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

  return (
    <div>
      <Header title="Favorites" />

      <div className="flex items-center gap-3 mb-4">
        <SortSelector />
      </div>

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
        <EmptyState icon={Heart} title="No favorites yet" description="Mark links as favorite to see them here" />
      )}

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
        onConfirm={() => deletingLink && deleteLink(deletingLink.id)}
        title="Delete Link"
        message={`Delete "${deletingLink?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
