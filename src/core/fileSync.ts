import { useSyncStore } from '@/store/useSyncStore'
import { db } from './database'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import type { Folder, Link, Attachment } from './types'
import { bufferToBlob } from './utils'

function getStore() {
  return useSyncStore.getState()
}

function buildXlsx(...sheets: { name: string; data: Record<string, unknown>[] }[]): Blob {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s.data), s.name)
  }
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

async function getDir(handle: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
  return handle.getDirectoryHandle(name, { create: true })
}

async function getOrCreateDir(parent: FileSystemDirectoryHandle, name: string): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true })
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, blob: Blob) {
  const fileHandle = await dir.getFileHandle(sanitize(name), { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

async function writeXlsx(dir: FileSystemDirectoryHandle, name: string, ...sheets: { name: string; data: Record<string, unknown>[] }[]) {
  await writeFile(dir, name, buildXlsx(...sheets))
}

function sanitize(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  const ext = dotIndex >= 0 ? name.slice(dotIndex) : ''
  const base = dotIndex >= 0 ? name.slice(0, dotIndex) : name
  const clean = base.replace(/[<>:"/\\|?*]/g, '_').slice(0, 80 - ext.length)
  return clean + ext
}

function linkRow(link: Link) {
  return {
    Title: link.title,
    URL: link.url,
    Description: link.description,
    Notes: link.notes,
    Tags: link.tags.join(', '),
    'Custom Fields': link.customFields.map((f) => `${f.key}: ${f.value}`).join('; '),
    Favorite: link.isFavorite ? 'Yes' : 'No',
    Archived: link.isArchived ? 'Yes' : 'No',
    'Visit Count': link.visitCount ?? 0,
    Created: new Date(link.createdAt).toISOString(),
    Updated: new Date(link.updatedAt).toISOString(),
  }
}

export async function pickSyncFolder() {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'linkvault' })
    useSyncStore.getState().setRootHandle(handle)
    useSyncStore.getState().setEnabled(true)
    useSyncStore.getState().setStatus('synced')
    toast.success('Sync folder selected!')
    return handle
  } catch {
    return null
  }
}

export async function syncToFolder() {
  const store = getStore()
  if (!store.enabled || !store.rootHandle) return

  useSyncStore.getState().setStatus('syncing')

  try {
    const root = store.rootHandle
    const folders = await db.folders.toArray()
    const links = await db.links.toArray()
    const allAtts = await db.attachments.toArray()

    const attsByLink = new Map<string, Attachment[]>()
    for (const a of allAtts) {
      if (!attsByLink.has(a.linkId)) attsByLink.set(a.linkId, [])
      attsByLink.get(a.linkId)!.push(a)
    }

    const linksByFolder = new Map<string, Link[]>()
    for (const l of links) {
      const key = l.folderId ?? '__none__'
      if (!linksByFolder.has(key)) linksByFolder.set(key, [])
      linksByFolder.get(key)!.push(l)
    }

    const folderDirHandles = new Map<string, FileSystemDirectoryHandle>()

    const syncFolder = async (folder: Folder) => {
      const parentDir = folder.parentId ? folderDirHandles.get(folder.parentId) : root
      if (!parentDir) return

      const dir = await getOrCreateDir(parentDir, folder.name)
      folderDirHandles.set(folder.id, dir)

      await writeXlsx(dir, 'metadata.xlsx',
        { name: 'Info', data: [{
          Name: folder.name,
          Description: folder.description,
          Icon: folder.icon,
          Color: folder.color,
          Created: new Date(folder.createdAt).toISOString(),
          Updated: new Date(folder.updatedAt).toISOString(),
        }]}
      )

      const folderLinks = linksByFolder.get(folder.id) ?? []
      if (folderLinks.length > 0) {
        const linkDir = await getOrCreateDir(dir, 'links')
        for (const link of folderLinks) {
          const linkSubDir = await getOrCreateDir(linkDir, sanitize(link.title))
          await writeXlsx(linkSubDir, 'data.xlsx',
            { name: 'Link', data: [linkRow(link)] }
          )
          const atts = attsByLink.get(link.id) ?? []
          for (const att of atts) {
            try {
              await writeFile(linkSubDir, sanitize(att.name), bufferToBlob(att.data, att.type))
            } catch {}
          }
        }
      }

      const children = folders.filter((f) => f.parentId === folder.id)
      for (const child of children) {
        await syncFolder(child)
      }
    }

    const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order)
    for (const folder of rootFolders) {
      await syncFolder(folder)
    }

    const uncategorized = linksByFolder.get('__none__') ?? []
    if (uncategorized.length > 0) {
      const ucDir = await getOrCreateDir(root, 'Uncategorized')
      const linkDir = await getOrCreateDir(ucDir, 'links')
      for (const link of uncategorized) {
        const linkSubDir = await getOrCreateDir(linkDir, sanitize(link.title))
        await writeXlsx(linkSubDir, 'data.xlsx',
          { name: 'Link', data: [linkRow(link)] }
        )
        const atts = attsByLink.get(link.id) ?? []
for (const att of atts) {
            try {
              await writeFile(linkSubDir, sanitize(att.name), bufferToBlob(att.data, att.type))
            } catch {}
          }
      }
    }

    useSyncStore.getState().setLastSyncedAt(Date.now())
    useSyncStore.getState().setStatus('synced')
  } catch (err: any) {
    useSyncStore.getState().setError(err?.message ?? 'Sync failed')
    toast.error('Sync to folder failed')
  }
}

export async function disconnectSyncFolder() {
  useSyncStore.getState().disconnect()
}