import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { FolderCard } from '@/components/folders/FolderCard'
import { Modal } from '@/components/ui/Modal'
import { FolderForm } from '@/components/folders/FolderForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFolders } from '@/store/useStore'
import type { Folder } from '@/core/types'
import { Folder as FolderIcon } from 'lucide-react'

export function FoldersPage() {
  const { folders, deleteFolder } = useFolders()
  const [showForm, setShowForm] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)

  return (
    <div>
      <Header title="Folders" onAdd={() => setShowForm(true)} addLabel="New Folder" />

      {folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onEdit={(f) => setEditingFolder(f)}
              onDelete={(f) => setDeletingFolder(f)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderIcon}
          title="No folders yet"
          description="Create your first folder to start organizing your links."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-vault-600 text-white rounded-lg text-sm font-medium hover:bg-vault-700 transition-colors cursor-pointer"
            >
              Create Folder
            </button>
          }
        />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Folder">
        <FolderForm onDone={() => setShowForm(false)} />
      </Modal>

      <Modal open={!!editingFolder} onClose={() => setEditingFolder(null)} title="Edit Folder">
        {editingFolder && <FolderForm folder={editingFolder} onDone={() => setEditingFolder(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={() => deletingFolder && deleteFolder(deletingFolder.id)}
        title="Delete Folder"
        message={`Delete "${deletingFolder?.name}" and all its links?`}
        confirmLabel="Delete"
      />
    </div>
  )
}
