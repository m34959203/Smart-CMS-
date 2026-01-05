'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from '@/components/article-card';
import { useMemo } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') || 'kz') as 'kz' | 'ru';
  const { data: articles, isLoading } = useArticles(true);

  const filteredArticles = useMemo(() => {
    if (!articles || !query) return [];

    const lowerQuery = query.toLowerCase();
    return articles.filter(
      (article) =>
        article.titleKz.toLowerCase().includes(lowerQuery) ||
        article.titleRu?.toLowerCase().includes(lowerQuery) ||
        article.contentKz.toLowerCase().includes(lowerQuery) ||
        article.contentRu?.toLowerCase().includes(lowerQuery) ||
        article.excerptKz?.toLowerCase().includes(lowerQuery) ||
        article.excerptRu?.toLowerCase().includes(lowerQuery) ||
        article.category.nameKz.toLowerCase().includes(lowerQuery) ||
        article.category.nameRu.toLowerCase().includes(lowerQuery) ||
        article.tags.some((tag) =>
          tag.nameKz.toLowerCase().includes(lowerQuery) ||
          tag.nameRu.toLowerCase().includes(lowerQuery)
        )
    );
  }, [articles, query]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {lang === 'kz' ? 'Іздеу нәтижелері' : 'Результаты поиска'}: "{query}"
        </h1>
        <p className="text-gray-600">
          {lang === 'kz' ? 'Табылған мақалалар' : 'Найдено статей'}: {filteredArticles.length}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">{lang === 'kz' ? 'Іздеу...' : 'Поиск...'}</p>
        </div>
      )}

      {!isLoading && filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {lang === 'kz'
              ? 'Сұрауыңыз бойынша ештеңе табылмады. Іздеу сұрауын өзгертіп көріңіз.'
              : 'По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.'}
          </p>
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
