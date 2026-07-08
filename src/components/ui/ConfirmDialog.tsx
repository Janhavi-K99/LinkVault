import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${variant === 'danger' ? 'bg-red-100' : 'bg-vault-100'}`}>
          <AlertTriangle size={24} className={variant === 'danger' ? 'text-red-600' : 'text-vault-600'} />
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose() }} className="flex-1">{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
