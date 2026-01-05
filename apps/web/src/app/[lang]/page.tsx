import { BreakingNewsBanner } from '@/components/breaking-news-banner';
import { MagazineHero } from '@/components/magazine-hero';
import { TrendingSection } from '@/components/trending-section';
import { TengriArticleCard } from '@/components/tengri-article-card';
import { Advertisement } from '@/components/advertisement';
import { getApiEndpoint } from '@/lib/api-url';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getArticles() {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true });

    console.log('Fetching articles from:', apiEndpoint);

    const res = await fetch(apiEndpoint, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch articles:', res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('Invalid articles response format:', data);
      return [];
    }

    console.log(`Successfully fetched ${data.length} articles`);
    return data;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getBreakingNews() {
  try {
    const apiEndpoint = getApiEndpoint('/articles', { published: true, isBreaking: true });

    console.log('Fetching breaking news from:', apiEndpoint);

    const res = await fetch(apiEndpoint, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch breaking news:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Return the most recent breaking news
    return data[0];
  } catch (error) {
    console.error('Failed to fetch breaking news:', error);
    return null;
  }
}


export default async function HomePage({
  params,
}: {
  params: { lang: 'kz' | 'ru' };
}) {
  const articles = await getArticles();

  // Get breaking news from separate API call
  const breakingArticle = await getBreakingNews();

  // Articles for hero section
  const heroMainArticle = articles[0];
  const heroSideArticles = articles.slice(1, 3);

  // Articles for main feed
  const mainArticles = articles.slice(3, 13);

  // Trending articles (сортировка по просмотрам)
  const trendingArticles = [...articles]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breaking News Banner */}
      {breakingArticle && (
        <BreakingNewsBanner
          lang={params.lang}
          article={breakingArticle}
        />
      )}

      {/* Magazine Hero Section */}
      {heroMainArticle && (
        <MagazineHero
          mainArticle={heroMainArticle}
          sideArticles={heroSideArticles}
          lang={params.lang}
        />
      )}

      {/* Top Advertisement */}
      <div className="container mx-auto px-4 py-4">
        <Advertisement
          position="HOME_TOP"
          className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden"
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column - 8 cols */}
          <div className="lg:col-span-8 space-y-8">
            {/* Latest News Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6 pb-4 border-b-2 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {params.lang === 'kz' ? 'Соңғы жаңалықтар' : 'Последние новости'}
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                {mainArticles.map((article: any) => (
                  <div
                    key={article.id}
                    className="transform transition-all duration-300 hover:translate-x-2"
                  >
                    <TengriArticleCard
                      article={article}
                      lang={params.lang}
                      variant="horizontal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending Section */}
            {trendingArticles.length > 0 && (
              <TrendingSection
                articles={trendingArticles}
                lang={params.lang}
              />
            )}

            {/* Ad Space */}
            <Advertisement
              position="HOME_SIDEBAR"
              className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden"
            />

          </aside>
        </div>
      </div>

    </div>
  );
}
