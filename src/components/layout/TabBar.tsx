import { Home, Bookmark, Star, Archive, Folder as FolderIcon, X } from 'lucide-react'
import { useTabStore } from '@/store/useTabStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const pageIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  dashboard: Home,
  links: Bookmark,
  favorites: Star,
  archive: Archive,
  folders: FolderIcon,
}

const pageRoutes: Record<string, string> = {
  dashboard: '/',
  links: '/links',
  favorites: '/favorites',
  archive: '/archive',
  folders: '/folders',
}

const routeToPage: Record<string, string> = {
  '/': 'dashboard',
  '/links': 'links',
  '/favorites': 'favorites',
  '/archive': 'archive',
  '/folders': 'folders',
}

export function TabBar() {
  const { tabs, activeId, openTab, closeTab, setActiveId } = useTabStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const pageId = routeToPage[location.pathname]
    if (pageId) {
      setActiveId(pageId)
    } else if (location.pathname.startsWith('/folders/')) {
      const folderId = location.pathname.split('/folders/')[1]
      if (folderId) {
        const existing = tabs.find((t) => t.id === folderId)
        if (existing) {
          setActiveId(folderId)
        }
      }
    }
  }, [location.pathname, tabs, setActiveId])

  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveId(tab.id)
    if (tab.type === 'page') {
      navigate(pageRoutes[tab.id] ?? '/')
    } else {
      navigate(`/folders/${tab.id}`)
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.type === 'folder' ? FolderIcon : (pageIcons[tab.id] ?? FolderIcon)
            const isFolder = tab.type === 'folder'

            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`group flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer select-none ${
                  activeId === tab.id
                    ? 'border-vault-600 text-vault-700 bg-vault-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                <span className="truncate max-w-28">{tab.label}</span>
                {isFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const nextId = tabs.length > 1
                        ? tabs.find((t) => t.id !== tab.id)?.id ?? 'dashboard'
                        : 'dashboard'
                      closeTab(tab.id)
                      const nextTab = tabs.find((t) => t.id === nextId)
                      if (nextTab) handleTabClick(nextTab)
                    }}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
