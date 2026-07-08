import { Home, Folder, Bookmark, Star, Archive, Plus, PanelLeftClose, PanelLeft, Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore, useFolders } from '@/store/useStore'
import { useTabStore } from '@/store/useTabStore'
import { FolderTree } from '@/components/folders/FolderTree'
import { Modal } from '@/components/ui/Modal'
import { FolderForm } from '@/components/folders/FolderForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchBar } from '@/components/ui/SearchBar'
import { useState } from 'react'
import type { Folder as FolderType } from '@/core/types'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { folders, deleteFolder } = useFolders()
  const { openTab, setActiveId } = useTabStore()
  const navigate = useNavigate()
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null)

  const navItems = [
    { id: 'dashboard', to: '/', icon: Home, label: 'Dashboard' },
    { id: 'folders', to: '/folders', icon: Folder, label: 'Folders' },
    { id: 'links', to: '/links', icon: Bookmark, label: 'All Links' },
    { id: 'favorites', to: '/favorites', icon: Star, label: 'Favorites' },
    { id: 'archive', to: '/archive', icon: Archive, label: 'Archive' },
    { id: 'getting-started', to: '/getting-started', icon: Lightbulb, label: 'How To Use' },
  ]

  const handleNav = (item: typeof navItems[0]) => {
    setActiveId(item.id)
    navigate(item.to)
  }

  return (
    <>
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-vault-600 flex items-center justify-center text-white font-bold text-sm">LV</div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">LinkVault</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5">Knowledge Hub</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="px-3 pt-3 pb-2 shrink-0">
          <SearchBar />
        </div>

        <nav className="px-3 space-y-0.5 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer text-left"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 mt-3 mb-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowFolderForm(true)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {folders.length > 0 ? (
            <FolderTree
              folders={folders}
              onEdit={(f) => setEditingFolder(f)}
              onDelete={(f) => setDeletingFolder(f)}
            />
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No folders yet</p>
          )}
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-3 top-3 z-30 p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <PanelLeft size={18} />
        </button>
      )}

      <Modal open={showFolderForm} onClose={() => setShowFolderForm(false)} title="Create Folder">
        <FolderForm onDone={() => setShowFolderForm(false)} />
      </Modal>

      <Modal open={!!editingFolder} onClose={() => setEditingFolder(null)} title="Edit Folder" size="lg">
        {editingFolder && <FolderForm folder={editingFolder} onDone={() => setEditingFolder(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={() => deletingFolder && deleteFolder(deletingFolder.id)}
        title="Delete Folder"
        message={`Delete "${deletingFolder?.name}" and all its contents (subfolders, links, attachments)?`}
        confirmLabel="Delete"
      />
    </>
  )
}
