'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BreakingNewsProps {
  lang: 'kz' | 'ru';
  article?: {
    id: string;
    titleKz: string;
    titleRu?: string;
    slugKz: string;
    slugRu?: string;
    category: {
      slug: string;
    };
  };
}

export function BreakingNewsBanner({ lang, article }: BreakingNewsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Анимация пульсации
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !article) return null;

  const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Breaking Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 bg-white rounded-full ${isAnimating ? 'animate-pulse' : ''}`} />
              <span className="font-bold text-sm uppercase tracking-wider">
                {lang === 'kz' ? '🔴 Жедел' : '🔴 Срочно'}
              </span>
            </div>
          </div>

          {/* News Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Link
              href={`/${lang}/${article.category.slug}/${slug}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <p className="text-sm md:text-base font-semibold truncate animate-slide-in">
                {title}
              </p>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/${lang}/${article.category.slug}/${slug}`}
              className="hidden md:block bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            >
              {lang === 'kz' ? 'Толығырақ' : 'Подробнее'} →
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }

        .animate-slide-in {
          display: inline-block;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .animate-slide-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
