import { Download, Upload } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { Button } from '@/components/ui/Button'
import { db } from '@/core/database'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import type { ExportFormat, ImportResult, Link, Folder } from '@/core/types'
import { generateId } from '@/core/utils'
import { useRef } from 'react'
import { exportLinks } from '@/core/export'

export function ImportExport() {
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const exportAll = async (format: ExportFormat) => {
    try {
      const folders = await db.folders.toArray()
      const links = await db.links.toArray()
      await exportLinks(links, folders, format)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    }
  }

  const importJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result: ImportResult = { success: 0, skipped: 0, errors: [] }

      if (data.folders) {
        for (const f of data.folders) {
          const exists = await db.folders.get(f.id)
          if (!exists) {
            await db.folders.add({ ...f, id: f.id || generateId(), updatedAt: Date.now() })
            result.success++
          } else {
            result.skipped++
          }
        }
      }

      if (data.links) {
        for (const l of data.links) {
          const exists = await db.links.get(l.id)
          if (!exists) {
            await db.links.add({ ...l, id: l.id || generateId(), updatedAt: Date.now() })
            result.success++
          } else {
            result.skipped++
          }
        }
      }

      toast.success(`Imported ${result.success} items${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`)
    } catch {
      toast.error('Import failed - invalid file')
    }
    e.target.value = ''
  }

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
      let count = 0

      type FolderName = string
      const folderCache = new Map<FolderName, string | null>()

      for (const row of rows) {
        const title = row['Title']?.trim()
        const url = row['URL']?.trim()
        if (!title || !url || !url.startsWith('http')) continue

        const existing = await db.links.where('url').equals(url).first()
        if (existing) continue

        let folderId: string | null = null
        const folderName = row['Folder']?.trim()
        if (folderName) {
          if (folderCache.has(folderName)) {
            folderId = folderCache.get(folderName)!
          } else {
            let folder = await db.folders.where('name').equals(folderName).first()
            if (!folder) {
              const newFolder: Folder = {
                id: generateId(),
                name: folderName,
                description: '',
                icon: 'folder',
                color: '#4c6ef5',
                parentId: null,
                order: await db.folders.count(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
              await db.folders.add(newFolder)
              folderId = newFolder.id
            } else {
              folderId = folder.id
            }
            folderCache.set(folderName, folderId)
          }
        }

        const tags = row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean) : []

        const link: Link = {
          id: generateId(),
          folderId,
          title,
          url,
          description: row['Description'] ?? '',
          notes: row['Notes'] ?? '',
          tags,
          customFields: [],
          isFavorite: row['Favorite'] === 'Yes' || row['Favorite'] === 'true' || row['Favorite'] === 'TRUE',
          isArchived: row['Archived'] === 'Yes' || row['Archived'] === 'true' || row['Archived'] === 'TRUE',
          visitCount: 0,
          lastOpened: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        await db.links.add(link)
        count++
      }

      toast.success(`Imported ${count} links from Excel`)
    } catch {
      toast.error('Excel import failed - check file format')
    }
    e.target.value = ''
  }

  const importHTML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      const anchors = doc.querySelectorAll('A')
      let count = 0

      for (const a of Array.from(anchors)) {
        const href = a.getAttribute('HREF')
        const title = a.textContent || 'Untitled'
        if (!href || !href.startsWith('http')) continue

        const existing = await db.links.where('url').equals(href).first()
        if (existing) continue

        const dl = a.closest('DL')
        const h3 = dl?.previousElementSibling?.textContent || ''

        let folderId: string | null = null
        if (h3 && h3 !== 'Uncategorized') {
          let folder = await db.folders.where('name').equals(h3).first()
          if (!folder) {
            const newF: Folder = {
              id: generateId(),
              name: h3,
              description: '',
              icon: 'folder',
              color: '#4c6ef5',
              parentId: null,
              order: await db.folders.count(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            await db.folders.add(newF)
            folderId = newF.id
          } else {
            folderId = folder.id
          }
          }

          const link: Link = {
            id: generateId(),
            folderId: folderId ?? null,
            title,
            url: href,
            description: '',
            notes: '',
            tags: [],
            customFields: [],
            isFavorite: false,
            isArchived: false,
            visitCount: 0,
            lastOpened: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        await db.links.add(link)
        count++
      }

      toast.success(`Imported ${count} bookmarks`)
    } catch {
      toast.error('Import failed')
    }
    e.target.value = ''
  }

  return (
    <>
      <input ref={jsonInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
      <input ref={htmlInputRef} type="file" accept=".html,.htm" onChange={importHTML} className="hidden" />
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />

      <Dropdown
        trigger={
          <Button variant="secondary" size="sm">
            <Download size={16} /> Export
          </Button>
        }
      >
        <DropdownItem onClick={() => exportAll('excel')}>Export as Excel</DropdownItem>
        <DropdownItem onClick={() => exportAll('full')}>Export All (ZIP with attachments)</DropdownItem>
      </Dropdown>

      <Dropdown
        trigger={
          <Button variant="secondary" size="sm">
            <Upload size={16} /> Import
          </Button>
        }
      >
        <DropdownItem onClick={() => jsonInputRef.current?.click()}>Import from JSON</DropdownItem>
        <DropdownItem onClick={() => excelInputRef.current?.click()}>Import from Excel</DropdownItem>
        <DropdownItem onClick={() => htmlInputRef.current?.click()}>Import Bookmarks</DropdownItem>
      </Dropdown>
    </>
  )
}
