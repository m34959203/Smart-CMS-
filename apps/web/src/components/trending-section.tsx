'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { kk, ru } from 'date-fns/locale';
import { HiFire } from 'react-icons/hi';
import { IoEye } from 'react-icons/io5';
import { BiTime } from 'react-icons/bi';
import { getImageUrl } from '@/lib/image-url';

interface TrendingArticle {
  id: string;
  slugKz: string;
  slugRu?: string;
  titleKz: string;
  titleRu?: string;
  coverImage?: string;
  publishedAt?: Date;
  views?: number;
  category: {
    slug: string;
    nameKz: string;
    nameRu: string;
  };
}

interface TrendingSectionProps {
  articles: TrendingArticle[];
  lang: 'kz' | 'ru';
}

export function TrendingSection({ articles, lang }: TrendingSectionProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (articles.length === 0) return null;

  const getNumberBadgeColor = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-orange-500';
    if (index === 1) return 'from-gray-400 to-gray-500';
    if (index === 2) return 'from-orange-600 to-orange-700';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-red-500">
        <div className="relative">
          <HiFire className="text-4xl text-red-500 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          {lang === 'kz' ? 'Тренд' : 'В тренде'}
        </h3>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {articles.map((article, index) => {
          const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
          const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;

          const timeAgo = article.publishedAt && isMounted
            ? formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
                locale: lang === 'kz' ? kk : ru,
              })
            : '';

          const coverImageUrl = getImageUrl(article.coverImage);

          return (
            <div key={article.id} className="group">
              <Link
                href={`/${lang}/${article.category.slug}/${slug}`}
                className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
              >
                {/* Ranking Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getNumberBadgeColor(index)} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                    <span className="text-white font-bold text-lg">{index + 1}</span>
                  </div>
                </div>

                {/* Thumbnail */}
                {coverImageUrl && (
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={coverImageUrl}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {article.views && (
                      <span className="flex items-center gap-1 font-medium">
                        <IoEye className="text-sm text-red-500" />
                        {article.views.toLocaleString()}
                      </span>
                    )}
                    {timeAgo && (
                      <span className="flex items-center gap-1" suppressHydrationWarning>
                        <BiTime className="text-sm" />
                        {timeAgo}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (based on views) */}
                  {article.views && (
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (article.views / Math.max(...articles.map(a => a.views || 0))) * 100)}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t">
        <Link
          href={`/${lang}/trending`}
          className="block text-center text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
        >
          {lang === 'kz' ? 'Барлық трендтер' : 'Все тренды'} →
        </Link>
      </div>
    </div>
  );
}
