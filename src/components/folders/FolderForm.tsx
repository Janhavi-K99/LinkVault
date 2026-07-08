import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { FOLDER_ICONS, FOLDER_COLORS, DEFAULT_FOLDER_ICON, DEFAULT_FOLDER_COLOR } from '@/core/constants'
import type { Folder } from '@/core/types'
import { Folder as FolderIcon, Bookmark, Star, Heart, Book, Globe, Code, Video, FileText, GraduationCap, Briefcase, Image, Music, MapPin, ShoppingCart, Settings, Users, Award, Compass, Layers } from 'lucide-react'
import { useFolders } from '@/store/useStore'
import { toast } from 'react-hot-toast'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  folder: FolderIcon,
  bookmark: Bookmark,
  star: Star,
  heart: Heart,
  book: Book,
  globe: Globe,
  code: Code,
  video: Video,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  image: Image,
  music: Music,
  'map-pin': MapPin,
  'shopping-cart': ShoppingCart,
  settings: Settings,
  users: Users,
  award: Award,
  compass: Compass,
  layers: Layers,
}

interface FolderFormProps {
  folder?: Folder
  defaultParentId?: string
  onDone: () => void
}

function buildParentOptions(folders: Folder[], excludeId?: string, parentId: string | null = null, depth = 0): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = []
  const children = folders.filter((f) => f.parentId === parentId && f.id !== excludeId).sort((a, b) => a.order - b.order)
  for (const f of children) {
    result.push({ value: f.id, label: `${'  '.repeat(depth)}${f.name}` })
    result.push(...buildParentOptions(folders, excludeId, f.id, depth + 1))
  }
  return result
}

export function FolderForm({ folder, defaultParentId, onDone }: FolderFormProps) {
  const { folders, addFolder, updateFolder } = useFolders()
  const [name, setName] = useState(folder?.name ?? '')
  const [description, setDescription] = useState(folder?.description ?? '')
  const [icon, setIcon] = useState<string>(folder?.icon ?? DEFAULT_FOLDER_ICON)
  const [color, setColor] = useState(folder?.color ?? DEFAULT_FOLDER_COLOR)
  const [parentId, setParentId] = useState<string>(folder?.parentId ?? defaultParentId ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (folder) {
        await updateFolder(folder.id, { name: name.trim(), description: description.trim(), icon, color, parentId: parentId || null })
        toast.success('Folder updated')
      } else {
        await addFolder({ name: name.trim(), description: description.trim(), icon, color, parentId: parentId || null })
        toast.success('Folder created')
      }
      onDone()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const IconComponent = iconMap[icon] ?? FolderIcon
  const parentOptions = buildParentOptions(folders, folder?.id)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" required autoFocus />

      <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this folder for?" />

      <Select
        label="Parent Folder"
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
        options={parentOptions}
        placeholder="No parent (root folder)"
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Icon</label>
        <div className="flex flex-wrap gap-2">
          {FOLDER_ICONS.map((ic) => {
            const Comp = iconMap[ic] ?? FolderIcon
            return (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${icon === ic ? 'border-vault-500 bg-vault-50 text-vault-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                title={ic}
              >
                <Comp size={16} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <div className="flex flex-wrap gap-2">
          {FOLDER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-vault-500 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
          <IconComponent size={18} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-gray-900">{name || 'Folder Name'}</p>
          <p className="text-xs text-gray-500">{description || 'Folder description'}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          {folder ? 'Save Changes' : 'Create Folder'}
        </Button>
      </div>
    </form>
  )
}
