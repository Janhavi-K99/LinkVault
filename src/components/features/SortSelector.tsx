import { ArrowUpDown } from 'lucide-react'
import { SORT_OPTIONS } from '@/core/constants'
import { useUIStore } from '@/store/useStore'
import type { SortField, SortOrder } from '@/core/types'

export function SortSelector() {
  const { sortConfig, setSortConfig } = useUIStore()

  const current = `${sortConfig.field}-${sortConfig.order}`
  const currentLabel = SORT_OPTIONS.find((o) => o.value === current)?.label ?? 'Sort'

  const handleChange = (value: string) => {
    const [field, order] = value.split('-') as [SortField, SortOrder]
    setSortConfig({ field, order })
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-700 font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vault-500/20 focus:border-vault-500 transition-all"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}
