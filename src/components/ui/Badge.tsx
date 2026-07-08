import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export function Badge({ children, color, removable, onRemove, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={color ? { backgroundColor: color + '20', color: color } : undefined}
    >
      {children}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          className="ml-0.5 hover:opacity-70 cursor-pointer"
        >
          &times;
        </button>
      )}
    </span>
  )
}
