import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { InstagramWebhookEventType } from '@prisma/client';
import * as crypto from 'crypto';

interface InstagramWebhookEntry {
  id: string;
  time: number;
  changes?: Array<{
    field: string;
    value: any;
  }>;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
    };
    reaction?: {
      mid: string;
      action: string;
      reaction?: string;
    };
  }>;
}

interface InstagramWebhookPayload {
  object: string;
  entry: InstagramWebhookEntry[];
}

@Injectable()
export class InstagramWebhookService {
  private readonly logger = new Logger(InstagramWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify webhook signature from Meta
   * Uses HMAC SHA-256 with app secret
   */
  verifySignature(
    payload: string,
    signature: string,
    appSecret: string,
  ): boolean {
    if (!signature || !appSecret) {
      this.logger.warn('Missing signature or app secret for verification');
      return false;
    }

    // Signature format: sha256=<hash>
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      this.logger.warn('Invalid signature format');
      return false;
    }

    const expectedHash = signatureParts[1];
    const actualHash = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(actualHash),
    );

    if (!isValid) {
      this.logger.warn('Webhook signature verification failed');
    }

    return isValid;
  }

  /**
   * Handle verification challenge from Meta
   * Required for webhook subscription
   */
  async handleVerification(
    mode: string,
    token: string,
    challenge: string,
  ): Promise<{ valid: boolean; challenge?: string }> {
    this.logger.log(
      `Handling webhook verification: mode=${mode}, token=${token?.substring(0, 8)}..., challenge=${challenge?.substring(0, 20)}...`,
    );

    if (mode !== 'subscribe') {
      this.logger.warn(`Invalid mode: ${mode}, expected 'subscribe'`);
      return { valid: false };
    }

    if (!token) {
      this.logger.warn('No verify token provided in request');
      return { valid: false };
    }

    if (!challenge) {
      this.logger.warn('No challenge provided in request');
      return { valid: false };
    }

    // First check environment variable (fallback for initial setup)
    const envVerifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

    // Get stored verify token from database
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: 'INSTAGRAM' },
    });

    const storedToken = config?.webhookVerifyToken || envVerifyToken;

    if (!storedToken) {
      this.logger.error(
        'No webhook verify token configured in database or environment variable (INSTAGRAM_WEBHOOK_VERIFY_TOKEN)',
      );
      return { valid: false };
    }

    this.logger.log(
      `Comparing tokens: received=${token.substring(0, 8)}..., stored=${storedToken.substring(0, 8)}...`,
    );

    if (token !== storedToken) {
      this.logger.warn(
        `Token mismatch: received token does not match stored token`,
      );
      return { valid: false };
    }

    this.logger.log('Webhook verification successful - returning challenge');
    return { valid: true, challenge };
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(payload: InstagramWebhookPayload): Promise<void> {
    this.logger.log(
      `Processing webhook event: ${JSON.stringify(payload).substring(0, 200)}...`,
    );

    if (payload.object !== 'instagram') {
      this.logger.warn(`Unexpected object type: ${payload.object}`);
      return;
    }

    for (const entry of payload.entry) {
      const timestamp = new Date(entry.time * 1000);

      // Handle field changes (comments, mentions, etc.)
      if (entry.changes) {
        for (const change of entry.changes) {
          await this.processFieldChange(
            entry.id,
            change.field,
            change.value,
            timestamp,
            payload,
          );
        }
      }

      // Handle messaging events (DMs, reactions)
      if (entry.messaging) {
        for (const message of entry.messaging) {
          await this.processMessagingEvent(entry.id, message, payload);
        }
      }
    }
  }

  /**
   * Process field change events (comments, mentions, story_insights)
   */
  private async processFieldChange(
    accountId: string,
    field: string,
    value: any,
    timestamp: Date,
    rawPayload: InstagramWebhookPayload,
  ): Promise<void> {
    this.logger.log(`Processing field change: ${field}`);

    const eventType = this.mapFieldToEventType(field);
    if (!eventType) {
      this.logger.warn(`Unknown field type: ${field}`);
      return;
    }

    try {
      await this.prisma.instagramWebhookEvent.create({
        data: {
          eventType,
          mediaId: value.media?.id || value.media_id || null,
          commentId: value.id || null,
          userId: value.from?.id || null,
          username: value.from?.username || null,
          text: value.text || null,
          rawPayload: rawPayload as any,
          eventTimestamp: timestamp,
        },
      });

      this.logger.log(`Webhook event stored: ${eventType}`);

      // Process specific event types
      await this.handleEventByType(eventType, value, accountId);
    } catch (error: any) {
      this.logger.error(
        `Failed to store webhook event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process messaging events (DMs, reactions)
   */
  private async processMessagingEvent(
    accountId: string,
    message: any,
    rawPayload: InstagramWebhookPayload,
  ): Promise<void> {
    const timestamp = new Date(message.timestamp);
    let eventType: InstagramWebhookEventType;
    let text: string | null = null;

    if (message.message) {
      eventType = 'MESSAGES';
      text = message.message.text || null;
    } else if (message.reaction) {
      eventType = 'MESSAGE_REACTIONS';
      text = message.reaction.reaction || message.reaction.action;
    } else {
      this.logger.warn('Unknown messaging event type');
      return;
    }

    try {
      await this.prisma.instagramWebhookEvent.create({
        data: {
          eventType,
          userId: message.sender?.id || null,
          text,
          rawPayload: rawPayload as any,
          eventTimestamp: timestamp,
        },
      });

      this.logger.log(`Messaging event stored: ${eventType}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to store messaging event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Map Instagram webhook field to event type
   */
  private mapFieldToEventType(
    field: string,
  ): InstagramWebhookEventType | null {
    const fieldMap: Record<string, InstagramWebhookEventType> = {
      comments: 'COMMENTS',
      mentions: 'MENTIONS',
      story_insights: 'STORY_INSIGHTS',
      live_comments: 'LIVE_COMMENTS',
    };

    return fieldMap[field] || null;
  }

  /**
   * Handle specific event types (extensible for future features)
   */
  private async handleEventByType(
    eventType: InstagramWebhookEventType,
    value: any,
    accountId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'COMMENTS':
        this.logger.log(
          `New comment on media ${value.media?.id}: "${value.text?.substring(0, 50)}..."`,
        );
        // Future: Auto-reply, notification, moderation
        break;

      case 'MENTIONS':
        this.logger.log(`New mention from @${value.from?.username}`);
        // Future: Track mentions, send notifications
        break;

      case 'STORY_INSIGHTS':
        this.logger.log(`Story insights received for account ${accountId}`);
        // Future: Analytics dashboard
        break;

      case 'LIVE_COMMENTS':
        this.logger.log(`Live comment received`);
        // Future: Real-time comment display
        break;

      default:
        break;
    }
  }

  /**
   * Get recent webhook events
   */
  async getRecentEvents(
    limit: number = 50,
    eventType?: InstagramWebhookEventType,
  ) {
    return this.prisma.instagramWebhookEvent.findMany({
      where: eventType ? { eventType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get events by media ID
   */
  async getEventsByMediaId(mediaId: string) {
    return this.prisma.instagramWebhookEvent.findMany({
      where: { mediaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string) {
    return this.prisma.instagramWebhookEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(limit: number = 100) {
    return this.prisma.instagramWebhookEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Get webhook configuration status
   */
  async getWebhookStatus() {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: 'INSTAGRAM' },
      select: {
        webhookEnabled: true,
        webhookVerifyToken: true,
        webhookAppSecret: true,
        pageId: true,
      },
    });

    const recentEventsCount = await this.prisma.instagramWebhookEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      configured: !!(config?.webhookVerifyToken && config?.webhookAppSecret),
      enabled: config?.webhookEnabled || false,
      hasPageId: !!config?.pageId,
      recentEventsCount,
    };
  }

  /**
   * Generate a secure verify token
   */
  generateVerifyToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
