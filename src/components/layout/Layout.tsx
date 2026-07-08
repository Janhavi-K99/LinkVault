import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { useUIStore } from '@/store/useStore'

export function Layout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <TabBar />
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
