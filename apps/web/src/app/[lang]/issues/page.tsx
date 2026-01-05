'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMagazineIssues, useIncrementViews, useIncrementDownloads } from '@/hooks/use-magazine-issues';
import { getImageUrl } from '@/lib/image-url';
import type { MagazineIssue } from '@/types';
import { FaWhatsapp, FaTelegram, FaLink, FaShare } from 'react-icons/fa';

// Динамический импорт PDFViewer только на клиенте
const PDFViewer = dynamic(
  () => import('@/components/pdf-viewer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="text-center py-8">Загрузка PDF...</div> }
);

interface Props {
  params: { lang: 'kz' | 'ru' };
}

export default function IssuesPage({ params }: Props) {
  const [lang, setLang] = useState<'kz' | 'ru'>(params.lang);
  const [selectedIssue, setSelectedIssue] = useState<MagazineIssue | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const { data: issues, isLoading, error } = useMagazineIssues(true); // Только опубликованные
  const incrementViews = useIncrementViews();
  const incrementDownloads = useIncrementDownloads();

  // Функция получения ссылки на выпуск
  const getShareUrl = () => {
    if (typeof window !== 'undefined' && selectedIssue) {
      return `${window.location.origin}/${lang}/issues?issue=${selectedIssue.id}`;
    }
    return '';
  };

  // Функция для получения текста для шаринга
  const getShareText = () => {
    if (!selectedIssue) return '';
    const title = lang === 'kz' ? selectedIssue.titleKz : selectedIssue.titleRu;
    return lang === 'kz'
      ? `«Аймақ ақшамы» журналы - ${title} №${selectedIssue.issueNumber}`
      : `Журнал «Аймақ ақшамы» - ${title} №${selectedIssue.issueNumber}`;
  };

  // Поделиться в WhatsApp
  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(getShareText() + '\n' + getShareUrl())}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  // Поделиться в Telegram
  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  // Копировать ссылку
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setShowShareMenu(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Нативный шаринг (для мобильных)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: getShareText(),
          url: getShareUrl(),
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    setShowShareMenu(false);
  };

  // Получить уникальные годы из выпусков (из publishDate)
  const years = Array.from(
    new Set(issues?.map((issue) => new Date(issue.publishDate).getFullYear()) || [])
  ).sort((a, b) => b - a);

  // Фильтрация по году
  const filteredIssues = selectedYear
    ? issues?.filter((issue) => new Date(issue.publishDate).getFullYear() === selectedYear)
    : issues;

  // Группировка по годам (из publishDate)
  const issuesByYear = filteredIssues?.reduce((acc, issue) => {
    const year = new Date(issue.publishDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(issue);
    return acc;
  }, {} as Record<number, MagazineIssue[]>);

  const handleSelectIssue = (issue: MagazineIssue) => {
    setSelectedIssue(issue);
    incrementViews.mutate(issue.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = () => {
    if (selectedIssue) {
      incrementDownloads.mutate(selectedIssue.id);
    }
  };

  const t = {
    kz: {
      title: 'Журнал шығарылымдары',
      allYears: 'Барлық жылдар',
      issue: 'Шығарылым',
      published: 'Жарияланды',
      pages: 'беттер',
      views: 'көрулер',
      downloads: 'жүктеулер',
      selectIssue: 'Оқу үшін шығарылымды таңдаңыз',
      share: 'Бөлісу',
      shareWhatsApp: 'WhatsApp',
      shareTelegram: 'Telegram',
      copyLink: 'Сілтемені көшіру',
      linkCopied: 'Сілтеме көшірілді!',
    },
    ru: {
      title: 'Выпуски журнала',
      allYears: 'Все годы',
      issue: 'Выпуск',
      published: 'Опубликовано',
      pages: 'стр.',
      views: 'просмотров',
      downloads: 'скачиваний',
      selectIssue: 'Выберите выпуск для чтения',
      share: 'Поделиться',
      shareWhatsApp: 'WhatsApp',
      shareTelegram: 'Telegram',
      copyLink: 'Скопировать ссылку',
      linkCopied: 'Ссылка скопирована!',
    },
  };

  const text = t[lang];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-red-600">
            Не удалось загрузить выпуски журнала. Пожалуйста, попробуйте позже.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{text.title}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Боковая панель со списком выпусков */}
        <div className="lg:w-1/3">
          {/* Фильтр по годам */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <label className="block text-sm font-medium mb-2">Фильтр по году:</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">{text.allYears}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Список выпусков */}
          <div className="space-y-4">
            {Object.entries(issuesByYear || {})
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, yearIssues]) => (
                <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b font-bold">{year}</div>
                  <div className="divide-y">
                    {yearIssues
                      .sort((a, b) => {
                        // Сортировка по дате публикации, затем по номеру выпуска
                        const dateCompare = new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                        if (dateCompare !== 0) return dateCompare;
                        return b.issueNumber - a.issueNumber;
                      })
                      .map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => handleSelectIssue(issue)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                            selectedIssue?.id === issue.id ? 'bg-blue-50 border-l-4 border-[#16a34a]' : ''
                          }`}
                        >
                          {issue.isPinned && (
                            <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mb-2">
                              Закреплен
                            </span>
                          )}
                          <div className="font-bold text-lg mb-1">
                            {text.issue} №{issue.issueNumber}
                          </div>
                          <div className="text-gray-700 mb-1">
                            {lang === 'kz' ? issue.titleKz : issue.titleRu}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {text.published}: {new Date(issue.publishDate).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                          </div>
                          {getImageUrl(issue.coverImageUrl) && (
                            <img
                              src={getImageUrl(issue.coverImageUrl)!}
                              alt={lang === 'kz' ? issue.titleKz : issue.titleRu}
                              className="w-full h-40 object-cover rounded mb-2"
                            />
                          )}
                          <div className="flex gap-4 text-xs text-gray-500">
                            {issue.pagesCount && <span>{issue.pagesCount} {text.pages}</span>}
                            <span>{issue.viewsCount} {text.views}</span>
                            <span>{issue.downloadsCount} {text.downloads}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

            {filteredIssues?.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                Нет доступных выпусков
              </div>
            )}
          </div>
        </div>

        {/* Область просмотра PDF */}
        <div className="lg:w-2/3">
          {selectedIssue ? (
            <div>
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold">
                    {text.issue} №{selectedIssue.issueNumber}
                  </h2>

                  {/* Кнопка Поделиться */}
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition"
                    >
                      <FaShare className="w-4 h-4" />
                      {text.share}
                    </button>

                    {/* Выпадающее меню шаринга */}
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                        <button
                          onClick={shareWhatsApp}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <FaWhatsapp className="w-5 h-5 text-green-500" />
                          {text.shareWhatsApp}
                        </button>
                        <button
                          onClick={shareTelegram}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <FaTelegram className="w-5 h-5 text-blue-500" />
                          {text.shareTelegram}
                        </button>
                        <button
                          onClick={copyLink}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-t"
                        >
                          <FaLink className="w-5 h-5 text-gray-500" />
                          {copySuccess ? text.linkCopied : text.copyLink}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl mb-2">
                  {lang === 'kz' ? selectedIssue.titleKz : selectedIssue.titleRu}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {text.published}: {new Date(selectedIssue.publishDate).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  {selectedIssue.pagesCount && <span>{selectedIssue.pagesCount} {text.pages}</span>}
                  <span>{selectedIssue.viewsCount} {text.views}</span>
                  <span>{selectedIssue.downloadsCount} {text.downloads}</span>
                  <span>
                    {(selectedIssue.fileSize / 1024 / 1024).toFixed(2)} МБ
                  </span>
                </div>
              </div>

              {/* Кнопка открыть на весь экран */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <button
                  onClick={() => {
                    handleDownload();
                    setShowFullscreen(true);
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-3 text-lg font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {lang === 'kz' ? 'Толық экранда ашу' : 'Открыть на весь экран'}
                </button>
              </div>

              <PDFViewer url={selectedIssue.pdfUrl} onDownload={handleDownload} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 mx-auto mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg">{text.selectIssue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Полноэкранный просмотр PDF */}
      {showFullscreen && selectedIssue && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          {/* Панель управления */}
          <div className="bg-gray-900 text-white p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-medium text-sm sm:text-base">
                {text.issue} №{selectedIssue.issueNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Кнопка скачать */}
              <a
                href={selectedIssue.pdfUrl}
                download
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">{lang === 'kz' ? 'Жүктеу' : 'Скачать'}</span>
              </a>
              {/* Кнопка закрыть */}
              <button
                onClick={() => setShowFullscreen(false)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">{lang === 'kz' ? 'Жабу' : 'Закрыть'}</span>
              </button>
            </div>
          </div>

          {/* PDF через react-pdf */}
          <div className="flex-1 overflow-auto bg-gray-800">
            <PDFViewer url={selectedIssue.pdfUrl} onDownload={handleDownload} />
          </div>
        </div>
      )}
    </div>
  );
}
