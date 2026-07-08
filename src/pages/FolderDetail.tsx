import { useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { useFolders, useLinks, useUIStore } from '@/store/useStore'
import { useSelection } from '@/store/useSelection'
import { LinkListItem } from '@/components/links/LinkListItem'
import { LinkForm } from '@/components/links/LinkForm'
import { LinkDetailModal } from '@/components/links/LinkDetailModal'
import { FolderCard } from '@/components/folders/FolderCard'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { SortSelector } from '@/components/features/SortSelector'
import { BulkActions } from '@/components/links/BulkActions'
import { FolderForm } from '@/components/folders/FolderForm'
import type { Link as LinkType, Folder as FolderType } from '@/core/types'
import { Folder, BookmarkPlus, ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

function FolderBreadcrumb({ folderId, folders }: { folderId: string; folders: FolderType[] }) {
  const crumbs: FolderType[] = []
  let current = folders.find((f) => f.id === folderId)
  while (current) {
    crumbs.unshift(current)
    current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined
  }
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
      <RouterLink to="/folders" className="hover:text-vault-600 transition-colors">Folders</RouterLink>
      {crumbs.map((f) => (
        <span key={f.id} className="flex items-center gap-1">
          <ChevronRight size={12} />
          <RouterLink to={`/folders/${f.id}`} className={`hover:text-vault-600 transition-colors ${f.id === folderId ? 'text-gray-900 font-medium' : ''}`}>
            {f.name}
          </RouterLink>
        </span>
      ))}
    </div>
  )
}

export function FolderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { folders, getChildren, deleteFolder } = useFolders()
  const folder = folders.find((f) => f.id === id)
  const subfolders = getChildren(id!)
  const { links, addLink, updateLink, deleteLink, deleteLinks, duplicateLink, toggleFavorite, toggleArchive, openLink, moveLinks } = useLinks(id)
  const { searchQuery } = useUIStore()
  const { clear } = useSelection()

  const [showLinkForm, setShowLinkForm] = useState(false)
  const [detailLink, setDetailLink] = useState<LinkType | null>(null)
  const [editingLink, setEditingLink] = useState<LinkType | null>(null)
  const [deletingLink, setDeletingLink] = useState<LinkType | null>(null)
  const [editingSubfolder, setEditingSubfolder] = useState<FolderType | null>(null)
  const [deletingSubfolder, setDeletingSubfolder] = useState<FolderType | null>(null)
  const [showSubfolderForm, setShowSubfolderForm] = useState(false)

  if (!folder) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Folder not found</p>
        <button onClick={() => navigate('/folders')} className="mt-2 text-vault-600 hover:underline text-sm cursor-pointer">
          Back to folders
        </button>
      </div>
    )
  }

  const filtered = links.filter((l) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      l.title.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const handleOpen = async (link: LinkType) => {
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
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/folders')} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
          <ChevronLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: folder.color }}>
          <Folder size={20} />
        </div>
        <div className="flex-1">
          <FolderBreadcrumb folderId={folder.id} folders={folders} />
          <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
          {folder.description && <p className="text-sm text-gray-500">{folder.description}</p>}
        </div>
      </div>

      {/* SUBFOLDERS */}
      {subfolders.length > 0 && (
        <div className="mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subfolders ({subfolders.length})</h3>
            <button
              onClick={() => setShowSubfolderForm(true)}
              className="text-xs text-vault-600 hover:text-vault-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> New Subfolder
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subfolders.map((sf) => (
              <FolderCard
                key={sf.id}
                folder={sf}
                onEdit={(f) => setEditingSubfolder(f)}
                onDelete={(f) => setDeletingSubfolder(f)}
              />
            ))}
          </div>
        </div>
      )}

      {subfolders.length === 0 && (
        <div className="mt-4 mb-4">
          <button
            onClick={() => setShowSubfolderForm(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-vault-600 hover:border-vault-300 hover:bg-vault-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Subfolder
          </button>
        </div>
      )}

      {/* SEARCH + SORT + ADD LINK */}
      <div className="flex items-center gap-3 my-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in folder..."
            onChange={(e) => useUIStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none transition-all"
          />
        </div>
        <SortSelector />
        <button
          onClick={() => setShowLinkForm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-vault-600 text-white rounded-lg text-sm font-medium hover:bg-vault-700 transition-colors cursor-pointer"
        >
          <BookmarkPlus size={16} /> Add Link
        </button>
      </div>

      <BulkActions onDelete={handleBulkDelete} onMove={handleBulkMove} />

      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.map((link) => (
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
          icon={BookmarkPlus}
          title={searchQuery ? 'No results found' : 'No links in this folder'}
          description={searchQuery ? 'Try a different search term' : 'Add your first link to this folder'}
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

      {/* MODALS */}
      <Modal open={showLinkForm} onClose={() => setShowLinkForm(false)} title="Add Link">
        <LinkForm folderId={folder.id} onDone={() => setShowLinkForm(false)} />
      </Modal>

      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title="Edit Link">
        {editingLink && <LinkForm link={editingLink} folderId={folder.id} onDone={() => setEditingLink(null)} />}
      </Modal>

      <Modal open={showSubfolderForm} onClose={() => setShowSubfolderForm(false)} title="New Subfolder">
        <FolderForm defaultParentId={folder.id} onDone={() => setShowSubfolderForm(false)} />
      </Modal>

      <Modal open={!!editingSubfolder} onClose={() => setEditingSubfolder(null)} title="Edit Subfolder">
        {editingSubfolder && <FolderForm folder={editingSubfolder} onDone={() => setEditingSubfolder(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deletingSubfolder}
        onClose={() => setDeletingSubfolder(null)}
        onConfirm={() => deletingSubfolder && deleteFolder(deletingSubfolder.id)}
        title="Delete Subfolder"
        message={`Delete "${deletingSubfolder?.name}" and all its contents?`}
        confirmLabel="Delete"
      />

      {detailLink && (
        <LinkDetailModal
          link={detailLink}
          folder={folder}
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
