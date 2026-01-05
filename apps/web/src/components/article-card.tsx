import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import type { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  lang?: 'kz' | 'ru';
}

export function ArticleCard({ article, lang = 'kz' }: ArticleCardProps) {
  const title = lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const excerpt = lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptKz;
  const slug = lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz;
  const categoryName = lang === 'kz' ? article.category.nameKz : article.category.nameRu;
  const coverImageUrl = getImageUrl(article.coverImage);

  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {coverImageUrl && (
        <div className="aspect-video bg-gray-200">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500">
            {categoryName}
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">
            {formatDate(article.publishedAt || article.createdAt)}
          </span>
        </div>
        <Link href={`/${lang}/${article.category.slug}/${slug}`}>
          <h3 className="text-xl font-bold mb-2 hover:text-blue-600 line-clamp-2">
            {title.length > 100 ? title.substring(0, 100) + '...' : title}
          </h3>
        </Link>
        {excerpt && (
          <p className="text-gray-600 mb-4">{excerpt}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {article.author.firstName} {article.author.lastName}
          </div>
          <div className="flex gap-2">
            {article.tags.slice(0, 3).map((tag) => {
              // Safely extract tag name - handle malformed data
              const getTagName = () => {
                const tagName = lang === 'kz' ? tag.nameKz : tag.nameRu;
                // If tagName is an object (malformed), try to extract string value
                if (typeof tagName === 'object' && tagName !== null) {
                  return (tagName as any).kazakh || (tagName as any).russian || (tag.nameKz as any)?.kazakh || (tag.nameRu as any)?.russian || 'Tag';
                }
                return tagName || tag.nameKz || tag.nameRu || 'Tag';
              };

              return (
                <span
                  key={tag.id}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {getTagName()}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
