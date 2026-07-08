import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { CustomField } from '@/core/types'

interface CustomFieldsSectionProps {
  fields: CustomField[]
  onChange: (fields: CustomField[]) => void
}

export function CustomFieldsSection({ fields, onChange }: CustomFieldsSectionProps) {
  const addField = () => {
    onChange([...fields, { key: '', value: '' }])
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, key: string, value: string) => {
    const updated = fields.map((f, i) => (i === index ? { key, value } : f))
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Custom Fields</label>
        <Button type="button" variant="ghost" size="sm" onClick={addField}>
          <Plus size={14} /> Add Field
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  value={field.key}
                  onChange={(e) => updateField(index, e.target.value, field.value)}
                  placeholder="Field name (e.g. Owner)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none"
                />
                <input
                  value={field.value}
                  onChange={(e) => updateField(index, field.key, e.target.value)}
                  placeholder="Value (e.g. John)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          Add extra information like Owner, Date, Priority, Status, or any custom detail
        </p>
      )}
    </div>
  )
}
