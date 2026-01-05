'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/article-form';
import { useArticle, useUpdateArticle } from '@/hooks/use-articles';
import type { UpdateBilingualArticleDto } from '@/types';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: article, isLoading } = useArticle(id);
  const updateArticle = useUpdateArticle();

  const handleSubmit = (data: UpdateBilingualArticleDto) => {
    updateArticle.mutate(
      { id, data },
      {
        onSuccess: () => {
          router.push('/admin/articles');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-red-600">Статья не найдена</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8">Редактировать статью</h1>

        {updateArticle.isError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
            Ошибка при обновлении статьи. Проверьте все поля.
          </div>
        )}

        <ArticleForm
          article={article}
          onSubmit={handleSubmit}
          isLoading={updateArticle.isPending}
        />
      </div>
    </div>
  );
}
