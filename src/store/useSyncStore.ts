import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncStatus = 'disconnected' | 'syncing' | 'synced' | 'error'

interface SyncState {
  enabled: boolean
  lastSyncedAt: number | null
  status: SyncStatus
  errorMessage: string | null
  rootHandle: FileSystemDirectoryHandle | null

  setRootHandle: (h: FileSystemDirectoryHandle | null) => void
  setEnabled: (v: boolean) => void
  setLastSyncedAt: (t: number) => void
  setStatus: (s: SyncStatus) => void
  setError: (msg: string | null) => void
  disconnect: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      enabled: false,
      lastSyncedAt: null,
      status: 'disconnected',
      errorMessage: null,
      rootHandle: null,

      setRootHandle: (rootHandle) => set({ rootHandle }),
      setEnabled: (enabled) => set({ enabled }),
      setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
      setStatus: (status) => set({ status, errorMessage: status === 'error' ? null : null }),
      setError: (errorMessage) => set({ errorMessage, status: 'error' }),
      disconnect: () => set({ enabled: false, status: 'disconnected', rootHandle: null, lastSyncedAt: null, errorMessage: null }),
    }),
    {
      name: 'linkvault-fs-sync',
      partialize: (state) => ({ enabled: state.enabled, lastSyncedAt: state.lastSyncedAt }),
    }
  )
)