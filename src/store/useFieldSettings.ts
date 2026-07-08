import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FormFieldConfig, FormFieldId } from '@/core/types'

const defaultFields: FormFieldConfig[] = [
  { id: 'description', label: 'Description', enabled: true },
  { id: 'notes', label: 'Personal Notes', enabled: true },
  { id: 'tags', label: 'Tags', enabled: true },
  { id: 'folder', label: 'Folder', enabled: true },
  { id: 'favorite', label: 'Favorite', enabled: true },
  { id: 'attachments', label: 'Attachments', enabled: true },
  { id: 'customFields', label: 'Custom Fields', enabled: true },
]

interface FieldSettingsState {
  fields: FormFieldConfig[]
  toggleField: (id: FormFieldId) => void
  isEnabled: (id: FormFieldId) => boolean
}

export const useFieldSettings = create<FieldSettingsState>()(
  persist(
    (set, get) => ({
      fields: defaultFields,
      toggleField: (id) =>
        set((s) => ({
          fields: s.fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
        })),
      isEnabled: (id) => get().fields.find((f) => f.id === id)?.enabled ?? true,
    }),
    { name: 'linkvault-field-settings' }
  )
)
