import { Badge } from '@/components/ui/Badge'
import { tagColor } from '@/core/utils'
import { X } from 'lucide-react'

interface TagFilterProps {
  allTags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
  onClear: () => void
}

export function TagFilter({ allTags, selectedTags, onToggle, onClear }: TagFilterProps) {
  if (allTags.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`cursor-pointer transition-all ${selectedTags.includes(tag) ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
        >
          <Badge color={tagColor(tag)}>{tag}</Badge>
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 cursor-pointer">
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}
