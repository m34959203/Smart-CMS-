'use client';

import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/article-form';
import { useCreateArticle } from '@/hooks/use-articles';
import type { CreateBilingualArticleDto, UpdateBilingualArticleDto } from '@/types';

export default function NewArticlePage() {
  const router = useRouter();
  const createArticle = useCreateArticle();

  const handleSubmit = (data: CreateBilingualArticleDto | UpdateBilingualArticleDto) => {
    createArticle.mutate(data as CreateBilingualArticleDto, {
      onSuccess: () => {
        router.push('/admin/articles');
      },
    });
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8">Создать статью</h1>

        {createArticle.isError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
            Ошибка при создании статьи. Проверьте все поля.
          </div>
        )}

        <ArticleForm
          onSubmit={handleSubmit}
          isLoading={createArticle.isPending}
        />
      </div>
    </div>
  );
}
