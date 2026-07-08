import { Search, LayoutGrid, List, Plus } from 'lucide-react'
import { useUIStore } from '@/store/useStore'
import { Button } from '@/components/ui/Button'
import { ImportExport } from '@/components/features/ImportExport'
import { SyncFolderSetup } from '@/components/features/DriveSyncSetup'

interface HeaderProps {
  title: string
  onAdd?: () => void
  addLabel?: string
  showViewToggle?: boolean
}

export function Header({ title, onAdd, addLabel, showViewToggle }: HeaderProps) {
  const { viewMode, setViewMode } = useUIStore()

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <SyncFolderSetup />
        {showViewToggle && (
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}
        <ImportExport />
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus size={16} /> {addLabel || 'Add'}
          </Button>
        )}
      </div>
    </div>
  )
}
