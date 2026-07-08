import { type ReactNode, useRef, useEffect, useState, type ReactElement } from 'react'

interface DropdownProps {
  trigger: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  children: ReactNode
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, children, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <trigger.type {...trigger.props} onClick={handleTriggerClick} />
      {open && (
        <div
          className={`absolute z-40 mt-1 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  children, onClick, danger, icon,
}: {
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
  danger?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  )
}
