import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DealsViewState {
  view: 'table' | 'kanban'
  setView: (view: 'table' | 'kanban') => void
}

export const useDealsViewStore = create<DealsViewState>()(
  persist(
    (set) => ({
      view: 'kanban',
      setView: (view) => set({ view }),
    }),
    {
      name: 'deals-view-storage',
    }
  )
)
