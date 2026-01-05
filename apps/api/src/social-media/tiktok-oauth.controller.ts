import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, SocialMediaPlatform } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { TiktokService } from './tiktok.service';
import * as crypto from 'crypto';

/**
 * TikTok OAuth Controller
 * Обрабатывает OAuth авторизацию для TikTok Content Posting API
 */
@Controller('tiktok')
export class TiktokOAuthController {
  private readonly logger = new Logger(TiktokOAuthController.name);

  // TikTok OAuth URLs
  private readonly TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
  private readonly TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

  // Required scopes for Content Posting API
  private readonly SCOPES = [
    'user.info.basic',
    'video.publish',
    'video.upload',
  ].join(',');

  constructor(
    private prisma: PrismaService,
    private tiktokService: TiktokService,
  ) {}

  /**
   * Инициировать OAuth авторизацию
   * GET /tiktok/auth
   * Перенаправляет пользователя на TikTok для авторизации
   * Использует PKCE (Proof Key for Code Exchange) для безопасности
   */
  @Get('auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async initiateAuth(@Res() res: Response) {
    try {
      // Получаем конфигурацию TikTok
      const config = await this.prisma.socialMediaConfig.findUnique({
        where: { platform: SocialMediaPlatform.TIKTOK },
      });

      if (!config?.tiktokClientKey) {
        throw new HttpException(
          'TikTok Client Key не настроен. Сначала укажите Client Key в настройках.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Генерируем CSRF state token
      const csrfState = crypto.randomBytes(16).toString('hex');

      // Генерируем PKCE code_verifier и code_challenge
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Сохраняем code_verifier в базе для использования при обмене токена
      await this.prisma.socialMediaConfig.update({
        where: { platform: SocialMediaPlatform.TIKTOK },
        data: {
          // Временно храним code_verifier в tiktokOpenId
          // После успешной авторизации это поле будет перезаписано реальным open_id
          tiktokOpenId: codeVerifier,
        },
      });

      // Формируем callback URL
      const apiUrl = process.env.API_URL || 'https://aimaqaqshamy.kz';
      const redirectUri = `${apiUrl}/api/tiktok/callback`;

      // Формируем URL авторизации TikTok с PKCE (trim client_key)
      const authUrl = new URL(this.TIKTOK_AUTH_URL);
      authUrl.searchParams.set('client_key', config.tiktokClientKey.trim());
      authUrl.searchParams.set('scope', this.SCOPES);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', csrfState);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      this.logger.log(`Redirecting to TikTok OAuth with PKCE: ${authUrl.toString()}`);

      // Перенаправляем на TikTok
      return res.redirect(authUrl.toString());
    } catch (error: any) {
      this.logger.error(`Failed to initiate TikTok auth: ${error.message}`);

      const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
      return res.redirect(
        `${frontendUrl}/admin/settings/social-media?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * Обработка callback от TikTok
   * GET /tiktok/callback
   * TikTok перенаправляет сюда после авторизации
   * Публичный endpoint - TikTok делает redirect без JWT токена
   */
  @Public()
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://aimaqaqshamy.kz';
    const redirectUrl = `${frontendUrl}/admin/settings/social-media`;

    try {
      // Проверяем на ошибку от TikTok
      if (error) {
        throw new HttpException(
          `TikTok error: ${errorDescription || error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!code) {
        throw new HttpException(
          'Authorization code not received from TikTok',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log('Received TikTok callback, exchanging code for tokens...');

      // Получаем конфигурацию TikTok
      const config = await this.prisma.socialMediaConfig.findUnique({
        where: { platform: SocialMediaPlatform.TIKTOK },
      });

      if (!config?.tiktokClientKey || !config?.tiktokClientSecret) {
        throw new HttpException(
          'TikTok Client Key or Secret not configured',
          HttpStatus.BAD_REQUEST,
        );
      }

      const apiUrl = process.env.API_URL || 'https://aimaqaqshamy.kz';
      const redirectUri = `${apiUrl}/api/tiktok/callback`;

      // Get code_verifier that was stored during auth initiation
      const codeVerifier = config.tiktokOpenId || '';

      // Обмениваем authorization code на access token (trim keys)
      const tokenResponse = await this.exchangeCodeForToken(
        config.tiktokClientKey.trim(),
        config.tiktokClientSecret.trim(),
        code,
        redirectUri,
        codeVerifier,
      );

      // Сохраняем токены в базе данных
      await this.prisma.socialMediaConfig.update({
        where: { platform: SocialMediaPlatform.TIKTOK },
        data: {
          tiktokAccessToken: tokenResponse.access_token,
          tiktokRefreshToken: tokenResponse.refresh_token,
          tiktokOpenId: tokenResponse.open_id,
          enabled: true,
        },
      });

      this.logger.log(`TikTok OAuth completed successfully. Open ID: ${tokenResponse.open_id}`);

      // Перенаправляем обратно в админ-панель с успешным сообщением
      return res.redirect(`${redirectUrl}?tiktok_auth=success`);
    } catch (error: any) {
      this.logger.error(`TikTok OAuth callback error: ${error.message}`);
      return res.redirect(
        `${redirectUrl}?tiktok_auth=error&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * Получить URL для авторизации (для фронтенда)
   * GET /tiktok/auth-url
   */
  @Get('auth-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAuthUrl() {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.TIKTOK },
    });

    if (!config?.tiktokClientKey) {
      throw new HttpException(
        'TikTok Client Key не настроен',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Use production URL, fallback to env variable
    const apiUrl = process.env.API_URL || 'https://aimaqaqshamy.kz';
    const redirectUri = `${apiUrl}/api/tiktok/callback`;

    const csrfState = crypto.randomBytes(16).toString('hex');

    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store code_verifier in database for later use in token exchange
    await this.prisma.socialMediaConfig.update({
      where: { platform: SocialMediaPlatform.TIKTOK },
      data: {
        // Store code_verifier temporarily (we'll use a field for this)
        tiktokOpenId: codeVerifier, // Temporarily store here, will be overwritten after auth
      },
    });

    // Trim client_key to remove any leading/trailing spaces
    const clientKey = config.tiktokClientKey.trim();

    const authUrl = new URL(this.TIKTOK_AUTH_URL);
    authUrl.searchParams.set('client_key', clientKey);
    authUrl.searchParams.set('scope', this.SCOPES);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', csrfState);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return {
      authUrl: authUrl.toString(),
      redirectUri,
    };
  }

  /**
   * Обновить access token
   * GET /tiktok/refresh-token
   */
  @Get('refresh-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async refreshToken() {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.TIKTOK },
    });

    if (!config?.tiktokClientKey || !config?.tiktokClientSecret || !config?.tiktokRefreshToken) {
      throw new HttpException(
        'TikTok не авторизован. Сначала пройдите авторизацию.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const newTokens = await this.tiktokService.refreshAccessToken(
        config.tiktokClientKey,
        config.tiktokClientSecret,
        config.tiktokRefreshToken,
      );

      // Обновляем токены в базе
      await this.prisma.socialMediaConfig.update({
        where: { platform: SocialMediaPlatform.TIKTOK },
        data: {
          tiktokAccessToken: newTokens.accessToken,
          tiktokRefreshToken: newTokens.refreshToken,
        },
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        expiresIn: newTokens.expiresIn,
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to refresh token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Проверить статус авторизации
   * GET /tiktok/status
   * Публичный endpoint - возвращает только статус без секретных данных
   */
  @Public()
  @Get('status')
  async getStatus() {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.TIKTOK },
    });

    return {
      isConfigured: !!(config?.tiktokClientKey && config?.tiktokClientSecret),
      isAuthorized: !!(config?.tiktokAccessToken && config?.tiktokOpenId),
      enabled: config?.enabled || false,
      openId: config?.tiktokOpenId || null,
    };
  }

  /**
   * Обменять authorization code на access token
   */
  private async exchangeCodeForToken(
    clientKey: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    open_id: string;
    expires_in: number;
    refresh_expires_in: number;
    scope: string;
  }> {
    const axios = require('axios');

    try {
      const response = await axios.post(
        this.TIKTOK_TOKEN_URL,
        new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.error) {
        throw new Error(response.data.error_description || response.data.error);
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error_description || error.message;
      this.logger.error(`Failed to exchange code for token: ${errorMessage}`);
      throw new HttpException(
        `TikTok token exchange failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
