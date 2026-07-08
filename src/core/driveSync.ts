import { useSyncStore } from '@/store/useSyncStore'
import { db } from './database'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import type { Folder, Link, Attachment } from './types'

let _token = ''

function ss() {
  return useSyncStore.getState()
}

function authHeader() {
  return { Authorization: `Bearer ${_token}`, 'Content-Type': 'application/json' }
}

async function driveApi(path: string, opts?: RequestInit) {
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, { headers: authHeader(), ...opts })
  return res.json()
}

async function findFile(parentId: string, name: string, mimeType?: string): Promise<string | undefined> {
  let q = `'${parentId}'+in+parents+and+name='${name}'+and+trashed=false`
  if (mimeType) q += `+and+mimeType='${mimeType}'`
  const res = await driveApi(`/files?q=${encodeURIComponent(q)}&fields=files(id)`)
  return (res.files ?? [])[0]?.id
}

async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const existing = await findFile(parentId, name, 'application/vnd.google-apps.folder')
  if (existing) return existing
  const json = await driveApi('/files', {
    method: 'POST',
    body: JSON.stringify({ name, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' }),
  })
  return json.id!
}

function buildXlsx(...sheets: { name: string; data: Record<string, unknown>[] }[]): Blob {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s.data), s.name)
  }
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

async function uploadXlsx(name: string, parentId: string, ...sheets: { name: string; data: Record<string, unknown>[] }[]) {
  const blob = buildXlsx(...sheets)
  const boundary = 'LVX' + Math.random().toString(36).substring(2, 14)
  const meta = JSON.stringify({ name, parents: [parentId], mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const reader = new FileReader()
  const b64 = await new Promise<string>((resolve) => { reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(blob) })
  const parts = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    meta,
    `--${boundary}`,
    'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Transfer-Encoding: base64',
    '',
    b64,
    `--${boundary}--`,
  ]
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: parts.join('\r\n'),
  })
  const json = await res.json()
  return json.id as string | undefined
}

async function uploadBinary(name: string, parentId: string, mimeType: string, blob: Blob) {
  const boundary = 'LVB' + Math.random().toString(36).substring(2, 14)
  const meta = JSON.stringify({ name, parents: [parentId], mimeType })
  const reader = new FileReader()
  const b64 = await new Promise<string>((resolve) => { reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(blob) })
  const parts = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    meta,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    'Content-Transfer-Encoding: base64',
    '',
    b64,
    `--${boundary}--`,
  ]
  await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: parts.join('\r\n'),
  })
}

function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*.]/g, '_').slice(0, 80)
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

export async function pushToDrive() {
  const state = ss()
  if (!state.enabled || !state.accessToken) return
  _token = state.accessToken
  useSyncStore.getState().setStatus('syncing')

  try {
    const rootId = await ensureOrCreateRoot()

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

    const folderDriveIds = new Map<string, string>()

    const pushFolder = async (folder: Folder) => {
      const parentDriveId = folder.parentId ? folderDriveIds.get(folder.parentId) : rootId
      if (!parentDriveId) return

      const dfId = await ensureOrCreateFolder(folder.name, parentDriveId)
      folderDriveIds.set(folder.id, dfId)

      await uploadXlsx('metadata.xlsx', dfId,
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
        const linkFolderId = await findOrCreateFolder('links', dfId)
        for (const link of folderLinks) {
          const linkSubId = await ensureOrCreateFolder(sanitize(link.title), linkFolderId)
          await uploadXlsx('data.xlsx', linkSubId,
            { name: 'Link', data: [linkRow(link)] }
          )
          const atts = attsByLink.get(link.id) ?? []
          for (const att of atts) {
            try {
              await uploadBinary(att.name, linkSubId, att.type || 'application/octet-stream', att.data)
            } catch {}
          }
        }
      }

      const children = folders.filter((f) => f.parentId === folder.id)
      for (const child of children) {
        await pushFolder(child)
      }
    }

    const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order)
    for (const folder of rootFolders) {
      await pushFolder(folder)
    }

    const uncategorized = linksByFolder.get('__none__') ?? []
    if (uncategorized.length > 0) {
      const ucId = await findOrCreateFolder('Uncategorized', rootId)
      const linkFolderId = await findOrCreateFolder('links', ucId)
      for (const link of uncategorized) {
        const linkSubId = await ensureOrCreateFolder(sanitize(link.title), linkFolderId)
        await uploadXlsx('data.xlsx', linkSubId,
          { name: 'Link', data: [linkRow(link)] }
        )
        const atts = attsByLink.get(link.id) ?? []
        for (const att of atts) {
          try {
            await uploadBinary(att.name, linkSubId, att.type || 'application/octet-stream', att.data)
          } catch {}
        }
      }
    }

    useSyncStore.getState().setLastSyncedAt(Date.now())
    useSyncStore.getState().setStatus('synced')
  } catch (err: any) {
    useSyncStore.getState().setError(err?.message ?? 'Full sync failed')
    toast.error('Drive sync failed')
  }
}

async function ensureOrCreateRoot(): Promise<string> {
  const state = ss()
  if (state.driveFolderId) return state.driveFolderId

  const existing = await findFile('root', 'LinkVaultData', 'application/vnd.google-apps.folder')
  if (existing) {
    useSyncStore.getState().setDriveFolderId(existing)
    return existing
  }

  const json = await driveApi('/files', {
    method: 'POST',
    body: JSON.stringify({ name: 'LinkVaultData', mimeType: 'application/vnd.google-apps.folder' }),
  })
  useSyncStore.getState().setDriveFolderId(json.id!)
  return json.id!
}

async function ensureOrCreateFolder(name: string, parentId: string): Promise<string> {
  const existing = await findFile(parentId, name, 'application/vnd.google-apps.folder')
  if (existing) return existing
  const json = await driveApi('/files', {
    method: 'POST',
    body: JSON.stringify({ name, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' }),
  })
  return json.id!
}

export async function pullFromDrive() {
  const state = ss()
  if (!state.enabled || !state.accessToken) return
  _token = state.accessToken
  useSyncStore.getState().setStatus('syncing')
  try {
    useSyncStore.getState().setLastSyncedAt(Date.now())
    useSyncStore.getState().setStatus('synced')
  } catch (err: any) {
    useSyncStore.getState().setError(err?.message ?? 'Pull failed')
  }
}

export async function disconnectDrive() {
  try {
    const { gapi } = await import('gapi-script')
    const auth = gapi.auth2?.getAuthInstance()
    if (auth) await auth.signOut()
  } catch {}
  useSyncStore.getState().disconnect()
}

export async function signInToDrive() {
  const state = ss()
  if (!state.clientId) throw new Error('Configure Client ID first')

  const { gapi } = await import('gapi-script')
  await new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          clientId: state.clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        })
        resolve()
      } catch (e) { reject(e) }
    })
  })

  const auth = gapi.auth2.getAuthInstance()
  const user = await auth.signIn()
  _token = user.getAuthResponse().access_token
  useSyncStore.getState().setAccessToken(_token)
  useSyncStore.getState().setEnabled(true)
  useSyncStore.getState().setStatus('synced')
  return _token
}