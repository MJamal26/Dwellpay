import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
