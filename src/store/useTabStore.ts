import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tab {
  id: string
  label: string
  type: 'page' | 'folder'
}

interface TabState {
  tabs: Tab[]
  activeId: string
  openTab: (tab: Tab) => void
  closeTab: (id: string) => void
  setActiveId: (id: string) => void
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [
        { id: 'dashboard', label: 'Dashboard', type: 'page' },
        { id: 'links', label: 'All Links', type: 'page' },
        { id: 'favorites', label: 'Favorites', type: 'page' },
        { id: 'archive', label: 'Archive', type: 'page' },
        { id: 'folders', label: 'Folders', type: 'page' },
      ],
      activeId: 'dashboard',

      openTab: (tab) => {
        const exists = get().tabs.find((t) => t.id === tab.id)
        if (!exists) {
          set({ tabs: [...get().tabs, tab] })
        }
        set({ activeId: tab.id })
      },

      closeTab: (id) => {
        const staticIds = ['dashboard', 'links', 'favorites', 'archive', 'folders']
        if (staticIds.includes(id)) return

        const { tabs, activeId } = get()
        const idx = tabs.findIndex((t) => t.id === id)
        const filtered = tabs.filter((t) => t.id !== id)
        let newActive = activeId
        if (activeId === id) {
          newActive = filtered[Math.min(idx, filtered.length - 1)]?.id ?? 'dashboard'
        }
        set({ tabs: filtered, activeId: newActive })
      },

      setActiveId: (id) => set({ activeId: id }),
    }),
    { name: 'linkvault-tabs' }
  )
)
