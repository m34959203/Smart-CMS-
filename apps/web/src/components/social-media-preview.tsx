'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SocialMediaPlatform } from '@/types';
import { generatePostPreview } from '@/hooks/use-social-media';
import { Send, Instagram, MessageCircle, Facebook, Music2 } from 'lucide-react';

interface SocialMediaPreviewProps {
  article: any;
  platforms: SocialMediaPlatform[];
  language?: 'kz' | 'ru';
}

export function SocialMediaPreview({
  article,
  platforms,
  language = 'kz',
}: SocialMediaPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>(platforms[0] || SocialMediaPlatform.TELEGRAM);

  if (!platforms || platforms.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Превью публикации в соцсетях
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${platforms.length === 1 ? 'grid-cols-1' : platforms.length === 2 ? 'grid-cols-2' : platforms.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {platforms.includes(SocialMediaPlatform.TELEGRAM) && (
              <TabsTrigger
                value={SocialMediaPlatform.TELEGRAM}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Telegram
              </TabsTrigger>
            )}
            {platforms.includes(SocialMediaPlatform.INSTAGRAM) && (
              <TabsTrigger
                value={SocialMediaPlatform.INSTAGRAM}
                className="flex items-center gap-2"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </TabsTrigger>
            )}
            {platforms.includes(SocialMediaPlatform.TIKTOK) && (
              <TabsTrigger
                value={SocialMediaPlatform.TIKTOK}
                className="flex items-center gap-2"
              >
                <Music2 className="h-4 w-4" />
                TikTok
              </TabsTrigger>
            )}
            {platforms.includes(SocialMediaPlatform.FACEBOOK) && (
              <TabsTrigger
                value={SocialMediaPlatform.FACEBOOK}
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </TabsTrigger>
            )}
          </TabsList>

          {platforms.includes(SocialMediaPlatform.TELEGRAM) && (
            <TabsContent
              value={SocialMediaPlatform.TELEGRAM}
              className="space-y-4"
            >
              <TelegramPreview article={article} language={language} />
            </TabsContent>
          )}

          {platforms.includes(SocialMediaPlatform.INSTAGRAM) && (
            <TabsContent
              value={SocialMediaPlatform.INSTAGRAM}
              className="space-y-4"
            >
              <InstagramPreview article={article} language={language} />
            </TabsContent>
          )}

          {platforms.includes(SocialMediaPlatform.TIKTOK) && (
            <TabsContent
              value={SocialMediaPlatform.TIKTOK}
              className="space-y-4"
            >
              <TiktokPreview article={article} language={language} />
            </TabsContent>
          )}

          {platforms.includes(SocialMediaPlatform.FACEBOOK) && (
            <TabsContent
              value={SocialMediaPlatform.FACEBOOK}
              className="space-y-4"
            >
              <FacebookPreview article={article} language={language} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TelegramPreview({
  article,
  language,
}: {
  article: any;
  language: 'kz' | 'ru';
}) {
  const preview = generatePostPreview(
    article,
    SocialMediaPlatform.TELEGRAM,
    language,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">AIMAK News</div>
            {article.coverImage && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={article.coverImage}
                  alt="Cover"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}
            <div
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: preview
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/&lt;b&gt;/g, '<strong>')
                  .replace(/&lt;\/b&gt;/g, '</strong>')
                  .replace(/&lt;i&gt;/g, '<em>')
                  .replace(/&lt;\/i&gt;/g, '</em>')
                  .replace(
                    /&lt;a href="([^"]+)"&gt;/g,
                    '<a href="$1" class="text-blue-500 underline">',
                  )
                  .replace(/&lt;\/a&gt;/g, '</a>'),
              }}
            />
            <div className="text-xs text-gray-500 mt-2">Только что</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Примечание:</strong> Это превью показывает, как будет выглядеть
        ваш пост в Telegram. Фактический вид может незначительно отличаться.
      </div>
    </div>
  );
}

function InstagramPreview({
  article,
  language,
}: {
  article: any;
  language: 'kz' | 'ru';
}) {
  const preview = generatePostPreview(
    article,
    SocialMediaPlatform.INSTAGRAM,
    language,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            A
          </div>
          <span className="font-semibold text-sm">aimak_news</span>
        </div>

        {/* Image */}
        {article.coverImage ? (
          <div className="aspect-square bg-gray-100">
            <img
              src={article.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <Instagram className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-4">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>

          <div className="text-sm">
            <span className="font-semibold">aimak_news</span>{' '}
            <span className="whitespace-pre-wrap text-gray-800">{preview}</span>
          </div>

          <div className="text-xs text-gray-500">ТОЛЬКО ЧТО</div>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Примечание:</strong> Instagram требует изображение обложки для
        публикации. Убедитесь, что вы добавили обложку к статье.
      </div>

      {!article.coverImage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-yellow-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <strong>Предупреждение:</strong> Добавьте обложку к статье для
              публикации в Instagram
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TiktokPreview({
  article,
  language,
}: {
  article: any;
  language: 'kz' | 'ru';
}) {
  const preview = generatePostPreview(
    article,
    SocialMediaPlatform.TIKTOK,
    language,
  );

  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const truncatedTitle = title?.length > 50 ? title.substring(0, 50) + '...' : title;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-black text-white overflow-hidden max-w-sm mx-auto">
        {/* TikTok Phone Frame */}
        <div className="relative aspect-[9/16] bg-gray-900">
          {/* Video/Image Area */}
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-black">
              <Music2 className="h-20 w-20 text-gray-600" />
            </div>
          )}

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            {/* Right Side Actions */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <span className="text-xs mt-1">12.3K</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                  </svg>
                </div>
                <span className="text-xs mt-1">234</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                  </svg>
                </div>
                <span className="text-xs mt-1">89</span>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-4 left-3 right-16">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-semibold text-sm">@aimak_news</span>
                <button className="px-2 py-0.5 border border-white rounded text-xs">
                  Follow
                </button>
              </div>
              <p className="text-sm mb-2 line-clamp-2">{truncatedTitle}</p>
              <p className="text-xs text-gray-300 line-clamp-2">{preview}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Music2 className="h-3 w-3" />
                <span className="truncate">Original sound - AIMAK News</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Примечание:</strong> TikTok публикует фото-посты. Для публикации
        требуется изображение обложки.
      </div>

      {!article.coverImage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-yellow-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <strong>Предупреждение:</strong> Добавьте обложку к статье для
              публикации в TikTok
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FacebookPreview({
  article,
  language,
}: {
  article: any;
  language: 'kz' | 'ru';
}) {
  const preview = generatePostPreview(
    article,
    SocialMediaPlatform.FACEBOOK,
    language,
  );

  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://aimak.kz';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-hidden max-w-lg mx-auto shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">AIMAK News</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              Только что ·
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>

        {/* Post Text */}
        <div className="px-3 pb-3">
          <p className="text-sm whitespace-pre-wrap">{preview}</p>
        </div>

        {/* Link Preview Card */}
        <div className="border-t border-b">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt="Cover"
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-gray-100 flex items-center justify-center">
              <Facebook className="h-16 w-16 text-gray-300" />
            </div>
          )}
          <div className="p-3 bg-gray-50">
            <div className="text-xs text-gray-500 uppercase">AIMAK.KZ</div>
            <div className="font-semibold text-sm mt-1 line-clamp-2">{title}</div>
          </div>
        </div>

        {/* Reactions Bar */}
        <div className="px-3 py-2 flex items-center justify-between text-gray-500 text-sm border-b">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" transform="rotate(180 12 12)"/>
                </svg>
              </div>
              <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
            <span>256</span>
          </div>
          <div className="flex gap-3">
            <span>45 комментариев</span>
            <span>12 репостов</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-3 py-2 flex items-center justify-around text-gray-500">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            </svg>
            <span className="text-sm font-medium">Нравится</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span className="text-sm font-medium">Комментарий</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            <span className="text-sm font-medium">Поделиться</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Примечание:</strong> Facebook публикует посты с превью ссылки.
        При наличии обложки она будет использована как изображение поста.
      </div>
    </div>
  );
}
