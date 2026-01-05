'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TengriArticleCard } from './tengri-article-card';

interface Category {
  id: string;
  slug: string;
  nameKz: string;
  nameRu: string;
}

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
  categoryId: string;
  category: {
    slug: string;
    nameKz: string;
    nameRu: string;
  };
  author?: {
    firstName: string;
    lastName: string;
  };
  tags: any[];
}

interface CategoryTabsProps {
  categories: Category[];
  articles: Article[];
  lang: 'kz' | 'ru';
}

export function CategoryTabs({ categories, articles, lang }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');

  const getCategoryColor = (slug: string) => {
    const colors: Record<string, string> = {
      zhanalyqtar: 'blue',
      ozekti: 'red',
      sayasat: 'purple',
      madeniyet: 'pink',
      qogam: 'green',
      kazakhmys: 'orange',
    };
    return colors[slug] || 'gray';
  };

  const filteredArticles = articles
    .filter(a => a.categoryId === activeCategory)
    .slice(0, 6);

  const activeTab = categories.find(c => c.id === activeCategory);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            const color = getCategoryColor(category.slug);
            const name = lang === 'kz' ? category.nameKz : category.nameRu;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  relative px-6 py-4 font-semibold text-sm uppercase tracking-wide whitespace-nowrap
                  transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? `text-${color}-600 bg-white shadow-md`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {name}

                {/* Active Indicator */}
                {isActive && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-t-lg`} />
                )}

                {/* Article Count Badge */}
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                    ? `bg-${color}-100 text-${color}-700`
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {articles.filter(a => a.categoryId === category.id).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'kz' ? activeTab?.nameKz : activeTab?.nameRu}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredArticles.length} {lang === 'kz' ? 'мақала' : 'статей'}
          </p>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div key={article.id} className="transform transition-all duration-300 hover:scale-105">
                <TengriArticleCard
                  article={article}
                  lang={lang}
                  variant="vertical"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">
              {lang === 'kz' ? 'Мақалалар жоқ' : 'Нет статей'}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
