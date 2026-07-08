import { Plus, FolderPlus, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuickActionsProps {
  onAddLink: () => void
  onAddFolder: () => void
}

export function QuickActions({ onAddLink, onAddFolder }: QuickActionsProps) {
  const navigate = useNavigate()

  const actions = [
    { icon: Plus, label: 'Add Link', onClick: onAddLink, color: '#4c6ef5' },
    { icon: FolderPlus, label: 'New Folder', onClick: onAddFolder, color: '#7950f2' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: action.color }}
            >
              <action.icon size={16} />
            </div>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
