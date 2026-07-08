import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Folder, GripVertical, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import type { Folder as FolderType } from '@/core/types'
import { useFolders } from '@/store/useStore'
import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'

interface FolderDragListProps {
  folders: FolderType[]
  onEdit: (folder: FolderType) => void
  onDelete: (folder: FolderType) => void
}

export function FolderDragList({ folders, onEdit, onDelete }: FolderDragListProps) {
  const { reorderFolders } = useFolders()
  const navigate = useNavigate()

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(folders)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)
    await reorderFolders(items.map((f) => f.id))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="folders">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
            {folders.map((folder, index) => (
              <Draggable key={folder.id} draggableId={folder.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    onClick={() => navigate(`/folders/${folder.id}`)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${snapshot.isDragging ? 'bg-vault-50 shadow-md' : 'hover:bg-gray-100'}`}
                  >
                    <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: folder.color }}>
                      <Folder size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
                      {folder.description && (
                        <p className="text-xs text-gray-500 truncate">{folder.description}</p>
                      )}
                    </div>
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <MoreHorizontal size={14} />
                        </button>
                      }
                    >
                      <DropdownItem icon={<Pencil size={14} />} onClick={() => onEdit(folder)}>Edit</DropdownItem>
                      <DropdownItem icon={<Trash2 size={14} />} danger onClick={() => onDelete(folder)}>Delete</DropdownItem>
                    </Dropdown>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
