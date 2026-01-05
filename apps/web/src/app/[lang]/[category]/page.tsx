import { TengriArticleCard } from '@/components/tengri-article-card';
import { Pagination } from '@/components/pagination';
import { Advertisement } from '@/components/advertisement';
import { getApiEndpoint } from '@/lib/api-url';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getCategoryArticles(categorySlug: string) {
  try {
    // Use API filter for better performance - fetch only articles from this category
    const apiEndpoint = getApiEndpoint('/articles', {
      published: true,
      categorySlug
    });

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`Failed to fetch articles: ${res.status} ${res.statusText}`);
      return [];
    }

    const articles = await res.json();

    if (!Array.isArray(articles)) {
      console.error('Invalid articles response format:', articles);
      return [];
    }

    console.log(`Articles in category '${categorySlug}': ${articles.length}`);
    return articles;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

async function getFeaturedCategoryArticles(categorySlug: string) {
  try {
    // Fetch featured articles separately for better performance
    const apiEndpoint = getApiEndpoint('/articles', {
      published: true,
      categorySlug,
      isFeatured: true
    });

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      return [];
    }

    const articles = await res.json();
    return Array.isArray(articles) ? articles.slice(0, 3) : [];
  } catch (error) {
    console.error('Failed to fetch featured articles:', error);
    return [];
  }
}

async function getRegularCategoryArticles(categorySlug: string, page: number = 1) {
  try {
    // Fetch non-featured articles with pagination
    const apiEndpoint = getApiEndpoint('/articles', {
      published: true,
      categorySlug,
      isFeatured: false,
      page,
      limit: 20
    });

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }

    const response = await res.json();

    // If response is paginated (has data and meta)
    if (response.data && response.meta) {
      return response;
    }

    // Fallback for non-paginated response
    return { data: Array.isArray(response) ? response : [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  } catch (error) {
    console.error('Failed to fetch regular articles:', error);
    return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  }
}

// Fallback categories if API is unavailable
const FALLBACK_CATEGORIES = [
  {
    slug: 'zhanalyqtar',
    nameKz: 'ЖАҢАЛЫҚТАР',
    nameRu: 'НОВОСТИ',
    descriptionKz: 'Сатпаев қаласы мен облысының соңғы жаңалықтары',
    descriptionRu: 'Последние новости города Сатпаев и области',
  },
  {
    slug: 'ozekti',
    nameKz: 'ӨЗЕКТІ',
    nameRu: 'АКТУАЛЬНО',
    descriptionKz: 'Өзекті мәселелер мен маңызды оқиғалар',
    descriptionRu: 'Актуальные вопросы и важные события',
  },
  {
    slug: 'sayasat',
    nameKz: 'САЯСАТ',
    nameRu: 'ПОЛИТИКА',
    descriptionKz: 'Саяси жаңалықтар және талдаулар',
    descriptionRu: 'Политические новости и аналитика',
  },
  {
    slug: 'madeniyet',
    nameKz: 'МӘДЕНИЕТ',
    nameRu: 'КУЛЬТУРА',
    descriptionKz: 'Мәдени оқиғалар, өнер және әдебиет',
    descriptionRu: 'Культурные события, искусство и литература',
  },
  {
    slug: 'qogam',
    nameKz: 'ҚОҒАМ',
    nameRu: 'ОБЩЕСТВО',
    descriptionKz: 'Қоғамдық өмір және әлеуметтік мәселелер',
    descriptionRu: 'Общественная жизнь и социальные вопросы',
  },
  {
    slug: 'kazakhmys',
    nameKz: 'Казахмыс',
    nameRu: 'Казахмыс',
    descriptionKz: 'Қазақмыс корпорациясы жаңалықтары',
    descriptionRu: 'Новости корпорации Казахмыс',
  },
];

async function getCategory(categorySlug: string) {
  try {
    // Log the slug for debugging
    console.log('Looking for category with slug:', categorySlug, 'Encoded:', encodeURIComponent(categorySlug));

    // Try to use the slug-specific endpoint first for better performance
    try {
      const slugEndpoint = getApiEndpoint(`/categories/slug/${encodeURIComponent(categorySlug)}`);
      const slugRes = await fetch(slugEndpoint, { cache: 'no-store' });

      if (slugRes.ok) {
        const category = await slugRes.json();
        console.log('Found category via slug endpoint:', category.slug);
        return category;
      }
    } catch (slugError) {
      console.log('Slug endpoint failed, falling back to list endpoint');
    }

    // Fallback to fetching all categories
    const apiEndpoint = getApiEndpoint('/categories');

    const res = await fetch(apiEndpoint, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      // Use fallback categories if API fails
      return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
    }

    const categories = await res.json();

    if (!Array.isArray(categories)) {
      console.error('Invalid categories response format:', categories);
      return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
    }

    // Log comparison for debugging
    const found = categories.find((cat: any) => {
      const matches = cat.slug === categorySlug;
      console.log(`Comparing: "${cat.slug}" === "${categorySlug}" = ${matches}`);
      return matches;
    });

    if (!found) {
      console.error('Category not found. Available slugs:', categories.map((c: any) => c.slug));
    }

    return found;
  } catch (error) {
    console.error('Failed to fetch category:', error);
    // Use fallback categories if API fails
    return FALLBACK_CATEGORIES.find((cat) => cat.slug === categorySlug) || null;
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { lang: 'kz' | 'ru'; category: string };
  searchParams: { page?: string };
}) {
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  // Fetch category info and articles in parallel for better performance
  const [category, featuredArticles, paginatedArticles, allArticles] = await Promise.all([
    getCategory(params.category),
    getFeaturedCategoryArticles(params.category),
    getRegularCategoryArticles(params.category, currentPage),
    getCategoryArticles(params.category), // For popular articles sidebar
  ]);

  const regularArticles = paginatedArticles.data;
  const paginationMeta = paginatedArticles.meta;

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {params.lang === 'kz' ? 'Санат табылмады' : 'Категория не найдена'}
        </h1>
      </div>
    );
  }

  // Safely extract category name and description - handle malformed data
  const getCategoryField = (field: any) => {
    if (typeof field === 'object' && field !== null) {
      return field.kazakh || field.russian || '';
    }
    return field || '';
  };

  const categoryName = getCategoryField(
    params.lang === 'kz' ? category.nameKz : category.nameRu
  ) || getCategoryField(category.nameKz) || getCategoryField(category.nameRu);

  const categoryDescription = getCategoryField(
    params.lang === 'kz' ? category.descriptionKz : category.descriptionRu
  );

  return (
    <div className="bg-gray-50">
      {/* Category Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
          {categoryDescription && (
            <p className="text-gray-600 text-lg">{categoryDescription}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - 8 cols */}
          <div className="lg:col-span-8">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">
                  {params.lang === 'kz' ? 'Таңдаулы' : 'Избранное'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {featuredArticles.map((article: any) => (
                    <TengriArticleCard
                      key={article.id}
                      article={article}
                      lang={params.lang}
                      variant="vertical"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Articles */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4">
                {params.lang === 'kz' ? 'Барлық мақалалар' : 'Все статьи'}
              </h2>

              {regularArticles.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {regularArticles.map((article: any) => (
                      <TengriArticleCard
                        key={article.id}
                        article={article}
                        lang={params.lang}
                        variant="horizontal"
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={paginationMeta.page}
                    totalPages={paginationMeta.totalPages}
                    baseUrl={`/${params.lang}/${params.category}`}
                    lang={params.lang}
                  />
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {params.lang === 'kz'
                    ? 'Бұл санатта әзірше мақалалар жоқ'
                    : 'В этой категории пока нет статей'}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Popular in Category */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 border-b pb-3">
                {params.lang === 'kz' ? 'Танымал мақалалар' : 'Популярные статьи'}
              </h3>
              <div className="space-y-4">
                {allArticles
                  .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((article: any, index: number) => (
                    <div key={article.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-gray-200">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/${params.lang}/${params.category}/${
                            params.lang === 'kz' ? article.slugKz : article.slugRu || article.slugKz
                          }`}
                          className="font-medium text-sm hover:text-green-600 line-clamp-3"
                        >
                          {params.lang === 'kz' ? article.titleKz : article.titleRu || article.titleKz}
                        </a>
                        {article.views && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {article.views.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Ad Space */}
            <Advertisement
              position="HOME_SIDEBAR"
              className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
