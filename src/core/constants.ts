export const FOLDER_ICONS = [
  'folder', 'bookmark', 'star', 'heart', 'book', 'globe', 'code',
  'video', 'file-text', 'graduation-cap', 'briefcase', 'image',
  'music', 'map-pin', 'shopping-cart', 'settings', 'users',
  'award', 'compass', 'layers',
] as const

export const FOLDER_COLORS = [
  '#4c6ef5', '#7950f2', '#e64980', '#f76707', '#fab005',
  '#40c057', '#15aabf', '#1c7ed6', '#ae3ec9', '#fd7e14',
  '#20c997', '#74b816', '#f06595', '#845ef7', '#339af0',
] as const

export const TAG_COLORS: Record<string, string> = {
  'javascript': '#f7df1e',
  'typescript': '#3178c6',
  'react': '#61dafb',
  'python': '#3776ab',
  'tutorial': '#40c057',
  'article': '#4c6ef5',
  'video': '#e64980',
  'github': '#24292e',
  'design': '#be4bdb',
  'reference': '#15aabf',
}

export const DEFAULT_FOLDER_ICON = 'folder'
export const DEFAULT_FOLDER_COLOR = '#4c6ef5'

export const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'A-Z' },
  { value: 'title-desc', label: 'Z-A' },
  { value: 'lastOpened-desc', label: 'Recently Opened' },
  { value: 'visitCount-desc', label: 'Most Visited' },
] as const

export const APP_NAME = 'LinkVault'
export const APP_TAGLINE = 'Personal Knowledge Hub'
