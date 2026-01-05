'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SitemapPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';

  const content = {
    kz: {
      title: 'Сайт картасы',
      categories: 'Категориялар',
      pages: 'Беттер',
      info: 'Ақпарат'
    },
    ru: {
      title: 'Карта сайта',
      categories: 'Категории',
      pages: 'Страницы',
      info: 'Информация'
    }
  };

  const categories = [
    { slug: 'zhanalyqtar', nameKz: 'Жаңалықтар', nameRu: 'Новости' },
    { slug: 'ozekti', nameKz: 'Өзекті', nameRu: 'Актуально' },
    { slug: 'sayasat', nameKz: 'Саясат', nameRu: 'Политика' },
    { slug: 'madeniyet', nameKz: 'Мәдениет', nameRu: 'Культура' },
    { slug: 'qogam', nameKz: 'Қоғам', nameRu: 'Общество' },
    { slug: 'kazakhmys', nameKz: 'KAZAKHMYS NEWS', nameRu: 'KAZAKHMYS NEWS' },
  ];

  const pages = {
    kz: [
      { href: `/${lang}`, label: 'Басты бет' },
      { href: `/${lang}/about`, label: 'Біз туралы' },
      { href: `/${lang}/contacts`, label: 'Байланыс' },
      { href: `/${lang}/advertising`, label: 'Жарнама' },
      { href: `/${lang}/vacancies`, label: 'Вакансиялар' },
    ],
    ru: [
      { href: `/${lang}`, label: 'Главная' },
      { href: `/${lang}/about`, label: 'О нас' },
      { href: `/${lang}/contacts`, label: 'Контакты' },
      { href: `/${lang}/advertising`, label: 'Реклама' },
      { href: `/${lang}/vacancies`, label: 'Вакансии' },
    ]
  };

  const infoPages = {
    kz: [
      { href: `/${lang}/privacy`, label: 'Құпиялылық саясаты' },
      { href: `/${lang}/terms`, label: 'Пайдалану шарттары' },
      { href: `/${lang}/sitemap`, label: 'Сайт картасы' },
    ],
    ru: [
      { href: `/${lang}/privacy`, label: 'Политика конфиденциальности' },
      { href: `/${lang}/terms`, label: 'Правила использования' },
      { href: `/${lang}/sitemap`, label: 'Карта сайта' },
    ]
  };

  const t = content[lang];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">{t.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">{t.categories}</h2>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${lang}/${cat.slug}`}
                    className="text-gray-700 hover:text-green-600 transition"
                  >
                    {lang === 'kz' ? cat.nameKz : cat.nameRu}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">{t.pages}</h2>
            <ul className="space-y-2">
              {pages[lang].map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-gray-700 hover:text-green-600 transition"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">{t.info}</h2>
            <ul className="space-y-2">
              {infoPages[lang].map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-gray-700 hover:text-green-600 transition"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
