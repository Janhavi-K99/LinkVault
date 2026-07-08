import Dexie, { type EntityTable } from 'dexie'
import type { Folder, Link, Attachment } from './types'

class LinkVaultDB extends Dexie {
  folders!: EntityTable<Folder, 'id'>
  links!: EntityTable<Link, 'id'>
  attachments!: EntityTable<Attachment, 'id'>

  constructor() {
    super('LinkVaultDB')
    this.version(2).stores({
      folders: 'id, name, order',
      links: 'id, folderId, title, isFavorite, isArchived, createdAt, lastOpened, *tags',
      attachments: 'id, linkId',
    })
  }
}

export const db = new LinkVaultDB()
