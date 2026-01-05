import Image from 'next/image';
import { format } from 'date-fns';
import { kk, ru } from 'date-fns/locale';
import { TengriArticleCard } from '@/components/tengri-article-card';
import { ArticleActions } from '@/components/article-actions';
import { ShareButtons } from '@/components/share-buttons';
import { Advertisement } from '@/components/advertisement';
import { CommentsSection } from '@/components/comments-section';
import { getApiEndpoint } from '@/lib/api-url';
import { getImageUrl } from '@/lib/image-url';
import { sanitizeArticleHtml } from '@/lib/sanitize-article-html';

async function getArticleBySlug(slug: string) {
  try {
    const apiEndpoint = getApiEndpoint(`/articles/slug/${encodeURIComponent(slug)}`);

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

async function getRelatedArticles(categoryId: string, currentArticleId: string) {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true });

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      return [];
    }

    const articles = await res.json();
    return articles
      .filter((a: any) => a.categoryId === categoryId && a.id !== currentArticleId)
      .slice(0, 4);
  } catch (error) {
    console.error('Failed to fetch related articles:', error);
    return [];
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { lang: 'kz' | 'ru'; category: string; slug: string };
}) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {params.lang === 'kz' ? 'Мақала табылмады' : 'Статья не найдена'}
        </h1>
      </div>
    );
  }

  const relatedArticles = await getRelatedArticles(article.categoryId, article.id);

  const title = params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz;
  const rawContent = params.lang === 'kz' ? article.contentKz : article.contentRu || article.contentKz;
  const content = sanitizeArticleHtml(rawContent);
  const excerpt = params.lang === 'kz' ? article.excerptKz : article.excerptRu || article.excerptKz;
  const categoryName = article.category
    ? params.lang === 'kz'
      ? article.category.nameKz
      : article.category.nameRu
    : '';

  const publishDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'dd MMMM yyyy, HH:mm', {
        locale: params.lang === 'kz' ? kk : ru,
      })
    : '';

  const coverImageUrl = getImageUrl(article.coverImage);

  return (
    <div className="bg-gray-50">
      {/* Article Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <a href={`/${params.lang}`} className="hover:text-green-600">
                {params.lang === 'kz' ? 'Басты бет' : 'Главная'}
              </a>
              <span>/</span>
              <a href={`/${params.lang}/${params.category}`} className="hover:text-green-600">
                {categoryName}
              </a>
            </div>

            {/* Category Badge */}
            {article.category && (
              <div className="mb-4">
                <a
                  href={`/${params.lang}/${params.category}`}
                  className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-bold uppercase rounded hover:bg-green-700"
                >
                  {categoryName}
                </a>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {title}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-b py-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {article.author?.firstName} {article.author?.lastName}
                </span>
              </div>
              <span>{publishDate}</span>
              {article.views && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.views.toLocaleString()}
                </span>
              )}
            </div>

            {/* Admin Actions */}
            <ArticleActions
              articleId={article.id}
              authorId={article.author?.id}
              lang={params.lang}
            />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - 8 cols */}
          <article className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Featured Image */}
              {coverImageUrl && (
                <div className="relative w-full h-96 mb-0">
                  <Image
                    src={coverImageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                    quality={90}
                    priority
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <div className="prose prose-lg max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: content }}
                    className="article-content"
                  />
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      {params.lang === 'kz' ? 'Тегтер:' : 'Теги:'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag: any) => {
                        // Safely extract tag name - handle malformed data
                        const getTagName = () => {
                          const tagName = params.lang === 'kz' ? tag.nameKz : tag.nameRu;
                          // If tagName is an object (malformed), try to extract string value
                          if (typeof tagName === 'object' && tagName !== null) {
                            return (tagName as any).kazakh || (tagName as any).russian || (tag.nameKz as any)?.kazakh || (tag.nameRu as any)?.russian || 'Tag';
                          }
                          return tagName || tag.nameKz || tag.nameRu || 'Tag';
                        };

                        return (
                          <a
                            key={tag.id}
                            href={`/${params.lang}/tag/${tag.slug}`}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-full transition-colors"
                          >
                            #{getTagName()}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Share Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <ShareButtons
                    url={`/${params.lang}/${params.category}/${params.slug}`}
                    title={title}
                    lang={params.lang}
                  />
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {params.lang === 'kz' ? 'Ұқсас мақалалар' : 'Похожие статьи'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((relatedArticle: any) => (
                    <TengriArticleCard
                      key={relatedArticle.id}
                      article={relatedArticle}
                      lang={params.lang}
                      variant="vertical"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            {article.allowComments && (
              <CommentsSection articleId={article.id} lang={params.lang} />
            )}
          </article>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Popular */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 border-b pb-3">
                {params.lang === 'kz' ? 'Танымал' : 'Популярное'}
              </h3>
              <div className="space-y-4">
                {relatedArticles.slice(0, 5).map((related: any, index: number) => (
                  <div key={related.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl font-bold text-gray-200">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/${params.lang}/${params.category}/${
                          params.lang === 'kz' ? related.slugKz : related.slugRu || related.slugKz
                        }`}
                        className="font-medium text-sm hover:text-green-600 line-clamp-3"
                      >
                        {params.lang === 'kz' ? related.titleKz : related.titleRu || related.titleKz}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Space */}
            <Advertisement
              position="ARTICLE_SIDEBAR"
              className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
