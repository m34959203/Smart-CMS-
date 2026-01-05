'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { kk, ru } from 'date-fns/locale';
import { IoEye } from 'react-icons/io5';
import { BsPinAngleFill } from 'react-icons/bs';
import { getImageUrl } from '@/lib/image-url';
import { ArticlePlaceholder } from './article-placeholder';

interface Article {
  id: string;
  slugKz: string;
  slugRu?: string | null;
  titleKz: string;
  titleRu?: string | null;
  excerptKz?: string | null;
  excerptRu?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
  views?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  category?: {
    slug: string;
    nameKz: string;
    nameRu: string;
  };
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface TengriArticleCardProps {
  article: Article;
  lang?: 'kz' | 'ru';
  variant?: 'horizontal' | 'vertical' | 'hero';
}

export function TengriArticleCard({
  article,
  lang = 'kz',
  variant = 'horizontal',
}: TengriArticleCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;
  const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const excerpt = lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptRu || article.excerptKz;

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safely extract category name - handle malformed data
  const getCategoryName = () => {
    if (!article.category) return '';
    const catName = lang === 'kz' ? article.category.nameKz : article.category.nameRu;
    // If catName is an object (malformed), try to extract string value
    if (typeof catName === 'object' && catName !== null) {
      return (catName as any).kazakh || (catName as any).russian || article.category.nameKz || article.category.nameRu || '';
    }
    return catName || article.category.nameKz || article.category.nameRu || '';
  };
  const categoryName = getCategoryName();

  const timeAgo = article.publishedAt && isMounted
    ? formatDistanceToNow(new Date(article.publishedAt), {
        addSuffix: true,
        locale: lang === 'kz' ? kk : ru,
      })
    : '';

  // Category colors (softer, professional palette)
  const getCategoryColor = (categorySlug?: string) => {
    const colors: Record<string, string> = {
      zhanalyqtar: 'bg-[#3B82F6]',    // Мягкий синий
      ozekti: 'bg-[#DC2626]',         // Приглушенный красный
      sayasat: 'bg-[#7C3AED]',        // Мягкий фиолетовый
      madeniyet: 'bg-[#DB2777]',      // Приглушенный розовый
      qogam: 'bg-[#059669]',          // Изумрудный зеленый
      kazakhmys: 'bg-[#D97706]',      // Приглушенный оранжевый
    };
    return colors[categorySlug || ''] || 'bg-gray-600';
  };

  if (variant === 'hero') {
    const imageUrl = getImageUrl(article.coverImage);

    return (
      <Link
        href={`/${lang}/${article.category?.slug}/${slug}`}
        className="group block relative overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="relative h-[500px]">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                quality={85}
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <>
              <ArticlePlaceholder
                title={title}
                categorySlug={article.category?.slug}
                variant="hero"
              />
              {/* Gradient overlay for placeholder */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {article.isPinned && (
                <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold uppercase rounded flex items-center gap-1">
                  <BsPinAngleFill className="text-xs" />
                  {lang === 'kz' ? 'Бекітілген' : 'Закреплено'}
                </span>
              )}
              {article.isBreaking && (
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded">
                  {lang === 'kz' ? 'Жедел' : 'Срочно'}
                </span>
              )}
              {article.category && (
                <span
                  className={`px-3 py-1 ${getCategoryColor(
                    article.category.slug
                  )} text-white text-xs font-bold uppercase rounded`}
                >
                  {categoryName}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-bold mb-3 group-hover:text-green-400 transition line-clamp-3">
              {title.length > 120 ? title.substring(0, 120) + '...' : title}
            </h2>
            {excerpt && (
              <p className="text-lg text-gray-200 mb-4 line-clamp-2">{excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-300">
              {timeAgo && <span suppressHydrationWarning>{timeAgo}</span>}
              {article.views && (
                <span className="flex items-center gap-1.5">
                  <IoEye className="text-base" />
                  {article.views.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'vertical') {
    const imageUrl = getImageUrl(article.coverImage);

    return (
      <Link
        href={`/${lang}/${article.category?.slug}/${slug}`}
        className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border"
      >
        <div className="relative h-48">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              quality={80}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <ArticlePlaceholder
              title={title}
              categorySlug={article.category?.slug}
              variant="vertical"
            />
          )}
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {article.isPinned && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold uppercase rounded flex items-center gap-1">
                <BsPinAngleFill className="text-xs" />
              </span>
            )}
            {article.isBreaking && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold uppercase rounded">
                {lang === 'kz' ? 'Жедел' : 'Срочно'}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          {article.category && (
            <span
              className={`inline-block px-2 py-1 ${getCategoryColor(
                article.category.slug
              )} text-white text-xs font-bold uppercase rounded mb-2`}
            >
              {categoryName}
            </span>
          )}
          <h3 className="font-bold text-lg mb-2 group-hover:text-green-600 transition line-clamp-3">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {timeAgo && <span suppressHydrationWarning>{timeAgo}</span>}
            {article.views && (
              <span className="flex items-center gap-1.5">
                <IoEye className="text-sm" />
                {article.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal (default - Tengrinews style)
  const imageUrl = getImageUrl(article.coverImage);

  return (
    <Link
      href={`/${lang}/${article.category?.slug}/${slug}`}
      className="group flex gap-4 bg-white hover:bg-gray-50 transition-colors border-b pb-4"
    >
      {/* Image */}
      <div className="relative w-32 h-24 flex-shrink-0 rounded overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="128px"
            quality={75}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ArticlePlaceholder
            title={title}
            categorySlug={article.category?.slug}
            variant="horizontal"
          />
        )}
        <div className="absolute top-1 left-1 flex gap-1 flex-wrap">
          {article.isPinned && (
            <span className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold uppercase rounded flex items-center gap-0.5">
              <BsPinAngleFill className="text-[10px]" />
            </span>
          )}
          {article.isBreaking && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase rounded">
              {lang === 'kz' ? 'Жедел' : 'Срочно'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {article.category && (
            <span
              className={`px-2 py-0.5 ${getCategoryColor(
                article.category.slug
              )} text-white text-[10px] font-bold uppercase rounded`}
            >
              {categoryName}
            </span>
          )}
          {timeAgo && (
            <span className="text-xs text-gray-500" suppressHydrationWarning>
              {timeAgo}
            </span>
          )}
        </div>
        <h3 className="font-bold text-base mb-1 group-hover:text-green-600 transition line-clamp-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2">{excerpt}</p>
        )}
        {article.views && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <IoEye className="text-sm" />
            {article.views.toLocaleString()}
          </div>
        )}
      </div>
    </Link>
  );
}
