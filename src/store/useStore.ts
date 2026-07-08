import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder, Link, Attachment, SortConfig, LinkFilters } from '@/core/types'
import { generateId, readFileAsBuffer } from '@/core/utils'
import { db } from '@/core/database'
import { liveQuery } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useSyncStore } from '@/store/useSyncStore'
import { syncToFolder } from '@/core/fileSync'

function autoSync() {
  const state = useSyncStore.getState()
  if (state.enabled && state.rootHandle) {
    syncToFolder()
  }
}

interface UIState {
  sidebarOpen: boolean
  linkDetailId: string | null
  searchQuery: string
  selectedFolderId: string | null
  viewMode: 'grid' | 'list'
  sortConfig: SortConfig
  toggleSidebar: () => void
  setLinkDetail: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setSelectedFolderId: (id: string | null) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSortConfig: (config: SortConfig) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      linkDetailId: null,
      searchQuery: '',
      selectedFolderId: null,
      viewMode: 'list',
      sortConfig: { field: 'createdAt', order: 'desc' },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setLinkDetail: (id) => set({ linkDetailId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedFolderId: (id) => set({ selectedFolderId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortConfig: (config) => set({ sortConfig: config }),
    }),
    {
      name: 'linkvault-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
        sortConfig: state.sortConfig,
      }),
    }
  )
)

export function useFolders() {
  const folders = useLiveQuery(() => db.folders.orderBy('order').toArray()) ?? []

  const getChildren = (parentId: string | null): Folder[] =>
    folders.filter((f) => f.parentId === parentId).sort((a, b) => a.order - b.order)

  const buildTree = (parentId: string | null): (Folder & { children: (Folder & { children: Folder[] })[] })[] =>
    getChildren(parentId).map((f) => ({ ...f, children: buildTree(f.id) }))

  const getDescendantIds = (id: string): string[] => {
    const children = getChildren(id)
    return [id, ...children.flatMap((c) => getDescendantIds(c.id))]
  }

  const addFolder = async (data: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const siblings = folders.filter((f) => f.parentId === (data.parentId ?? null))
    const folder: Folder = {
      ...data,
      id: generateId(),
      parentId: data.parentId ?? null,
      order: siblings.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.folders.add(folder)
    autoSync()
    return folder
  }

  const updateFolder = async (id: string, data: Partial<Folder>) => {
    await db.folders.update(id, { ...data, updatedAt: Date.now() })
    autoSync()
  }

  const deleteFolder = async (id: string) => {
    await db.transaction('rw', [db.folders, db.links, db.attachments], async () => {
      const allIds = getDescendantIds(id)
      const childFolders = allIds.slice(1)
      for (const fid of childFolders) {
        await db.folders.delete(fid)
      }
      await db.folders.delete(id)
      const linksInFolder = await db.links.where('folderId').anyOf(allIds).toArray()
      const linkIds = linksInFolder.map((l) => l.id)
      await db.links.bulkDelete(linkIds)
      for (const lid of linkIds) {
        await db.attachments.where('linkId').equals(lid).delete()
      }
    })
    autoSync()
  }

  const reorderFolders = async (orderedIds: string[]) => {
    await db.transaction('rw', db.folders, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.folders.update(orderedIds[i], { order: i, updatedAt: Date.now() })
      }
    })
    autoSync()
  }

  const moveFolder = async (id: string, newParentId: string | null) => {
    const descIds = getDescendantIds(id)
    if (newParentId && descIds.includes(newParentId)) return
    await db.folders.update(id, { parentId: newParentId, updatedAt: Date.now() })
    autoSync()
  }

  const duplicateFolder = async (id: string) => {
    await db.transaction('rw', [db.folders, db.links, db.attachments], async () => {
      const allIds = getDescendantIds(id)
      const oldToNew = new Map<string, string>()

      const dupFolder = async (fid: string, newParentId: string | null) => {
        const original = await db.folders.get(fid)
        if (!original) return
        const newId = generateId()
        oldToNew.set(fid, newId)
        const copy: Folder = {
          ...original,
          id: newId,
          parentId: newParentId,
          name: fid === id ? `${original.name} (Copy)` : original.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        await db.folders.add(copy)

        const children = await db.folders.where('parentId').equals(fid).toArray()
        for (const child of children) {
          if (allIds.includes(child.id)) {
            await dupFolder(child.id, newId)
          }
        }

        const links = await db.links.where('folderId').equals(fid).toArray()
        for (const link of links) {
          const newLinkId = generateId()
          await db.links.add({
            ...link,
            id: newLinkId,
            folderId: newId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            visitCount: 0,
            lastOpened: null,
          })
          const atts = await db.attachments.where('linkId').equals(link.id).toArray()
          for (const att of atts) {
            await db.attachments.add({
              ...att,
              id: generateId(),
              linkId: newLinkId,
              data: att.data.slice(0),
              createdAt: Date.now(),
            })
          }
        }
      }

      await dupFolder(id, null)
    })
    autoSync()
  }

  return { folders, getChildren, buildTree, getDescendantIds, addFolder, updateFolder, deleteFolder, reorderFolders, moveFolder, duplicateFolder }
}

export function useLinks(folderId?: string | null) {
  const [links, setLinks] = useState<Link[]>([])
  const { sortConfig } = useUIStore()

  useEffect(() => {
    const observable = folderId
      ? liveQuery(() => db.links.where({ folderId }).toArray())
      : liveQuery(() => db.links.toArray())

    const sub = observable.subscribe({
      next: (result) => {
        const sorted = [...result].sort((a, b) => {
          const field = sortConfig.field
          const order = sortConfig.order === 'desc' ? -1 : 1
          const aVal = a[field] ?? ''
          const bVal = b[field] ?? ''
          if (typeof aVal === 'string') {
            return aVal.localeCompare(bVal as string) * order
          }
          return ((aVal as number) - (bVal as number)) * order
        })
        setLinks(sorted)
      },
    })
    return () => sub.unsubscribe()
  }, [folderId, sortConfig])

  const addLink = async (data: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'visitCount' | 'lastOpened'>) => {
    const link: Link = {
      ...data,
      id: generateId(),
      visitCount: 0,
      lastOpened: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.links.add(link)
    autoSync()
    return link
  }

  const addLinkWithFiles = async (
    data: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'visitCount' | 'lastOpened'>,
    files: File[]
  ) => {
    const link = await addLink(data)
    for (const file of files) {
      const { default: toast } = await import('react-hot-toast')
      const buffer = await readFileAsBuffer(file)
      const att: Attachment = {
        id: generateId(),
        linkId: link.id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: buffer,
        createdAt: Date.now(),
      }
      await db.attachments.add(att)
    }
    autoSync()
    return link
  }

  const updateLink = async (id: string, data: Partial<Link>) => {
    await db.links.update(id, { ...data, updatedAt: Date.now() })
    autoSync()
  }

  const deleteLink = async (id: string) => {
    await db.transaction('rw', [db.links, db.attachments], async () => {
      await db.links.delete(id)
      await db.attachments.where('linkId').equals(id).delete()
    })
    autoSync()
  }

  const deleteLinks = async (ids: string[]) => {
    await db.transaction('rw', [db.links, db.attachments], async () => {
      await db.links.bulkDelete(ids)
      for (const id of ids) {
        await db.attachments.where('linkId').equals(id).delete()
      }
    })
    autoSync()
  }

  const duplicateLink = async (id: string) => {
    const original = await db.links.get(id)
    if (!original) return
    const newId = generateId()
    const dup: Link = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visitCount: 0,
      lastOpened: null,
    }
    await db.transaction('rw', [db.links, db.attachments], async () => {
      await db.links.add(dup)
      const attachments = await db.attachments.where('linkId').equals(id).toArray()
      for (const att of attachments) {
        await db.attachments.add({
          ...att,
          id: generateId(),
          linkId: newId,
          data: att.data.slice(0),
          createdAt: Date.now(),
        })
      }
    })
    autoSync()
    return dup
  }

  const moveLinks = async (ids: string[], targetFolderId: string | null) => {
    await db.transaction('rw', db.links, async () => {
      for (const id of ids) {
        await db.links.update(id, { folderId: targetFolderId, updatedAt: Date.now() })
      }
    })
    autoSync()
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

  const toggleFavorite = async (id: string) => {
    const link = await db.links.get(id)
    if (!link) return
    await db.links.update(id, { isFavorite: !link.isFavorite, updatedAt: Date.now() })
    autoSync()
  }

  const toggleArchive = async (id: string) => {
    const link = await db.links.get(id)
    if (!link) return
    await db.links.update(id, { isArchived: !link.isArchived, updatedAt: Date.now() })
    autoSync()
  }

  return {
    links,
    addLink,
    updateLink,
    deleteLink,
    deleteLinks,
    duplicateLink,
    moveLinks,
    openLink,
    toggleFavorite,
    toggleArchive,
  }
}

export function useAllLinks() {
  const links = useLiveQuery(() => db.links.toArray()) ?? []
  return links
}

export function useFavoriteLinks() {
  const links = useLiveQuery(() => db.links.where('isFavorite').equals(1).toArray()) ?? []
  return links
}

export function useArchivedLinks() {
  const links = useLiveQuery(() => db.links.where('isArchived').equals(1).toArray()) ?? []
  return links
}

export function useDashboardStats() {
  const folders = useLiveQuery(() => db.folders.toArray()) ?? []
  const allLinks = useLiveQuery(() => db.links.toArray()) ?? []

  const now = Date.now()
  const recentLinks = [...allLinks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  const recentOpened = [...allLinks]
    .filter((l) => l.lastOpened)
    .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0))
    .slice(0, 5)

  return {
    totalFolders: folders.length,
    totalLinks: allLinks.length,
    favoriteCount: allLinks.filter((l) => l.isFavorite).length,
    archivedCount: allLinks.filter((l) => l.isArchived).length,
    recentLinks,
    recentOpened,
  }
}

export function useSearch(query: string) {
  const allLinks = useAllLinks()
  const { folders } = useFolders()

  if (!query.trim()) return { linkResults: [], folderResults: [] }

  const q = query.toLowerCase()
  const linkResults = allLinks.filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q))
  )

  const folderResults = folders.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
  )

  return { linkResults, folderResults }
}
