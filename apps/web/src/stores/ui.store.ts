// UI state store — controls global UI interactions like the entry creation sheet.
// Used by: components/dashboard/sidebar.tsx, components/dashboard/dashboard-client.tsx
import { create } from 'zustand';

interface UiStore {
  isCreatingEntry: boolean;
  openCreateEntry: () => void;
  closeCreateEntry: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isCreatingEntry: false,
  openCreateEntry: () => set({ isCreatingEntry: true }),
  closeCreateEntry: () => set({ isCreatingEntry: false }),
}));
