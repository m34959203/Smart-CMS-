'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useArticles, useDeleteArticle, useDeleteManyArticles, useCategorizeAllArticles, useSpellCheckArticle } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAdminLang } from '@/hooks/use-admin-lang';
import { getTranslations } from '@/lib/translations';
import { Plus, Edit2, Trash2, Search, Filter, ChevronDown, ChevronUp, MoreVertical, X, CheckSquare, Square, Sparkles, Check } from 'lucide-react';

// Custom hook for device detection - returns undefined during SSR to prevent hydration mismatch
function useDeviceType(): 'mobile' | 'tablet' | 'desktop' | undefined {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | undefined>(undefined);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

type SortField = 'title' | 'date' | 'category' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminArticlesPage() {
  const { data: articles, isLoading } = useArticles();
  const { data: categories } = useCategories();
  const { user } = useAuth();
  const deleteArticle = useDeleteArticle();
  const deleteManyArticles = useDeleteManyArticles();
  const categorizeAllArticles = useCategorizeAllArticles();
  const spellCheckArticle = useSpellCheckArticle();
  const { lang } = useAdminLang();
  const t = getTranslations(lang);
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeArticleMenu, setActiveArticleMenu] = useState<string | null>(null);

  // Состояние для выбранных статей
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());

  // Состояние для модального окна проверки орфографии
  const [spellCheckModal, setSpellCheckModal] = useState<{
    isOpen: boolean;
    result: any;
  }>({
    isOpen: false,
    result: null,
  });

  const handleDelete = async (id: string) => {
    if (confirm(t.articles.deleteConfirm)) {
      deleteArticle.mutate(id);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArticles.size === 0) return;

    if (confirm(`${t.articles.deleteSelectedConfirm} (${selectedArticles.size})?`)) {
      deleteManyArticles.mutate(Array.from(selectedArticles), {
        onSuccess: () => {
          setSelectedArticles(new Set());
        },
      });
    }
  };

  const handleCategorizeAll = async () => {
    if (confirm(t.articles.categorizeConfirm)) {
      categorizeAllArticles.mutate(undefined, {
        onSuccess: (response) => {
          alert(
            `Категоризация завершена!\n\n` +
            `Всего статей: ${response.data.stats.total}\n` +
            `Обновлено: ${response.data.stats.updated}\n` +
            `Пропущено: ${response.data.stats.skipped}\n` +
            `Ошибок: ${response.data.stats.errors}`
          );
        },
        onError: (error: any) => {
          alert(`Ошибка категоризации: ${error.response?.data?.message || error.message}`);
        },
      });
    }
  };

  const handleSpellCheckSelected = async () => {
    if (selectedArticles.size === 0) {
      alert(t.articles.spellCheckSelect);
      return;
    }

    if (selectedArticles.size > 1) {
      alert(t.articles.spellCheckOne);
      return;
    }

    const articleId = Array.from(selectedArticles)[0];
    const article = articles?.find(a => a.id === articleId);

    if (!article) {
      alert(t.articles.articleNotFound);
      return;
    }

    spellCheckArticle.mutate(
      {
        titleKz: article.titleKz,
        contentKz: article.contentKz,
        excerptKz: article.excerptKz || undefined,
        titleRu: article.titleRu || undefined,
        contentRu: article.contentRu || undefined,
        excerptRu: article.excerptRu || undefined,
      },
      {
        onSuccess: (response) => {
          setSpellCheckModal({
            isOpen: true,
            result: {
              ...response.data,
              original: {
                titleKz: article.titleKz,
                contentKz: article.contentKz,
                excerptKz: article.excerptKz,
                titleRu: article.titleRu,
                contentRu: article.contentRu,
                excerptRu: article.excerptRu,
              },
            },
          });
        },
        onError: (error: any) => {
          alert(`Ошибка проверки орфографии: ${error.response?.data?.message || error.message}`);
        },
      }
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedArticles.map(article => article.id));
      setSelectedArticles(allIds);
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleSelectArticle = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedArticles(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Фильтрация и сортировка
  const filteredAndSortedArticles = useMemo(() => {
    if (!articles) return [];

    let filtered = [...articles];

    // Поиск по названию
    if (searchQuery) {
      filtered = filtered.filter((article) =>
        article.titleKz.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.titleRu && article.titleRu.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((article) => article.category.id === categoryFilter);
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published';
      filtered = filtered.filter((article) => article.published === isPublished);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.titleKz.localeCompare(b.titleKz);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'category':
          comparison = a.category.nameKz.localeCompare(b.category.nameKz);
          break;
        case 'status':
          comparison = (a.published ? 1 : 0) - (b.published ? 1 : 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [articles, searchQuery, categoryFilter, statusFilter, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center">{t.articles.loading}</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : isTablet ? 'px-4 py-5' : 'px-4 py-8'}`}>
      {/* Header - Mobile */}
      {isMobile ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">{t.articles.title}</h1>
            <Link
              href="/admin/articles/new"
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg flex items-center gap-1 text-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="sr-only sm:not-sr-only">{t.articles.createArticle}</span>
            </Link>
          </div>

          {/* Mobile Search Bar */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.articles.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border rounded-lg flex items-center gap-1 ${showFilters ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300'}`}
            >
              <Filter className="w-5 h-5" />
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Filters (Collapsible) */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.articles.category}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t.articles.allCategories}</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {lang === 'kz' ? cat.nameKz : cat.nameRu || cat.nameKz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t.articles.status}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t.articles.allStatuses}</option>
                  <option value="published">{t.articles.published}</option>
                  <option value="draft">{t.articles.draft}</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setShowFilters(false);
                }}
                className="w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t.articles.resetFilters}
              </button>
            </div>
          )}

          {/* Mobile: Count */}
          <div className="text-xs text-gray-500 mb-2">
            {filteredAndSortedArticles.length} {t.articles.of} {articles?.length || 0}
          </div>
        </div>
      ) : isTablet ? (
        /* Tablet Header */
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{t.articles.title}</h1>
            <div className="flex gap-2">
              <Link
                href="/admin/articles/new"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t.articles.createArticle}
              </Link>
            </div>
          </div>

          {/* Tablet Search and Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.articles.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="all">{t.articles.allCategories}</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'kz' ? cat.nameKz : cat.nameRu || cat.nameKz}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="all">{t.articles.allStatuses}</option>
              <option value="published">{t.articles.published}</option>
              <option value="draft">{t.articles.draft}</option>
            </select>
          </div>

          {/* Tablet Actions Bar */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSelectAll(selectedArticles.size !== filteredAndSortedArticles.length)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedArticles.size === filteredAndSortedArticles.length && filteredAndSortedArticles.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{lang === 'kz' ? 'Барлығын таңдау' : 'Выбрать все'}</span>
              </button>
              {selectedArticles.size > 0 && (
                <span className="text-sm text-gray-500">
                  ({selectedArticles.size} {lang === 'kz' ? 'таңдалды' : 'выбрано'})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={handleCategorizeAll}
                  className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs disabled:opacity-50"
                  disabled={categorizeAllArticles.isPending || !articles || articles.length === 0}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {categorizeAllArticles.isPending ? '...' : 'AI'}
                </button>
              )}
              {selectedArticles.size === 1 && (
                <button
                  onClick={handleSpellCheckSelected}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs disabled:opacity-50"
                  disabled={spellCheckArticle.isPending}
                >
                  <Check className="w-3.5 h-3.5" />
                  {spellCheckArticle.isPending ? '...' : t.articles.spellCheck}
                </button>
              )}
              {selectedArticles.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-3 rounded-lg text-xs"
                  disabled={deleteManyArticles.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteManyArticles.isPending ? '...' : selectedArticles.size}
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {filteredAndSortedArticles.length} {t.articles.of} {articles?.length || 0}
          </div>
        </div>
      ) : (
        /* Desktop Header */
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{t.articles.title}</h1>
          <div className="flex gap-2">
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleCategorizeAll}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={categorizeAllArticles.isPending || !articles || articles.length === 0}
                title={t.articles.categorizeWithAI}
              >
                {categorizeAllArticles.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.articles.categorizingWithAI}
                  </span>
                ) : (
                  t.articles.categorizeWithAI
                )}
              </button>
            )}
            {selectedArticles.size === 1 && (
              <button
                onClick={handleSpellCheckSelected}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={spellCheckArticle.isPending}
                title={t.articles.spellCheck}
              >
                {spellCheckArticle.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.articles.spellChecking}
                  </span>
                ) : (
                  t.articles.spellCheck
                )}
              </button>
            )}
            {selectedArticles.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={deleteManyArticles.isPending}
              >
                {deleteManyArticles.isPending
                  ? t.articles.deleting
                  : `${t.articles.deleteSelected} (${selectedArticles.size})`}
              </button>
            )}
            <Link
              href="/admin/articles/new"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {t.articles.createArticle}
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Filters (hide on tablet as it has inline filters) */}
      {!isMobile && !isTablet && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.common.search}
              </label>
              <input
                type="text"
                placeholder={t.articles.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.articles.category}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.articles.allCategories}</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {lang === 'kz' ? cat.nameKz : cat.nameRu || cat.nameKz}
                  </option>
                ))}
              </select>
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.articles.status}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.articles.allStatuses}</option>
                <option value="published">{t.articles.published}</option>
                <option value="draft">{t.articles.draft}</option>
              </select>
            </div>

            {/* Сброс фильтров */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
              >
                {t.articles.resetFilters}
              </button>
            </div>
          </div>

          {/* Счетчик */}
          <div className="mt-4 text-sm text-gray-600">
            {t.articles.showingArticles} {filteredAndSortedArticles.length} {t.articles.of} {articles?.length || 0} {t.articles.articlesCount}
          </div>
        </div>
      )}

      {filteredAndSortedArticles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? t.articles.noArticlesFiltered
              : t.articles.noArticles}
          </p>
        </div>
      )}

      {filteredAndSortedArticles.length > 0 && (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredAndSortedArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="block"
                      >
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                          {article.titleKz}
                        </h3>
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            article.published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {article.published ? t.articles.published : t.articles.draft}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{lang === 'kz' ? article.category.nameKz : article.category.nameRu || article.category.nameKz}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {formatDate(article.createdAt)}
                      </div>
                    </div>

                    {/* Action Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveArticleMenu(activeArticleMenu === article.id ? null : article.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeArticleMenu === article.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveArticleMenu(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 min-w-[140px]">
                            <Link
                              href={`/admin/articles/${article.id}`}
                              onClick={() => setActiveArticleMenu(null)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 className="w-4 h-4" />
                              {t.articles.edit}
                            </Link>
                            {(user?.role === 'ADMIN' || article.author.id === user?.id) && (
                              <button
                                onClick={() => {
                                  setActiveArticleMenu(null);
                                  handleDelete(article.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t.articles.delete}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isTablet ? (
            /* Tablet Grid View - 2 columns */
            <div className="grid grid-cols-2 gap-4">
              {filteredAndSortedArticles.map((article) => (
                <div
                  key={article.id}
                  className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                    selectedArticles.has(article.id) ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectArticle(article.id, !selectedArticles.has(article.id))}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {selectedArticles.has(article.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="block"
                      >
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
                          {article.titleKz}
                        </h3>
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            article.published
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {article.published ? t.articles.published : t.articles.draft}
                        </span>
                        <span className="text-gray-500">
                          {lang === 'kz' ? article.category.nameKz : article.category.nameRu || article.category.nameKz}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(article.createdAt)}</span>
                        <span>{article.author.firstName} {article.author.lastName[0]}.</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-1">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t.articles.edit}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Link>
                      {(user?.role === 'ADMIN' || article.author.id === user?.id) && (
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title={t.articles.delete}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedArticles.size === filteredAndSortedArticles.length && filteredAndSortedArticles.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.articles.number}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      {t.articles.titleColumn} <SortIcon field="title" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.articles.author}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      {t.articles.category} <SortIcon field="category" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      {t.articles.status} <SortIcon field="status" />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      {t.articles.date} <SortIcon field="date" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.articles.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedArticles.map((article, index) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedArticles.has(article.id)}
                          onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                          {article.titleKz.length > 80
                            ? article.titleKz.substring(0, 80) + '...'
                            : article.titleKz}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {article.author.firstName} {article.author.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {lang === 'kz' ? article.category.nameKz : article.category.nameRu || article.category.nameKz}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            article.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {article.published ? t.articles.published : t.articles.draft}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(article.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {t.articles.edit}
                        </Link>
                        {(user?.role === 'ADMIN' || article.author.id === user?.id) && (
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t.articles.delete}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Модальное окно проверки орфографии */}
      {spellCheckModal.isOpen && spellCheckModal.result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Заголовок */}
            <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t.articles.spellCheckResults}</h2>
              <button
                onClick={() => setSpellCheckModal({ isOpen: false, result: null })}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Содержимое */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Сводка */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">
                    {spellCheckModal.result.hasErrors ? (
                      <span className="text-orange-600">{t.articles.errorsFound} {spellCheckModal.result.errorCount}</span>
                    ) : (
                      <span className="text-green-600">{t.articles.noErrors}</span>
                    )}
                  </h3>
                </div>
                <p className="text-gray-700">{spellCheckModal.result.summary}</p>
              </div>

              {/* Список исправлений */}
              {spellCheckModal.result.corrections && spellCheckModal.result.corrections.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Найденные ошибки:</h3>
                  <div className="space-y-3">
                    {spellCheckModal.result.corrections.map((correction: any, idx: number) => (
                      <div key={idx} className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-semibold text-yellow-700">
                              {correction.language} - {correction.field}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">({correction.errorType})</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{correction.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">Было:</p>
                            <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                              {correction.original}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">Стало:</p>
                            <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                              {correction.corrected}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Сравнение до и после */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Полное сравнение:</h3>

                {/* Казахская версия */}
                {(spellCheckModal.result.original.titleKz || spellCheckModal.result.original.contentKz) && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-3 text-blue-600">Казахская версия</h4>

                    {spellCheckModal.result.original.titleKz && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Заголовок:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[60px]">
                              {spellCheckModal.result.original.titleKz}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[60px]">
                              {spellCheckModal.result.correctedVersions?.kazakh?.title || spellCheckModal.result.original.titleKz}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {spellCheckModal.result.original.excerptKz && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Краткое описание:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[80px]">
                              {spellCheckModal.result.original.excerptKz}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[80px]">
                              {spellCheckModal.result.correctedVersions?.kazakh?.excerpt || spellCheckModal.result.original.excerptKz}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {spellCheckModal.result.original.contentKz && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Контент:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                              {spellCheckModal.result.original.contentKz}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                              {spellCheckModal.result.correctedVersions?.kazakh?.content || spellCheckModal.result.original.contentKz}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Русская версия */}
                {(spellCheckModal.result.original.titleRu || spellCheckModal.result.original.contentRu) && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold mb-3 text-purple-600">Русская версия</h4>

                    {spellCheckModal.result.original.titleRu && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Заголовок:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[60px]">
                              {spellCheckModal.result.original.titleRu}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[60px]">
                              {spellCheckModal.result.correctedVersions?.russian?.title || spellCheckModal.result.original.titleRu}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {spellCheckModal.result.original.excerptRu && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Краткое описание:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[80px]">
                              {spellCheckModal.result.original.excerptRu}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[80px]">
                              {spellCheckModal.result.correctedVersions?.russian?.excerpt || spellCheckModal.result.original.excerptRu}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {spellCheckModal.result.original.contentRu && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Контент:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">До:</p>
                            <div className="bg-red-50 p-3 rounded border border-red-200 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                              {spellCheckModal.result.original.contentRu}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">После:</p>
                            <div className="bg-green-50 p-3 rounded border border-green-200 min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                              {spellCheckModal.result.correctedVersions?.russian?.content || spellCheckModal.result.original.contentRu}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Футер */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSpellCheckModal({ isOpen: false, result: null })}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded"
              >
                {t.articles.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
