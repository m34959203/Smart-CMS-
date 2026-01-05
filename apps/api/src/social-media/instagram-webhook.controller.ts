import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Logger,
  RawBodyRequest,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InstagramWebhookService } from './instagram-webhook.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, InstagramWebhookEventType } from '@prisma/client';

@Controller('webhooks/instagram')
export class InstagramWebhookController {
  private readonly logger = new Logger(InstagramWebhookController.name);

  constructor(
    private readonly webhookService: InstagramWebhookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /webhooks/instagram
   * Webhook verification endpoint for Meta
   * Called when subscribing to webhooks in the Meta Developer Console
   */
  @Public()
  @Get()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log('=== Instagram Webhook Verification Request ===');
    this.logger.log(`Query params: mode=${mode}, token=${token?.substring(0, 12)}..., challenge exists=${!!challenge}`);

    try {
      const result = await this.webhookService.handleVerification(
        mode,
        token,
        challenge,
      );

      if (result.valid && result.challenge) {
        // Must return the challenge value as plain text (Meta requirement)
        this.logger.log(`Verification successful - returning challenge: ${result.challenge.substring(0, 20)}...`);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(HttpStatus.OK).send(result.challenge);
      }

      this.logger.warn('Verification failed - invalid credentials');
      return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
    } catch (error: any) {
      this.logger.error(`Verification error: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal error');
    }
  }

  /**
   * POST /webhooks/instagram
   * Receive webhook events from Meta
   * This endpoint receives all Instagram webhook notifications
   */
  @Public()
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Res() res: Response,
  ) {
    this.logger.log('Received webhook event');

    // Get app secret for signature verification
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: 'INSTAGRAM' },
      select: { webhookAppSecret: true, webhookEnabled: true },
    });

    // Check if webhooks are enabled
    if (!config?.webhookEnabled) {
      this.logger.warn('Webhooks are disabled, ignoring event');
      // Still return 200 to acknowledge receipt (Meta requirement)
      return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
    }

    // Verify signature if app secret is configured
    if (config?.webhookAppSecret) {
      const signature = req.headers['x-hub-signature-256'] as string;
      const rawBody = req.rawBody?.toString() || JSON.stringify(body);

      if (
        !this.webhookService.verifySignature(
          rawBody,
          signature,
          config.webhookAppSecret,
        )
      ) {
        this.logger.error('Signature verification failed');
        return res.status(HttpStatus.FORBIDDEN).send('Invalid signature');
      }
    }

    // Process the webhook event asynchronously
    // We respond immediately to Meta and process in background
    this.webhookService.processWebhookEvent(body).catch((error) => {
      this.logger.error(`Error processing webhook: ${error.message}`);
    });

    // Meta requires 200 response within 20 seconds
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  /**
   * GET /webhooks/instagram/status
   * Get webhook configuration status (Admin only)
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getWebhookStatus() {
    return this.webhookService.getWebhookStatus();
  }

  /**
   * GET /webhooks/instagram/events
   * Get recent webhook events (Admin only)
   */
  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getRecentEvents(
    @Query('limit') limit?: string,
    @Query('type') type?: InstagramWebhookEventType,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.webhookService.getRecentEvents(
      Math.min(parsedLimit, 100),
      type,
    );
  }

  /**
   * GET /webhooks/instagram/events/unprocessed
   * Get unprocessed webhook events (Admin only)
   */
  @Get('events/unprocessed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUnprocessedEvents(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.webhookService.getUnprocessedEvents(
      Math.min(parsedLimit, 100),
    );
  }

  /**
   * GET /webhooks/instagram/events/media/:mediaId
   * Get webhook events for a specific media (Admin only)
   */
  @Get('events/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getEventsByMedia(@Param('mediaId') mediaId: string) {
    return this.webhookService.getEventsByMediaId(mediaId);
  }

  /**
   * POST /webhooks/instagram/events/:eventId/process
   * Mark event as processed (Admin only)
   */
  @Post('events/:eventId/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async markEventProcessed(@Param('eventId') eventId: string) {
    return this.webhookService.markEventProcessed(eventId);
  }

  /**
   * GET /webhooks/instagram/generate-token
   * Generate a new verify token (Admin only)
   */
  @Get('generate-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async generateVerifyToken() {
    const token = this.webhookService.generateVerifyToken();
    return { token };
  }
}
