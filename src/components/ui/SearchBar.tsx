import { Search, X } from 'lucide-react'
import { useUIStore } from '@/store/useStore'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useUIStore()

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        defaultValue={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search links and folders..."
        className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-lg placeholder-gray-400 focus:bg-white focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none transition-all"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
