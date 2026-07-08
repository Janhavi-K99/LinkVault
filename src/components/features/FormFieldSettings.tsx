import { Modal } from '@/components/ui/Modal'
import { useFieldSettings } from '@/store/useFieldSettings'
import { Eye, EyeOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

export function FormFieldSettings() {
  const { fields, toggleField } = useFieldSettings()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} title="Customize form fields">
        <Settings size={16} />
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Customize Form Fields" size="sm">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 mb-3">Toggle which fields appear in the Add/Edit Link form.</p>
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleField(field.id)}
            >
              <span className="text-sm text-gray-700">{field.label}</span>
              <div className={`p-1.5 rounded-md transition-colors ${field.enabled ? 'text-vault-600 bg-vault-50' : 'text-gray-400'}`}>
                {field.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button type="button" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </Modal>
    </>
  )
}
