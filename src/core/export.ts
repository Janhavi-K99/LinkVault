import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import type { ExportFormat, Link, Folder, Attachment } from '@/core/types'
import { db } from '@/core/database'
import { bufferToBlob } from '@/core/utils'

function sanitize(name: string) {
  return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 80)
}

function buildExcelBlob(links: Link[], folders: Folder[], attMap?: Map<string, Attachment[]>) {
  const rows = links.map((l) => {
    const atts = attMap?.get(l.id)
    return {
      Title: l.title,
      URL: l.url,
      Description: l.description,
      Notes: l.notes,
      Tags: l.tags.join(', '),
      Attachments: atts && atts.length > 0 ? atts.map((a) => a.name).join(', ') : '',
      Folder: folders.find((f) => f.id === l.folderId)?.name ?? '',
      Favorite: l.isFavorite,
      Archived: l.isArchived,
      Created: new Date(l.createdAt),
      'Visit Count': l.visitCount ?? 0,
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Links')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function exportLinks(links: Link[], folders: Folder[], format: ExportFormat) {
  const linkIds = links.map((l) => l.id)
  const allAtts = await db.attachments.where('linkId').anyOf(linkIds).toArray()
  const attMap = new Map<string, Attachment[]>()
  for (const att of allAtts) {
    if (!attMap.has(att.linkId)) attMap.set(att.linkId, [])
    attMap.get(att.linkId)!.push(att)
  }

  switch (format) {
    case 'excel': {
      const blob = buildExcelBlob(links, folders, attMap)
      saveAs(blob, `linkvault-export-${Date.now()}.xlsx`)
      break
    }
    case 'full': {
      const zip = new JSZip()
      zip.file('export.xlsx', buildExcelBlob(links, folders, attMap))

      const attFolder = zip.folder('attachments')
      if (attFolder) {
        for (const link of links) {
          const linkAtts = attMap.get(link.id)
          if (!linkAtts || linkAtts.length === 0) continue
          const sub = attFolder.folder(sanitize(link.title))
          if (sub) {
            for (const att of linkAtts) {
              sub.file(`${att.id}-${att.name}`, bufferToBlob(att.data, att.type))
            }
          }
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `linkvault-full-export-${Date.now()}.zip`)
      break
    }
  }
}
