import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  sidebarOpen: window.innerWidth > 768,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  activePageId: null,
  setActivePageId: (id) => set({ activePageId: id }),
}));
