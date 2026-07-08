import { type LucideIcon, TrendingUp, Bookmark, Heart, Archive } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
}

export function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
