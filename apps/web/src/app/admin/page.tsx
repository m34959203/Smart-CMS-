'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useArticles } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { useTags } from '@/hooks/use-tags';
import { useMagazineIssues } from '@/hooks/use-magazine-issues';
import { useAdminLang } from '@/hooks/use-admin-lang';
import { getTranslations } from '@/lib/translations';

export default function AdminPage() {
  const { user } = useAuth();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: issues } = useMagazineIssues();
  const { lang } = useAdminLang();
  const t = getTranslations(lang);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t.adminDashboard.title}</h1>
        <p className="text-gray-600">
          {user ? `${t.adminDashboard.welcomeUser} ${user.firstName} ${user.lastName}!` : `${t.adminDashboard.welcome}!`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{t.adminDashboard.articlesCount}</h3>
          <p className="text-3xl font-bold text-blue-600">
            {articles?.length || 0}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{t.adminDashboard.categoriesCount}</h3>
          <p className="text-3xl font-bold text-green-600">
            {categories?.length || 0}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{t.adminDashboard.tagsCount}</h3>
          <p className="text-3xl font-bold text-purple-600">
            {tags?.length || 0}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{t.adminDashboard.issuesCount}</h3>
          <p className="text-3xl font-bold text-orange-600">
            {issues?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/articles"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">{t.adminDashboard.manageArticles}</h3>
          <p className="text-gray-600">
            {t.adminDashboard.manageArticlesDesc}
          </p>
        </Link>

        <Link
          href="/admin/magazine-issues"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-orange-50"
        >
          <h3 className="text-xl font-bold mb-2">{t.adminDashboard.manageMagazine}</h3>
          <p className="text-gray-600">
            {t.adminDashboard.manageMagazineDesc}
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">{t.adminDashboard.manageCategories}</h3>
          <p className="text-gray-600">
            {t.adminDashboard.manageCategoriesDesc}
          </p>
        </Link>

        <Link
          href="/admin/tags"
          className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-bold mb-2">{t.adminDashboard.manageTags}</h3>
          <p className="text-gray-600">
            {t.adminDashboard.manageTagsDesc}
          </p>
        </Link>
      </div>
    </div>
  );
}
