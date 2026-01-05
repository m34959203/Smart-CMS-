'use client';

import React from 'react';
import { useSocialMediaPublications } from '@/hooks/use-social-media';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicationStatus, SocialMediaPlatform } from '@/types';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Instagram,
  ExternalLink,
  Music2,
  Facebook,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PublicationHistoryProps {
  articleId: string;
}

export function PublicationHistory({ articleId }: PublicationHistoryProps) {
  const { data: publications, isLoading } = useSocialMediaPublications(articleId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!publications || publications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            История публикаций
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Эта статья еще не была опубликована в социальные сети</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          История публикаций ({publications.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {publications.map((publication) => (
            <div
              key={publication.id}
              className="flex items-start gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 transition"
            >
              <div className="flex-shrink-0 mt-0.5">
                {publication.platform === SocialMediaPlatform.TELEGRAM && (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                {publication.platform === SocialMediaPlatform.INSTAGRAM && (
                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Instagram className="h-5 w-5 text-pink-600" />
                  </div>
                )}
                {publication.platform === SocialMediaPlatform.TIKTOK && (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Music2 className="h-5 w-5 text-gray-900" />
                  </div>
                )}
                {publication.platform === SocialMediaPlatform.FACEBOOK && (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-blue-700" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">
                    {publication.platform === SocialMediaPlatform.TELEGRAM && 'Telegram'}
                    {publication.platform === SocialMediaPlatform.INSTAGRAM && 'Instagram'}
                    {publication.platform === SocialMediaPlatform.TIKTOK && 'TikTok'}
                    {publication.platform === SocialMediaPlatform.FACEBOOK && 'Facebook'}
                  </h4>
                  <PublicationStatusBadge status={publication.status} />
                </div>

                <p className="text-sm text-gray-500 mb-1">
                  {format(new Date(publication.publishedAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </p>

                {publication.status === PublicationStatus.SUCCESS && publication.externalId && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                    <ExternalLink className="h-3 w-3" />
                    <span className="font-mono">ID: {publication.externalId}</span>
                  </div>
                )}

                {publication.status === PublicationStatus.FAILED && publication.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Ошибка:</strong> {publication.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  switch (status) {
    case PublicationStatus.SUCCESS:
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Успешно
        </Badge>
      );
    case PublicationStatus.FAILED:
      return (
        <Badge variant="error" className="bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Ошибка
        </Badge>
      );
    case PublicationStatus.PENDING:
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          В ожидании
        </Badge>
      );
    default:
      return null;
  }
}
