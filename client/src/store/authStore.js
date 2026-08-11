import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      household: null,
      setAuth: (user, token, household) => set({ user, token, household }),
      setHousehold: (household) => set({ household }),
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
      logout: () => set({ user: null, token: null, household: null }),
    }),
    { name: 'dwellpay-auth' }
  )
);
