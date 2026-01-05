'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { useTags, useGenerateTags } from '@/hooks/use-tags';
import { useAnalyzeArticle } from '@/hooks/use-articles';
import { useUploadImage } from '@/hooks/use-media';
import { useTranslateArticle } from '@/hooks/use-translation';
import { RichTextEditor } from './rich-text-editor';
import { AISuggestionsPanel } from './ai-suggestions-panel';
import { SocialMediaPreview } from './social-media-preview';
import { CollapsibleSection } from './ui/collapsible-section';
import { ArticleStatus, SocialMediaPlatform } from '@/types';
import type { Article, CreateBilingualArticleDto, UpdateBilingualArticleDto, Tag } from '@/types';
import { AiFillStar, AiOutlineComment, AiOutlinePushpin } from 'react-icons/ai';
import { Send, MessageCircle, Instagram, CheckCircle, Music2, Facebook, Image, Tag as TagIcon, Settings, Share2, ChevronDown } from 'lucide-react';
import { useSocialMediaPublications } from '@/hooks/use-social-media';
import { PublicationStatus } from '@/types';

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

interface ArticleFormProps {
  article?: Article;
  onSubmit: (data: CreateBilingualArticleDto | UpdateBilingualArticleDto) => void;
  isLoading?: boolean;
}

// Cover Image Section Component
function CoverImageSection({
  coverImage,
  setCoverImage,
  fileInputRef,
  handleFileSelect,
  handleBrowseClick,
  handleRemoveImage,
  uploadImage,
  uploadError,
  isMobile,
}: {
  coverImage: string;
  setCoverImage: (url: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBrowseClick: () => void;
  handleRemoveImage: () => void;
  uploadImage: { isPending: boolean };
  uploadError: string;
  isMobile: boolean;
}) {
  return (
    <>
      {/* Image Preview */}
      {coverImage && (
        <div className="mb-4 relative">
          <img
            src={coverImage}
            alt="Preview"
            className={`w-full object-cover rounded-lg border border-gray-300 ${isMobile ? 'h-40 cover-image-preview' : 'max-w-md h-48'}`}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Удалить изображение"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {uploadError}
        </div>
      )}

      {/* File Upload Button */}
      <div className="flex gap-3 mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleBrowseClick}
          disabled={uploadImage.isPending}
          className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isMobile ? 'flex-1 min-h-[48px]' : ''}`}
        >
          {uploadImage.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Загрузка...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isMobile ? 'Загрузить' : 'Загрузить файл'}
            </>
          )}
        </button>
      </div>

      {/* URL Input */}
      <div className="text-sm text-gray-500 mb-2">или укажите URL:</div>
      <input
        type="url"
        value={coverImage}
        onChange={(e) => setCoverImage(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="https://example.com/image.jpg"
      />
      {!isMobile && (
        <p className="mt-1 text-xs text-gray-500">
          Максимальный размер файла: 5MB. Поддерживаемые форматы: JPG, PNG, GIF, WebP
        </p>
      )}
    </>
  );
}

type LanguageTab = 'kz' | 'ru';

export function ArticleForm({ article, onSubmit, isLoading }: ArticleFormProps) {
  const [activeTab, setActiveTab] = useState<LanguageTab>('kz');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  // Kazakh content
  const [titleKz, setTitleKz] = useState(article?.titleKz || '');
  const [contentKz, setContentKz] = useState(article?.contentKz || '');
  const [excerptKz, setExcerptKz] = useState(article?.excerptKz || '');

  // Russian content
  const [titleRu, setTitleRu] = useState(article?.titleRu || '');
  const [contentRu, setContentRu] = useState(article?.contentRu || '');
  const [excerptRu, setExcerptRu] = useState(article?.excerptRu || '');

  // Common fields
  const [coverImage, setCoverImage] = useState(article?.coverImage || '');
  const [categoryId, setCategoryId] = useState(article?.category?.id || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.tags?.map((t) => t.id) || []
  );
  const [uploadError, setUploadError] = useState('');

  // Status and flags
  const [status, setStatus] = useState<ArticleStatus>(article?.status || ArticleStatus.PUBLISHED);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking || false);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured || false);
  const [isPinned, setIsPinned] = useState(article?.isPinned || false);
  const [allowComments, setAllowComments] = useState(article?.allowComments !== false);

  // Social Media Auto-Publish
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(article?.autoPublishEnabled || false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialMediaPlatform[]>(
    article?.autoPublishPlatforms || []
  );

  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const uploadImage = useUploadImage();
  const generateTags = useGenerateTags();
  const analyzeArticle = useAnalyzeArticle();
  const translateArticle = useTranslateArticle();
  const { data: publications } = useSocialMediaPublications(article?.id || '');

  // Check which platforms have already been published successfully
  const publishedPlatforms = useMemo(() => {
    if (!publications) return new Set<SocialMediaPlatform>();
    return new Set(
      publications
        .filter(p => p.status === PublicationStatus.SUCCESS)
        .map(p => p.platform)
    );
  }, [publications]);

  const [showSuggestedTags, setShowSuggestedTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<{
    existing: Tag[];
    created: Tag[];
    tagIds: string[];
  } | null>(null);

  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<{
    score: number;
    summary: string;
    suggestions: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
    }>;
    strengths: string[];
    improvements: {
      title?: string;
      excerpt?: string;
    };
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите файл изображения');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 5MB');
      return;
    }

    setUploadError('');

    try {
      const response = await uploadImage.mutateAsync(file);
      setCoverImage(response.data.url);
    } catch (error) {
      setUploadError('Ошибка при загрузке изображения. Попробуйте еще раз.');
      console.error('Upload error:', error);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setCoverImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least one language must have title and content
    const hasKazakhContent = titleKz.trim() && contentKz.replace(/<[^>]*>/g, '').trim();
    const hasRussianContent = titleRu.trim() && contentRu.replace(/<[^>]*>/g, '').trim();

    if (!hasKazakhContent && !hasRussianContent) {
      alert('Пожалуйста, заполните заголовок и содержание хотя бы на одном языке (казахском или русском)');
      return;
    }

    // If only Russian content, copy to Kazakh fields for backward compatibility
    const finalTitleKz = titleKz.trim() || titleRu.trim();
    const finalContentKz = contentKz.replace(/<[^>]*>/g, '').trim() ? contentKz : contentRu;
    const finalExcerptKz = excerptKz.trim() || excerptRu.trim();

    const data: CreateBilingualArticleDto | UpdateBilingualArticleDto = {
      // Kazakh content (use Russian as fallback if empty)
      titleKz: finalTitleKz,
      contentKz: finalContentKz,
      excerptKz: finalExcerptKz || undefined,

      // Russian content (optional)
      titleRu: titleRu || undefined,
      contentRu: contentRu || undefined,
      excerptRu: excerptRu || undefined,

      // Common fields
      coverImage: coverImage || undefined,
      categoryId,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,

      // Status and flags
      status,
      isBreaking,
      isFeatured,
      isPinned,
      allowComments,

      // Social Media Auto-Publish
      autoPublishEnabled,
      autoPublishPlatforms: autoPublishEnabled && selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
    };

    onSubmit(data);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleGenerateTags = async () => {
    const hasKazakhContent = titleKz && contentKz;
    const hasRussianContent = titleRu && contentRu;

    if (!hasKazakhContent && !hasRussianContent) {
      alert('Пожалуйста, заполните заголовок и содержание хотя бы на одном языке');
      return;
    }

    try {
      // Use available content
      const generateTitleKz = titleKz || titleRu;
      const generateContentKz = contentKz || contentRu;

      const response = await generateTags.mutateAsync({
        titleKz: generateTitleKz,
        contentKz: generateContentKz,
        titleRu: titleRu || undefined,
        contentRu: contentRu || undefined,
      });

      setSuggestedTags(response.data);
      setShowSuggestedTags(true);

      // Auto-select all tags (existing + newly created)
      if (response.data.tagIds && response.data.tagIds.length > 0) {
        setSelectedTags((prev) => Array.from(new Set([...prev, ...response.data.tagIds])));
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      alert('Ошибка при генерации тегов. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleAnalyzeArticle = async () => {
    const hasKazakhContent = titleKz && contentKz;
    const hasRussianContent = titleRu && contentRu;

    if (!hasKazakhContent && !hasRussianContent) {
      alert('Пожалуйста, заполните заголовок и содержание хотя бы на одном языке');
      return;
    }

    try {
      // Use available content, prefer current active tab language
      const analyzeTitle = activeTab === 'ru' && hasRussianContent ? titleRu : (titleKz || titleRu);
      const analyzeContent = activeTab === 'ru' && hasRussianContent ? contentRu : (contentKz || contentRu);
      const analyzeExcerpt = activeTab === 'ru' && hasRussianContent ? excerptRu : (excerptKz || excerptRu);

      const response = await analyzeArticle.mutateAsync({
        titleKz: analyzeTitle,
        contentKz: analyzeContent,
        excerptKz: analyzeExcerpt || undefined,
        titleRu: titleRu || undefined,
        contentRu: contentRu || undefined,
        excerptRu: excerptRu || undefined,
        targetLanguage: activeTab,
      });

      setAIAnalysis(response.data);
      setShowAIAnalysis(true);
    } catch (error) {
      console.error('Error analyzing article:', error);
      alert('Ошибка при анализе статьи. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleApplyImprovement = (field: 'title' | 'excerpt', value: string) => {
    if (activeTab === 'kz') {
      if (field === 'title') {
        setTitleKz(value);
      } else {
        setExcerptKz(value);
      }
    } else {
      if (field === 'title') {
        setTitleRu(value);
      } else {
        setExcerptRu(value);
      }
    }
  };

  const handleTranslateToRussian = async () => {
    if (!titleKz || !contentKz) {
      alert('Пожалуйста, заполните заголовок и содержание на казахском языке');
      return;
    }

    // Check if content is not just empty HTML tags
    const contentText = contentKz.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      alert('Содержание на казахском языке пустое. Пожалуйста, добавьте текст для перевода.');
      return;
    }

    try {
      console.log('Starting translation from Kazakh to Russian...');
      const response = await translateArticle.mutateAsync({
        title: titleKz,
        content: contentKz,
        excerpt: excerptKz || undefined,
        sourceLanguage: 'kk',
        targetLanguage: 'ru',
      });

      console.log('Translation response:', response);
      setTitleRu(response.data.title);
      setContentRu(response.data.content);
      if (response.data.excerpt) {
        setExcerptRu(response.data.excerpt);
      }

      alert('Перевод успешно завершен!');
    } catch (error: any) {
      console.error('Error translating article:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Неизвестная ошибка';
      alert(`Ошибка при переводе статьи: ${errorMessage}\n\nПожалуйста, попробуйте еще раз или обратитесь к администратору.`);
    }
  };

  const handleTranslateToKazakh = async () => {
    if (!titleRu || !contentRu) {
      alert('Пожалуйста, заполните заголовок и содержание на русском языке');
      return;
    }

    // Check if content is not just empty HTML tags
    const contentText = contentRu.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      alert('Содержание на русском языке пустое. Пожалуйста, добавьте текст для перевода.');
      return;
    }

    try {
      console.log('Starting translation from Russian to Kazakh...');
      const response = await translateArticle.mutateAsync({
        title: titleRu,
        content: contentRu,
        excerpt: excerptRu || undefined,
        sourceLanguage: 'ru',
        targetLanguage: 'kk',
      });

      console.log('Translation response:', response);
      setTitleKz(response.data.title);
      setContentKz(response.data.content);
      if (response.data.excerpt) {
        setExcerptKz(response.data.excerpt);
      }

      alert('Аударма сәтті аяқталды!');
    } catch (error: any) {
      console.error('Error translating article:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Белгісіз қате';
      alert(`Мақаланы аудару кезінде қате: ${errorMessage}\n\nҚайталап көріңіз немесе әкімшіге хабарласыңыз.`);
    }
  };

  return (
    <>
      {showAIAnalysis && aiAnalysis && (
        <AISuggestionsPanel
          analysis={aiAnalysis}
          onClose={() => setShowAIAnalysis(false)}
          onApplyImprovement={handleApplyImprovement}
        />
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 sm:space-y-6 ${isMobile ? 'pb-24' : isTablet ? 'pb-20' : ''}`}>
      {/* Language Tabs - Mobile/Tablet optimized */}
      {isMobile || isTablet ? (
        <div className="language-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('kz')}
            className={`language-tab ${activeTab === 'kz' ? 'active' : ''}`}
          >
            🇰🇿 Қазақша
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ru')}
            className={`language-tab ${activeTab === 'ru' ? 'active' : ''}`}
          >
            🇷🇺 Русский
          </button>
        </div>
      ) : (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('kz')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'kz'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🇰🇿 Қазақша (обязательно)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ru')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ru'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🇷🇺 Русский (опционально)
            </button>
          </nav>
        </div>
      )}

      {/* Kazakh Content */}
      <div className={`space-y-6 ${activeTab !== 'kz' ? 'hidden' : ''}`}>
        {/* Translate from Russian button */}
        {titleRu && contentRu && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-2">
              Русский контент доступен. Вы можете автоматически перевести его на казахский язык.
            </p>
            <button
              type="button"
              onClick={handleTranslateToKazakh}
              disabled={translateArticle.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {translateArticle.isPending ? 'Аударылуда...' : '🌐 Орысшадан аудару'}
            </button>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок (казахский) *
          </label>
          <input
            type="text"
            value={titleKz}
            onChange={(e) => setTitleKz(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Мақала тақырыбы"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Краткое описание (казахский)
          </label>
          <textarea
            value={excerptKz}
            onChange={(e) => setExcerptKz(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Мақаланың қысқаша сипаттамасы"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Содержание (казахский) *
          </label>
          <RichTextEditor
            content={contentKz}
            onChange={setContentKz}
            placeholder="Мақала мазмұны... (Вы можете загружать изображения перетягиванием или через кнопку в панели инструментов)"
          />
        </div>
      </div>

      {/* Russian Content */}
      <div className={`space-y-6 ${activeTab !== 'ru' ? 'hidden' : ''}`}>
        {/* Auto-translate from Kazakh button */}
        {titleKz && contentKz && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-2">
              Доступен казахский контент. Вы можете автоматически перевести его на русский язык.
            </p>
            <button
              type="button"
              onClick={handleTranslateToRussian}
              disabled={translateArticle.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {translateArticle.isPending ? 'Переводится...' : '🌐 Перевести с казахского'}
            </button>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок (русский)
          </label>
          <input
            type="text"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Заголовок статьи"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Краткое описание (русский)
          </label>
          <textarea
            value={excerptRu}
            onChange={(e) => setExcerptRu(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Краткое описание статьи"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Содержание (русский)
          </label>
          <RichTextEditor
            content={contentRu}
            onChange={setContentRu}
            placeholder="Содержание статьи... (Вы можете загружать изображения перетягиванием или через кнопку в панели инструментов)"
          />
        </div>
      </div>

      {/* Common Fields */}
      <div className={`pt-4 sm:pt-6 border-t border-gray-200 ${isMobile ? '' : 'space-y-6'}`}>
        {!isMobile && <h3 className="text-lg font-medium text-gray-900">Общие настройки</h3>}

        {/* Cover Image Section */}
        {isMobile ? (
          <CollapsibleSection
            title="Обложка"
            icon={<Image className="w-4 h-4" />}
            defaultOpen={!!coverImage}
            badge={coverImage && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" />}
          >
            <CoverImageSection
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleBrowseClick={handleBrowseClick}
              handleRemoveImage={handleRemoveImage}
              uploadImage={uploadImage}
              uploadError={uploadError}
              isMobile={isMobile}
            />
          </CollapsibleSection>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Изображение обложки
            </label>
            <CoverImageSection
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleBrowseClick={handleBrowseClick}
              handleRemoveImage={handleRemoveImage}
              uploadImage={uploadImage}
              uploadError={uploadError}
              isMobile={isMobile}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Выберите категорию</option>
            {categories?.map((category) => {
              // Safely extract category names - handle malformed data
              const getNameKz = () => {
                if (typeof category.nameKz === 'object' && category.nameKz !== null) {
                  return (category.nameKz as any).kazakh || (category.nameKz as any).russian || 'Category';
                }
                return category.nameKz || 'Category';
              };
              const getNameRu = () => {
                if (typeof category.nameRu === 'object' && category.nameRu !== null) {
                  return (category.nameRu as any).russian || (category.nameRu as any).kazakh || 'Category';
                }
                return category.nameRu || 'Category';
              };

              return (
                <option key={category.id} value={category.id}>
                  {getNameKz()} / {getNameRu()}
                </option>
              );
            })}
          </select>
        </div>

        {tags && tags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Теги
              </label>
              <button
                type="button"
                onClick={handleGenerateTags}
                disabled={generateTags.isPending || ((!titleKz || !contentKz) && (!titleRu || !contentRu))}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generateTags.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Автозаполнение AI
                  </>
                )}
              </button>
            </div>

            {/* Suggested Tags */}
            {showSuggestedTags && suggestedTags && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-purple-900">AI предложения:</h4>
                  <button
                    type="button"
                    onClick={() => setShowSuggestedTags(false)}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    Закрыть
                  </button>
                </div>

                {suggestedTags.existing.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-purple-700 mb-2">
                      ✓ Найдены существующие теги (автоматически выбраны):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.existing.map((tag, index) => {
                        // Safely extract tag names - handle malformed data
                        const getNameKz = () => {
                          if (typeof tag.nameKz === 'object' && tag.nameKz !== null) {
                            return (tag.nameKz as any).kazakh || (tag.nameKz as any).russian || 'Tag';
                          }
                          return tag.nameKz || 'Tag';
                        };
                        const getNameRu = () => {
                          if (typeof tag.nameRu === 'object' && tag.nameRu !== null) {
                            return (tag.nameRu as any).russian || (tag.nameRu as any).kazakh || 'Tag';
                          }
                          return tag.nameRu || 'Tag';
                        };

                        return (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm border border-green-300"
                          >
                            {getNameKz()} / {getNameRu()}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {suggestedTags.created && suggestedTags.created.length > 0 && (
                  <div>
                    <p className="text-sm text-purple-700 mb-2">
                      ✨ Созданы новые теги (автоматически выбраны):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.created.map((tag, index) => {
                        // Safely extract tag names - handle malformed data
                        const getNameKz = () => {
                          if (typeof tag.nameKz === 'object' && tag.nameKz !== null) {
                            return (tag.nameKz as any).kazakh || (tag.nameKz as any).russian || 'Tag';
                          }
                          return tag.nameKz || 'Tag';
                        };
                        const getNameRu = () => {
                          if (typeof tag.nameRu === 'object' && tag.nameRu !== null) {
                            return (tag.nameRu as any).russian || (tag.nameRu as any).kazakh || 'Tag';
                          }
                          return tag.nameRu || 'Tag';
                        };

                        return (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-300"
                          >
                            {getNameKz()} / {getNameRu()}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                // Safely extract tag name - handle malformed data
                const getNameKz = () => {
                  if (typeof tag.nameKz === 'object' && tag.nameKz !== null) {
                    return (tag.nameKz as any).kazakh || (tag.nameKz as any).russian || 'Tag';
                  }
                  return tag.nameKz || 'Tag';
                };

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {getNameKz()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус публикации *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value={ArticleStatus.DRAFT}>Черновик</option>
            <option value={ArticleStatus.REVIEW}>На проверке</option>
            <option value={ArticleStatus.SCHEDULED}>Запланировано</option>
            <option value={ArticleStatus.PUBLISHED}>Опубликовано</option>
            <option value={ArticleStatus.ARCHIVED}>В архиве</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isBreaking"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isBreaking" className="ml-2 block text-sm font-medium text-gray-900">
                🚨 Срочная новость (Breaking News)
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Статья будет отображаться в красной бегущей строке наверху сайта
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <AiFillStar className="text-yellow-500" />
                Избранное (Featured)
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Статья будет выделена на главной странице и в категориях как рекомендованная
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isPinned" className="ml-2 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <AiOutlinePushpin className="text-blue-600" />
                Закрепленная статья
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Статья всегда будет отображаться вверху списка независимо от даты публикации
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowComments"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="allowComments" className="ml-2 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <AiOutlineComment className="text-green-600" />
                Разрешить комментарии
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Читатели смогут оставлять комментарии под этой статьей
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Auto-Publish Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Автопубликация в социальные сети</h3>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoPublishEnabled"
                checked={autoPublishEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAutoPublishEnabled(enabled);
                  if (!enabled) {
                    setSelectedPlatforms([]);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoPublishEnabled" className="ml-2 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <Send className="text-blue-600" />
                Автоматически публиковать в соцсети
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              Статья будет автоматически опубликована в выбранные социальные сети при сохранении со статусом &quot;Опубликовано&quot;
            </p>

            {autoPublishEnabled && (
              <div className="mt-4 ml-6 space-y-3 border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Выберите платформы:</p>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform-telegram"
                      checked={selectedPlatforms.includes(SocialMediaPlatform.TELEGRAM)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, SocialMediaPlatform.TELEGRAM]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== SocialMediaPlatform.TELEGRAM));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform-telegram" className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      Telegram
                      {publishedPlatforms.has(SocialMediaPlatform.TELEGRAM) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Опубликовано
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform-instagram"
                      checked={selectedPlatforms.includes(SocialMediaPlatform.INSTAGRAM)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, SocialMediaPlatform.INSTAGRAM]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== SocialMediaPlatform.INSTAGRAM));
                        }
                      }}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform-instagram" className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      Instagram
                      {publishedPlatforms.has(SocialMediaPlatform.INSTAGRAM) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Опубликовано
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform-tiktok"
                      checked={selectedPlatforms.includes(SocialMediaPlatform.TIKTOK)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, SocialMediaPlatform.TIKTOK]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== SocialMediaPlatform.TIKTOK));
                        }
                      }}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform-tiktok" className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <Music2 className="h-4 w-4 text-gray-900" />
                      TikTok
                      {publishedPlatforms.has(SocialMediaPlatform.TIKTOK) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Опубликовано
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform-facebook"
                      checked={selectedPlatforms.includes(SocialMediaPlatform.FACEBOOK)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, SocialMediaPlatform.FACEBOOK]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== SocialMediaPlatform.FACEBOOK));
                        }
                      }}
                      className="h-4 w-4 text-blue-700 focus:ring-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="platform-facebook" className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      <Facebook className="h-4 w-4 text-blue-700" />
                      Facebook
                      {publishedPlatforms.has(SocialMediaPlatform.FACEBOOK) && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Опубликовано
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {selectedPlatforms.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                    ⚠️ Выберите хотя бы одну платформу для публикации
                  </p>
                )}

                {selectedPlatforms.includes(SocialMediaPlatform.INSTAGRAM) && !coverImage && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    ⚠️ Instagram требует обложку. Добавьте изображение обложки к статье
                  </p>
                )}

                {selectedPlatforms.includes(SocialMediaPlatform.TIKTOK) && !coverImage && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    ⚠️ TikTok требует обложку для фото-постов. Добавьте изображение обложки к статье
                  </p>
                )}

                {publishedPlatforms.size > 0 && selectedPlatforms.some(p => publishedPlatforms.has(p)) && (
                  <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                    ℹ️ Платформы с пометкой &quot;Опубликовано&quot; уже содержат эту статью. При сохранении повторная публикация будет пропущена автоматически.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preview Section */}
          {autoPublishEnabled && selectedPlatforms.length > 0 && (
            <SocialMediaPreview
              article={{
                titleKz,
                titleRu,
                excerptKz,
                excerptRu,
                contentKz,
                contentRu,
                slugKz: titleKz.toLowerCase().replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-'),
                slugRu: titleRu ? titleRu.toLowerCase().replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-') : undefined,
                coverImage,
                category: categories?.find(c => c.id === categoryId),
                tags: tags?.filter(t => selectedTags.includes(t.id)),
                isBreaking,
              }}
              platforms={selectedPlatforms}
              language="kz"
            />
          )}
        </div>
      </div>

      {/* Action Buttons - Desktop */}
      {!isMobile && (
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleAnalyzeArticle}
            disabled={analyzeArticle.isPending || ((!titleKz || !contentKz) && (!titleRu || !contentRu))}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {analyzeArticle.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Анализ...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-редактор
              </>
            )}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Сохранение...' : article ? 'Обновить статью' : 'Создать статью'}
          </button>
        </div>
      )}
    </form>

    {/* Sticky Bottom Actions - Mobile/Tablet */}
    {(isMobile || isTablet) && (
      <div className={`sticky-bottom-actions ${isTablet ? 'tablet-actions' : ''}`}>
        <button
          type="button"
          onClick={handleAnalyzeArticle}
          disabled={analyzeArticle.isPending || ((!titleKz || !contentKz) && (!titleRu || !contentRu))}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzeArticle.isPending ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {isTablet ? 'AI-редактор' : 'AI'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              {article ? 'Обновить' : 'Создать'}
            </>
          )}
        </button>
      </div>
    )}
    </>
  );
}
