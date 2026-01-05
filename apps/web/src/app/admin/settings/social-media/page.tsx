'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import {
  useAllSocialMediaConfigs,
  useUpdateSocialMediaConfig,
} from '@/hooks/use-social-media';
import { SocialMediaPlatform } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Instagram, Loader2, CheckCircle, Facebook, Music2, Webhook, Copy, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const telegramSchema = z.object({
  enabled: z.boolean(),
  defaultLanguage: z.enum(['kz', 'ru']),
  botToken: z.string().optional(),
  chatId: z.string().optional(),
});

const instagramSchema = z.object({
  enabled: z.boolean(),
  defaultLanguage: z.enum(['kz', 'ru']),
  accessToken: z.string().optional(),
  pageId: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookAppSecret: z.string().optional(),
});

const tiktokSchema = z.object({
  enabled: z.boolean(),
  defaultLanguage: z.enum(['kz', 'ru']),
  tiktokClientKey: z.string().optional(),
  tiktokClientSecret: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
  tiktokRefreshToken: z.string().optional(),
  tiktokOpenId: z.string().optional(),
});

const facebookSchema = z.object({
  enabled: z.boolean(),
  defaultLanguage: z.enum(['kz', 'ru']),
  facebookAccessToken: z.string().optional(),
  facebookPageId: z.string().optional(),
});

type TelegramFormData = z.infer<typeof telegramSchema>;
type InstagramFormData = z.infer<typeof instagramSchema>;
type TiktokFormData = z.infer<typeof tiktokSchema>;
type FacebookFormData = z.infer<typeof facebookSchema>;

export default function SocialMediaSettingsPage() {
  const { data: configs, isLoading, refetch } = useAllSocialMediaConfigs();
  const updateConfig = useUpdateSocialMediaConfig();
  const [activeTab, setActiveTab] = useState<string>(SocialMediaPlatform.TELEGRAM);
  const searchParams = useSearchParams();

  // TikTok OAuth state
  const [tiktokStatus, setTiktokStatus] = useState<{
    isConfigured: boolean;
    isAuthorized: boolean;
    enabled: boolean;
    openId: string | null;
  } | null>(null);
  const [isLoadingTiktokStatus, setIsLoadingTiktokStatus] = useState(false);
  const [isAuthorizingTiktok, setIsAuthorizingTiktok] = useState(false);

  // Check for TikTok OAuth callback result
  useEffect(() => {
    const tiktokAuth = searchParams.get('tiktok_auth');
    const message = searchParams.get('message');

    if (tiktokAuth === 'success') {
      toast.success('TikTok авторизация успешна!');
      refetch();
      fetchTiktokStatus();
      // Clean up URL
      window.history.replaceState({}, '', '/admin/settings/social-media');
    } else if (tiktokAuth === 'error') {
      toast.error(`Ошибка авторизации TikTok: ${message || 'Неизвестная ошибка'}`);
      window.history.replaceState({}, '', '/admin/settings/social-media');
    }
  }, [searchParams, refetch]);

  // Fetch TikTok authorization status
  const fetchTiktokStatus = async () => {
    setIsLoadingTiktokStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tiktok/status`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTiktokStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch TikTok status:', error);
    } finally {
      setIsLoadingTiktokStatus(false);
    }
  };

  useEffect(() => {
    fetchTiktokStatus();
  }, []);

  // Initiate TikTok OAuth
  const handleTiktokAuth = async () => {
    setIsAuthorizingTiktok(true);
    try {
      // Get auth URL from API (with JWT authentication)
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tiktok/auth-url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get auth URL');
      }

      const data = await response.json();
      // Redirect directly to TikTok OAuth page
      window.location.href = data.authUrl;
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
      setIsAuthorizingTiktok(false);
    }
  };

  // Refresh TikTok token
  const handleRefreshTiktokToken = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tiktok/refresh-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success('TikTok токен обновлен');
        fetchTiktokStatus();
      } else {
        const error = await response.json();
        toast.error(`Ошибка обновления токена: ${error.message}`);
      }
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    }
  };

  const telegramConfig = configs?.find(c => c.platform === SocialMediaPlatform.TELEGRAM);
  const instagramConfig = configs?.find(c => c.platform === SocialMediaPlatform.INSTAGRAM);
  const tiktokConfig = configs?.find(c => c.platform === SocialMediaPlatform.TIKTOK);
  const facebookConfig = configs?.find(c => c.platform === SocialMediaPlatform.FACEBOOK);

  const telegramForm = useForm<TelegramFormData>({
    resolver: zodResolver(telegramSchema),
    values: {
      enabled: telegramConfig?.enabled || false,
      defaultLanguage: (telegramConfig?.defaultLanguage as 'kz' | 'ru') || 'kz',
      botToken: telegramConfig?.botToken || '',
      chatId: telegramConfig?.chatId || '',
    },
  });

  const instagramForm = useForm<InstagramFormData>({
    resolver: zodResolver(instagramSchema),
    values: {
      enabled: instagramConfig?.enabled || false,
      defaultLanguage: (instagramConfig?.defaultLanguage as 'kz' | 'ru') || 'kz',
      accessToken: instagramConfig?.accessToken || '',
      pageId: instagramConfig?.pageId || '',
      webhookVerifyToken: instagramConfig?.webhookVerifyToken || '',
      webhookEnabled: instagramConfig?.webhookEnabled || false,
      webhookAppSecret: instagramConfig?.webhookAppSecret || '',
    },
  });

  const tiktokForm = useForm<TiktokFormData>({
    resolver: zodResolver(tiktokSchema),
    values: {
      enabled: tiktokConfig?.enabled || false,
      defaultLanguage: (tiktokConfig?.defaultLanguage as 'kz' | 'ru') || 'kz',
      tiktokClientKey: tiktokConfig?.tiktokClientKey || '',
      tiktokClientSecret: tiktokConfig?.tiktokClientSecret || '',
      tiktokAccessToken: tiktokConfig?.tiktokAccessToken || '',
      tiktokRefreshToken: tiktokConfig?.tiktokRefreshToken || '',
      tiktokOpenId: tiktokConfig?.tiktokOpenId || '',
    },
  });

  const facebookForm = useForm<FacebookFormData>({
    resolver: zodResolver(facebookSchema),
    values: {
      enabled: facebookConfig?.enabled || false,
      defaultLanguage: (facebookConfig?.defaultLanguage as 'kz' | 'ru') || 'kz',
      facebookAccessToken: facebookConfig?.facebookAccessToken || '',
      facebookPageId: facebookConfig?.facebookPageId || '',
    },
  });

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Get the webhook URL for Instagram
  const getWebhookUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin.replace('www.', '').replace(':3000', ':4000');
    return `${baseUrl}/api/webhooks/instagram`;
  };

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(getWebhookUrl());
      toast.success('URL скопирован в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать URL');
    }
  };

  // Generate new verify token
  const generateVerifyToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webhooks/instagram/generate-token`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        instagramForm.setValue('webhookVerifyToken', data.token);
        toast.success('Новый токен сгенерирован');
      } else {
        toast.error('Не удалось сгенерировать токен');
      }
    } catch {
      // Generate client-side as fallback
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      instagramForm.setValue('webhookVerifyToken', token);
      toast.success('Новый токен сгенерирован');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const onSubmitTelegram = (data: TelegramFormData) => {
    updateConfig.mutate(
      {
        platform: SocialMediaPlatform.TELEGRAM,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success('Настройки Telegram сохранены');
        },
        onError: (error: any) => {
          toast.error(`Ошибка: ${error.message}`);
        },
      }
    );
  };

  const onSubmitInstagram = (data: InstagramFormData) => {
    updateConfig.mutate(
      {
        platform: SocialMediaPlatform.INSTAGRAM,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success('Настройки Instagram сохранены');
        },
        onError: (error: any) => {
          toast.error(`Ошибка: ${error.message}`);
        },
      }
    );
  };

  const onSubmitTiktok = (data: TiktokFormData) => {
    updateConfig.mutate(
      {
        platform: SocialMediaPlatform.TIKTOK,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success('Настройки TikTok сохранены');
          fetchTiktokStatus(); // Update status after saving
        },
        onError: (error: any) => {
          toast.error(`Ошибка: ${error.message}`);
        },
      }
    );
  };

  const onSubmitFacebook = (data: FacebookFormData) => {
    updateConfig.mutate(
      {
        platform: SocialMediaPlatform.FACEBOOK,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success('Настройки Facebook сохранены');
        },
        onError: (error: any) => {
          toast.error(`Ошибка: ${error.message}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Настройки социальных сетей
        </h1>
        <p className="text-gray-600">
          Настройте интеграции с социальными сетями для автоматической публикации статей
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value={SocialMediaPlatform.TELEGRAM} className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Telegram</span>
          </TabsTrigger>
          <TabsTrigger value={SocialMediaPlatform.INSTAGRAM} className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            <span className="hidden sm:inline">Instagram</span>
          </TabsTrigger>
          <TabsTrigger value={SocialMediaPlatform.TIKTOK} className="flex items-center gap-2">
            <Music2 className="h-4 w-4" />
            <span className="hidden sm:inline">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value={SocialMediaPlatform.FACEBOOK} className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline">Facebook</span>
          </TabsTrigger>
        </TabsList>

        {/* Telegram Settings */}
        <TabsContent value={SocialMediaPlatform.TELEGRAM} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    Telegram Bot
                  </CardTitle>
                  <CardDescription>
                    Настройте Telegram бота для автоматической публикации статей
                  </CardDescription>
                </div>
                {telegramConfig?.enabled && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Активно</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={telegramForm.handleSubmit(onSubmitTelegram)} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="telegram-enabled" className="text-base font-medium">
                      Включить публикацию в Telegram
                    </Label>
                    <p className="text-sm text-gray-500">
                      Разрешить автоматическую публикацию статей в Telegram канал
                    </p>
                  </div>
                  <Switch
                    id="telegram-enabled"
                    checked={telegramForm.watch('enabled')}
                    onCheckedChange={(checked) => telegramForm.setValue('enabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-language">Язык публикации по умолчанию</Label>
                  <Select
                    value={telegramForm.watch('defaultLanguage')}
                    onValueChange={(value: 'kz' | 'ru') => telegramForm.setValue('defaultLanguage', value)}
                  >
                    <SelectTrigger id="telegram-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kz">Казахский</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      {...telegramForm.register('botToken')}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Получите токен у @BotFather в Telegram
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="chatId">Chat ID / Channel Username</Label>
                    <Input
                      id="chatId"
                      placeholder="@yourchannel или -1001234567890"
                      {...telegramForm.register('chatId')}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки Telegram'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instagram Settings */}
        <TabsContent value={SocialMediaPlatform.INSTAGRAM} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Instagram Business
                  </CardTitle>
                  <CardDescription>
                    Настройте Instagram Business Account для автоматической публикации
                  </CardDescription>
                </div>
                {instagramConfig?.enabled && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Активно</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={instagramForm.handleSubmit(onSubmitInstagram)} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="instagram-enabled" className="text-base font-medium">
                      Включить публикацию в Instagram
                    </Label>
                    <p className="text-sm text-gray-500">
                      Разрешить автоматическую публикацию статей в Instagram
                    </p>
                  </div>
                  <Switch
                    id="instagram-enabled"
                    checked={instagramForm.watch('enabled')}
                    onCheckedChange={(checked) => instagramForm.setValue('enabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram-language">Язык публикации по умолчанию</Label>
                  <Select
                    value={instagramForm.watch('defaultLanguage')}
                    onValueChange={(value: 'kz' | 'ru') => instagramForm.setValue('defaultLanguage', value)}
                  >
                    <SelectTrigger id="instagram-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kz">Казахский</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="text"
                      placeholder="Instagram Graph API Access Token"
                      {...instagramForm.register('accessToken')}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Получите долгосрочный токен через Meta for Developers
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pageId">Instagram Business Account ID</Label>
                    <Input
                      id="pageId"
                      placeholder="1234567890"
                      {...instagramForm.register('pageId')}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки Instagram'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Instagram Webhooks Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-purple-500" />
                    Instagram Webhooks
                  </CardTitle>
                  <CardDescription>
                    Настройте webhooks для получения уведомлений о комментариях и упоминаниях
                  </CardDescription>
                </div>
                {instagramConfig?.webhookEnabled && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Активно</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="webhook-enabled" className="text-base font-medium">
                    Включить webhooks
                  </Label>
                  <p className="text-sm text-gray-500">
                    Получать уведомления о событиях Instagram (комментарии, упоминания)
                  </p>
                </div>
                <Switch
                  id="webhook-enabled"
                  checked={instagramForm.watch('webhookEnabled') || false}
                  onCheckedChange={(checked) => instagramForm.setValue('webhookEnabled', checked)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>URL обратного вызова (Callback URL)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      readOnly
                      value={getWebhookUrl()}
                      className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyWebhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Используйте этот URL в настройках Webhooks в Meta Developer Console
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookVerifyToken">Подтверждение маркера (Verify Token)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="webhookVerifyToken"
                      placeholder="Токен для верификации webhook"
                      {...instagramForm.register('webhookVerifyToken')}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateVerifyToken}
                      disabled={isGeneratingToken}
                    >
                      {isGeneratingToken ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Этот токен будет использоваться для проверки подписки webhook в Meta
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookAppSecret">App Secret</Label>
                  <Input
                    id="webhookAppSecret"
                    type="password"
                    placeholder="Facebook App Secret для проверки подписи"
                    {...instagramForm.register('webhookAppSecret')}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Найдите в настройках приложения: Settings → Basic → App Secret
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Инструкция по настройке:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Перейдите в Meta Developer Console → ваше приложение</li>
                  <li>В разделе Instagram → Webhooks нажмите &quot;Configure&quot;</li>
                  <li>Вставьте Callback URL и Verify Token из полей выше</li>
                  <li>Выберите подписки: comments, mentions</li>
                  <li>Нажмите &quot;Подтвердить и сохранить&quot;</li>
                </ol>
              </div>

              <Button
                type="button"
                onClick={instagramForm.handleSubmit(onSubmitInstagram)}
                disabled={updateConfig.isPending}
              >
                {updateConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить настройки Webhooks'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TikTok Settings */}
        <TabsContent value={SocialMediaPlatform.TIKTOK} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Music2 className="h-5 w-5 text-black" />
                    TikTok Content Posting
                  </CardTitle>
                  <CardDescription>
                    Настройте TikTok для автоматической публикации фото-постов
                  </CardDescription>
                </div>
                {tiktokStatus?.isAuthorized && tiktokConfig?.enabled && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Авторизован и активен</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={tiktokForm.handleSubmit(onSubmitTiktok)} className="space-y-6">
                {/* Authorization Status Card */}
                <div className={`p-4 rounded-lg border ${
                  tiktokStatus?.isAuthorized
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isLoadingTiktokStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : tiktokStatus?.isAuthorized ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="font-medium">
                          {tiktokStatus?.isAuthorized
                            ? 'TikTok авторизован'
                            : 'TikTok не авторизован'}
                        </span>
                      </div>
                      {tiktokStatus?.openId && (
                        <p className="text-xs text-gray-500 font-mono">
                          Open ID: {tiktokStatus.openId.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {tiktokStatus?.isAuthorized && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRefreshTiktokToken}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Обновить токен
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant={tiktokStatus?.isAuthorized ? "outline" : "default"}
                        size="sm"
                        onClick={handleTiktokAuth}
                        disabled={!tiktokStatus?.isConfigured || isAuthorizingTiktok}
                      >
                        {isAuthorizingTiktok ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-1" />
                        )}
                        {tiktokStatus?.isAuthorized ? 'Переавторизовать' : 'Авторизоваться в TikTok'}
                      </Button>
                    </div>
                  </div>
                  {!tiktokStatus?.isConfigured && (
                    <p className="text-xs text-amber-600 mt-2">
                      Сначала введите Client Key и Client Secret ниже
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="tiktok-enabled" className="text-base font-medium">
                      Включить публикацию в TikTok
                    </Label>
                    <p className="text-sm text-gray-500">
                      Разрешить автоматическую публикацию фото-постов в TikTok
                    </p>
                  </div>
                  <Switch
                    id="tiktok-enabled"
                    checked={tiktokForm.watch('enabled')}
                    onCheckedChange={(checked) => tiktokForm.setValue('enabled', checked)}
                    disabled={!tiktokStatus?.isAuthorized}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok-language">Язык публикации по умолчанию</Label>
                  <Select
                    value={tiktokForm.watch('defaultLanguage')}
                    onValueChange={(value: 'kz' | 'ru') => tiktokForm.setValue('defaultLanguage', value)}
                  >
                    <SelectTrigger id="tiktok-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kz">Казахский</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tiktokClientKey">Client Key *</Label>
                    <Input
                      id="tiktokClientKey"
                      type="text"
                      placeholder="TikTok App Client Key"
                      {...tiktokForm.register('tiktokClientKey')}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получите в TikTok Developer Console
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tiktokClientSecret">Client Secret *</Label>
                    <Input
                      id="tiktokClientSecret"
                      type="text"
                      placeholder="TikTok App Client Secret"
                      {...tiktokForm.register('tiktokClientSecret')}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* OAuth Callback URL Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">OAuth Callback URL:</p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${process.env.NEXT_PUBLIC_API_URL}/tiktok/callback`}
                      className="font-mono text-xs bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/tiktok/callback`);
                        toast.success('URL скопирован');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Добавьте этот URL в настройках OAuth вашего TikTok приложения
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-1">Важно:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>TikTok Content Posting API требует аудита приложения</li>
                    <li>До аудита посты будут только приватными</li>
                    <li>Требуется изображение обложки статьи</li>
                    <li>После сохранения Client Key/Secret нажмите &quot;Авторизоваться&quot;</li>
                  </ul>
                </div>

                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки TikTok'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Инструкции по настройке TikTok</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ol className="space-y-2 list-decimal list-inside">
                <li>Перейдите на <a href="https://developers.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.tiktok.com</a></li>
                <li>Создайте новое приложение</li>
                <li>Добавьте продукт &quot;Content Posting API&quot;</li>
                <li>Получите Client Key и Client Secret</li>
                <li>В настройках OAuth добавьте Callback URL указанный выше</li>
                <li>Сохраните Client Key и Client Secret в форме выше</li>
                <li>Нажмите кнопку &quot;Авторизоваться в TikTok&quot;</li>
                <li>После успешной авторизации включите публикацию</li>
                <li>Подайте заявку на аудит для публичных постов</li>
              </ol>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Требуемые scopes:</p>
                <ul className="text-sm text-green-700 mt-1">
                  <li><code>user.info.basic</code> - базовая информация о пользователе</li>
                  <li><code>video.publish</code> - публикация видео/фото</li>
                  <li><code>video.upload</code> - загрузка контента</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facebook Settings */}
        <TabsContent value={SocialMediaPlatform.FACEBOOK} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    Facebook Page
                  </CardTitle>
                  <CardDescription>
                    Настройте Facebook Page для автоматической публикации статей
                  </CardDescription>
                </div>
                {facebookConfig?.enabled && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Активно</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={facebookForm.handleSubmit(onSubmitFacebook)} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="facebook-enabled" className="text-base font-medium">
                      Включить публикацию в Facebook
                    </Label>
                    <p className="text-sm text-gray-500">
                      Разрешить автоматическую публикацию статей на Facebook Page
                    </p>
                  </div>
                  <Switch
                    id="facebook-enabled"
                    checked={facebookForm.watch('enabled')}
                    onCheckedChange={(checked) => facebookForm.setValue('enabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook-language">Язык публикации по умолчанию</Label>
                  <Select
                    value={facebookForm.watch('defaultLanguage')}
                    onValueChange={(value: 'kz' | 'ru') => facebookForm.setValue('defaultLanguage', value)}
                  >
                    <SelectTrigger id="facebook-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kz">Казахский</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="facebookAccessToken">Page Access Token</Label>
                    <Input
                      id="facebookAccessToken"
                      type="text"
                      placeholder="Facebook Page Access Token"
                      {...facebookForm.register('facebookAccessToken')}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Получите долгосрочный Page Access Token через Graph API Explorer
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="facebookPageId">Page ID</Label>
                    <Input
                      id="facebookPageId"
                      placeholder="1234567890"
                      {...facebookForm.register('facebookPageId')}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      ID вашей Facebook Page (найдите в настройках страницы)
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить настройки Facebook'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Инструкции по настройке Facebook</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ol className="space-y-2">
                <li>Перейдите на <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
                <li>Создайте или выберите приложение типа &quot;Business&quot;</li>
                <li>Добавьте продукт &quot;Facebook Login&quot;</li>
                <li>В Graph API Explorer получите User Access Token</li>
                <li>Выберите нужные разрешения: pages_manage_posts, pages_read_engagement</li>
                <li>Обменяйте на долгосрочный токен (60 дней)</li>
                <li>Получите Page Access Token для вашей страницы</li>
              </ol>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">Совет:</p>
                <p className="text-sm text-blue-700">
                  Используйте &quot;Never Expiring Page Access Token&quot; для постоянной работы интеграции.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
