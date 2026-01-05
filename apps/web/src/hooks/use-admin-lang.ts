'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'kz' | 'ru';

interface AdminLangState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useAdminLang = create<AdminLangState>()(
  persist(
    (set) => ({
      lang: 'ru', // Default to Russian for admin panel
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'admin-lang-storage',
    }
  )
);
