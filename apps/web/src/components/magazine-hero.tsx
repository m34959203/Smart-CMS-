'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { kk, ru } from 'date-fns/locale';
import { IoEye } from 'react-icons/io5';
import { BiTime } from 'react-icons/bi';
import { FaPen } from 'react-icons/fa';
import { HiNewspaper } from 'react-icons/hi2';
import { getImageUrl } from '@/lib/image-url';

interface Article {
  id: string;
  slugKz: string;
  slugRu?: string;
  titleKz: string;
  titleRu?: string;
  excerptKz?: string;
  excerptRu?: string;
  coverImage?: string;
  publishedAt?: Date;
  views?: number;
  category: {
    slug: string;
    nameKz: string;
    nameRu: string;
  };
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface MagazineHeroProps {
  mainArticle: Article;
  sideArticles: Article[];
  lang: 'kz' | 'ru';
}

export function MagazineHero({ mainArticle, sideArticles, lang }: MagazineHeroProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderArticleCard = (article: Article, isMain: boolean = false) => {
    const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
    const excerpt = lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptKz;
    const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;
    const categoryName = lang === 'kz' ? article.category.nameKz : article.category.nameRu;

    const timeAgo = article.publishedAt && isMounted
      ? formatDistanceToNow(new Date(article.publishedAt), {
          addSuffix: true,
          locale: lang === 'kz' ? kk : ru,
        })
      : '';

    const getCategoryColor = (categorySlug: string) => {
      const colors: Record<string, string> = {
        zhanalyqtar: 'bg-blue-600',
        ozekti: 'bg-red-600',
        sayasat: 'bg-purple-600',
        madeniyet: 'bg-pink-600',
        qogam: 'bg-green-600',
        kazakhmys: 'bg-orange-600',
      };
      return colors[categorySlug] || 'bg-gray-600';
    };

    const imageUrl = getImageUrl(article.coverImage);

    return (
      <Link
        href={`/${lang}/${article.category.slug}/${slug}`}
        className="group block relative overflow-hidden rounded-xl bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]"
      >
        {/* Image */}
        <div className={`relative ${isMain ? 'h-[500px]' : 'h-[240px]'} overflow-hidden`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <HiNewspaper className="text-7xl text-white opacity-20" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className={`${getCategoryColor(article.category.slug)} text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-lg`}>
              {categoryName}
            </span>
          </div>

          {/* Content */}
          <div className={`absolute bottom-0 left-0 right-0 p-${isMain ? '8' : '6'} text-white`}>
            <h2 className={`${isMain ? 'text-4xl md:text-5xl mb-4' : 'text-xl md:text-2xl mb-2'} font-bold leading-tight group-hover:text-green-400 transition-colors line-clamp-${isMain ? '3' : '2'}`}>
              {title}
            </h2>

            {isMain && excerpt && (
              <p className="text-lg text-gray-200 mb-4 line-clamp-2">
                {excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-300">
              {timeAgo && (
                <span className="flex items-center gap-1.5" suppressHydrationWarning>
                  <BiTime className="text-base" />
                  {timeAgo}
                </span>
              )}
              {article.views && (
                <span className="flex items-center gap-1.5">
                  <IoEye className="text-base" />
                  {article.views.toLocaleString()}
                </span>
              )}
              {article.author && (
                <span className="hidden md:flex items-center gap-1.5">
                  <FaPen className="text-sm" />
                  {article.author.firstName} {article.author.lastName}
                </span>
              )}
            </div>
          </div>

          {/* Hover Indicator */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">→</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Article - 8 cols */}
          <div className="lg:col-span-8">
            {renderArticleCard(mainArticle, true)}
          </div>

          {/* Side Articles - 4 cols */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            {sideArticles.slice(0, 2).map((article) => (
              <div key={article.id}>
                {renderArticleCard(article, false)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
