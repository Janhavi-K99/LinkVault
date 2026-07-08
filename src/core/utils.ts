import { format, formatDistanceToNow } from 'date-fns'

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy')
}

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
}

export function formatRelative(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export function tagColor(tag: string): string {
  const colors = [
    '#4c6ef5', '#7950f2', '#e64980', '#f76707', '#fab005',
    '#40c057', '#15aabf', '#1c7ed6', '#ae3ec9', '#fd7e14',
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export function bufferToBlob(data: ArrayBuffer, type: string): Blob {
  return new Blob([data], { type })
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
