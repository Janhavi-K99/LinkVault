import { Folder, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import type { Folder as FolderType } from '@/core/types'
import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

interface FolderCardProps {
  folder: FolderType
  onEdit: (folder: FolderType) => void
  onDelete: (folder: FolderType) => void
}

export function FolderCard({ folder, onEdit, onDelete }: FolderCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/folders/${folder.id}`)}
      className="group relative bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
          style={{ backgroundColor: folder.color }}
        >
          <Folder size={20} />
        </div>
        <Dropdown
          align="right"
          trigger={
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
              <MoreHorizontal size={16} />
            </button>
          }
        >
          <DropdownItem icon={<Pencil size={14} />} onClick={() => onEdit(folder)}>
            Edit Folder
          </DropdownItem>
          <DropdownItem icon={<Trash2 size={14} />} danger onClick={() => onDelete(folder)}>
            Delete Folder
          </DropdownItem>
        </Dropdown>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate">{folder.name}</h3>
      {folder.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{folder.description}</p>
      )}
    </div>
  )
}
