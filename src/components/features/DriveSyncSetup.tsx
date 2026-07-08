import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useSyncStore } from '@/store/useSyncStore'
import { pickSyncFolder, disconnectSyncFolder } from '@/core/fileSync'
import { toast } from 'react-hot-toast'
import { Folder as FolderIcon, FolderOpen, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export function SyncFolderSetup() {
  const { enabled, status, lastSyncedAt } = useSyncStore()
  const [open, setOpen] = useState(false)

  const iconMap: Record<string, typeof FolderIcon> = {
    disconnected: FolderIcon,
    syncing: RefreshCw,
    synced: CheckCircle,
    error: AlertCircle,
  }
  const colorMap: Record<string, string> = {
    disconnected: 'text-gray-400',
    syncing: 'text-blue-500',
    synced: 'text-green-500',
    error: 'text-red-500',
  }
  const Icon = iconMap[status] ?? FolderIcon

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
          enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
        }`}
        title={enabled && lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}` : 'Sync to folder'}
      >
        <Icon size={14} className={`${colorMap[status]} ${status === 'syncing' ? 'animate-spin' : ''}`} />
        <span>{enabled ? (status === 'synced' ? 'Synced' : status === 'error' ? 'Error' : 'Syncing...') : 'Sync Off'}</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Sync Settings" size="sm">
        <div className="space-y-4">
          {enabled ? (
            <>
              <p className="text-sm text-gray-600">Syncing to your chosen folder automatically on every change.</p>
              {lastSyncedAt && <p className="text-xs text-gray-400">Last synced: {new Date(lastSyncedAt).toLocaleString()}</p>}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <p className="font-medium">Folder will have this structure:</p>
                <pre className="text-xs mt-1 text-green-700">
{`📁 FolderName/
├── metadata.xlsx
└── links/
    └── Link Title/
        ├── data.xlsx
        └── attachments...`}
                </pre>
              </div>
              <Button variant="danger" onClick={() => { disconnectSyncFolder(); toast.success('Sync disconnected'); setOpen(false) }}>
                <FolderOpen size={16} /> Disconnect
              </Button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium">How it works:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-blue-700 text-xs">
                  <li>Click "Pick a folder" below</li>
                  <li>Choose any folder (OneDrive, Google Drive desktop, Dropbox, USB, etc.)</li>
                  <li>LinkVault automatically saves everything there as real files</li>
                  <li>Every add/edit/delete syncs instantly</li>
                </ol>
              </div>
              <Button onClick={async () => { await pickSyncFolder(); setOpen(false) }}>
                <FolderIcon size={16} /> Pick a Folder
              </Button>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}