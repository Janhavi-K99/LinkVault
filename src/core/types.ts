export interface Folder {
  id: string
  name: string
  description: string
  icon: string
  color: string
  parentId: string | null
  order: number
  createdAt: number
  updatedAt: number
}

export interface Attachment {
  id: string
  linkId: string
  name: string
  type: string
  size: number
  data: ArrayBuffer
  createdAt: number
}

export interface CustomField {
  key: string
  value: string
}

export interface Link {
  id: string
  folderId: string | null
  title: string
  url: string
  description: string
  notes: string
  tags: string[]
  customFields: CustomField[]
  isFavorite: boolean
  isArchived: boolean
  visitCount: number
  lastOpened: number | null
  createdAt: number
  updatedAt: number
}

export type SortField = 'createdAt' | 'updatedAt' | 'title' | 'lastOpened' | 'visitCount'
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  order: SortOrder
}

export interface LinkFilters {
  folderId: string | null
  search: string
  tags: string[]
  isFavorite: boolean | null
  isArchived: boolean | null
  sort: SortConfig
}

export interface DashboardStats {
  totalFolders: number
  totalLinks: number
  favoriteCount: number
  archivedCount: number
  recentLinks: Link[]
  recentOpened: Link[]
}

export type ExportFormat = 'excel' | 'full'

export interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export type FormFieldId = 'description' | 'notes' | 'tags' | 'folder' | 'favorite' | 'attachments' | 'customFields'

export interface FormFieldConfig {
  id: FormFieldId
  label: string
  enabled: boolean
}
