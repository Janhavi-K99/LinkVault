import { useState } from 'react'
import { useDashboardStats, useUIStore } from '@/store/useStore'
import { StatsCard } from '@/components/features/StatsCard'
import { QuickActions } from '@/components/features/QuickActions'
import { Header } from '@/components/layout/Header'
import { LinkListItem } from '@/components/links/LinkListItem'
import { LinkForm } from '@/components/links/LinkForm'
import { LinkDetailModal } from '@/components/links/LinkDetailModal'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLinks, useFolders } from '@/store/useStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FolderForm } from '@/components/folders/FolderForm'
import type { Link, Folder } from '@/core/types'
import { Bookmark, Heart, Folder as FolderIcon, Archive, Clock, ExternalLink, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatRelative } from '@/core/utils'

export function Dashboard() {
  const stats = useDashboardStats()
  const { folders } = useFolders()
  const { links, deleteLink, duplicateLink, toggleFavorite, toggleArchive, openLink, moveLinks } = useLinks()
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [detailLink, setDetailLink] = useState<Link | null>(null)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingLink, setDeletingLink] = useState<Link | null>(null)

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

  return (
    <div>
      <Header title="Dashboard" onAdd={() => setShowLinkForm(true)} addLabel="Add Link" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={FolderIcon} label="Total Folders" value={stats.totalFolders} color="#4c6ef5" />
        <StatsCard icon={Bookmark} label="Total Links" value={stats.totalLinks} color="#7950f2" />
        <StatsCard icon={Heart} label="Favorites" value={stats.favoriteCount} color="#e64980" />
        <StatsCard icon={Archive} label="Archived" value={stats.archivedCount} color="#868e96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-vault-500" /> Recently Added
            </h3>
            {stats.recentLinks.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setDetailLink(link)}
                    className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-vault-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                      <p className="text-xs text-gray-500">{formatRelative(link.createdAt)}</p>
                    </div>
                    {link.isFavorite && <Heart size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No links yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink size={16} className="text-vault-500" /> Recently Opened
            </h3>
            {stats.recentOpened.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentOpened.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setDetailLink(link)}
                    className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                      <p className="text-xs text-gray-500">{link.lastOpened ? formatRelative(link.lastOpened) : 'Never'}</p>
                    </div>
                    <span className="text-xs text-gray-400">{link.visitCount ?? 0} visits</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No links opened yet</p>
            )}
          </div>
        </div>

        <div>
          <QuickActions onAddLink={() => setShowLinkForm(true)} onAddFolder={() => setShowFolderForm(true)} />
        </div>
      </div>

      <Modal open={showLinkForm} onClose={() => setShowLinkForm(false)} title="Save New Link">
        <LinkForm onDone={() => setShowLinkForm(false)} />
      </Modal>

      <Modal open={showFolderForm} onClose={() => setShowFolderForm(false)} title="Create Folder">
        <FolderForm onDone={() => setShowFolderForm(false)} />
      </Modal>

      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Link">
        {editingLink && <LinkForm link={editingLink} onDone={() => setEditingLink(null)} />}
      </Modal>

      {detailLink && (
        <LinkDetailModal
          link={detailLink}
          folder={folders.find((f) => f.id === detailLink.folderId) ?? undefined}
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
