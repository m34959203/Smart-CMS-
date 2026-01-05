'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getTranslations } from '@/lib/translations';

interface SearchBarProps {
  lang?: 'kz' | 'ru';
}

export function SearchBar({ lang = 'ru' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const t = getTranslations(lang);

  // Extract language from pathname if not provided
  const currentLang = lang || (pathname?.startsWith('/kz') ? 'kz' : 'ru');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${currentLang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
