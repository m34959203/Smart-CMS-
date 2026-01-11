import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  TranslateDto,
  TranslateArticleDto,
  TranslationLanguage,
} from './dto/translate.dto';
import { AIService } from '../common/ai/ai.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private readonly aiService: AIService) {
    if (!this.aiService.isAvailable()) {
      this.logger.error(
        'No AI provider configured! Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      );
    } else {
      const provider = this.aiService.getActiveProvider();
      this.logger.log(`Using ${provider?.toUpperCase()} for translations`);
    }
  }

  /**
   * Translate a single text from one language to another
   */
  async translateText(dto: TranslateDto): Promise<{ translatedText: string }> {
    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException(
        'Source and target languages must be different',
      );
    }

    if (!this.aiService.isAvailable()) {
      throw new BadRequestException(
        'Translation service not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      );
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const systemPrompt = `You are a professional translator specializing in ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]} translation. Translate accurately while preserving meaning, tone, cultural context, and any HTML formatting. Return ONLY the translated text.`;

    const prompt = `Translate from ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]}:

${dto.text}`;

    try {
      const result = await this.aiService.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 8192,
      });

      this.logger.log(
        `Translation completed using ${result.provider}/${result.model}`,
      );

      return { translatedText: result.content.trim() };
    } catch (error) {
      this.logger.error('Translation error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Translation failed',
      );
    }
  }

  /**
   * Translate an entire article (title, excerpt, content)
   */
  async translateArticle(dto: TranslateArticleDto): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException(
        'Source and target languages must be different',
      );
    }

    if (!dto.title || !dto.content) {
      throw new BadRequestException(
        'Title and content are required for translation',
      );
    }

    if (!this.aiService.isAvailable()) {
      throw new BadRequestException(
        'Translation service not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      );
    }

    const CHUNKED_THRESHOLD = 12000;
    if (dto.content.length > CHUNKED_THRESHOLD) {
      this.logger.log(
        `Large content (${dto.content.length} chars), using chunked translation`,
      );
      return this.translateArticleChunked(dto);
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const systemPrompt = `You are a professional news translator for a bilingual news website. Translate accurately while preserving journalistic tone, HTML formatting, proper names, numbers, and dates.`;

    const prompt = `Translate this news article from ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]}.

ARTICLE:
Title: ${dto.title}
${dto.excerpt ? `Excerpt: ${dto.excerpt}` : ''}
Content: ${dto.content}

Return as JSON:
{
  "title": "Translated title",
  ${dto.excerpt ? '"excerpt": "Translated excerpt",' : ''}
  "content": "Translated content"
}

Return ONLY the JSON object.`;

    try {
      const result = await this.aiService.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 8192,
      });

      const translation = this.aiService.parseJsonResponse<{
        title: string;
        excerpt?: string;
        content: string;
      }>(result.content);

      this.logger.log(
        `Article translation completed using ${result.provider}/${result.model}`,
      );

      return {
        title: translation.title,
        excerpt: dto.excerpt ? translation.excerpt : undefined,
        content: translation.content,
      };
    } catch (error) {
      this.logger.error('Article translation error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Translation failed',
      );
    }
  }

  /**
   * Translate large articles in chunks
   */
  private async translateArticleChunked(dto: TranslateArticleDto): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    const MAX_CHUNK_SIZE = 8000;
    const CHUNK_DELAY_MS = 3000;

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    // Split content into chunks
    const chunks = this.splitContentIntoChunks(dto.content, MAX_CHUNK_SIZE);
    this.logger.log(`Content split into ${chunks.length} chunks`);

    // Translate title and excerpt
    let title = dto.title;
    let excerpt = dto.excerpt;

    try {
      const headerPrompt = `Translate from ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]}:

Title: ${dto.title}
${dto.excerpt ? `Excerpt: ${dto.excerpt}` : ''}

Return as JSON:
{
  "title": "Translated title"${dto.excerpt ? ',\n  "excerpt": "Translated excerpt"' : ''}
}`;

      const headerResult = await this.aiService.complete({
        prompt: headerPrompt,
        temperature: 0.3,
        maxTokens: 2048,
      });

      const parsed = this.aiService.parseJsonResponse<{
        title: string;
        excerpt?: string;
      }>(headerResult.content);

      title = parsed.title || dto.title;
      excerpt = dto.excerpt ? parsed.excerpt : undefined;

      await this.delay(CHUNK_DELAY_MS);
    } catch (error) {
      this.logger.warn('Failed to translate title/excerpt:', error);
    }

    // Translate content chunks sequentially
    const translatedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      this.logger.log(
        `Translating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`,
      );

      try {
        const chunkPrompt = `Translate this HTML content from ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]}.

IMPORTANT: Preserve ALL HTML tags exactly. Translate only the text content.

${chunks[i]}`;

        const result = await this.aiService.complete({
          prompt: chunkPrompt,
          temperature: 0.3,
          maxTokens: 8192,
        });

        translatedChunks.push(result.content.trim());
        this.logger.log(`Chunk ${i + 1} completed`);
      } catch (error) {
        this.logger.warn(`Chunk ${i + 1} failed, using original:`, error);
        translatedChunks.push(chunks[i]);
      }

      if (i < chunks.length - 1) {
        await this.delay(CHUNK_DELAY_MS);
      }
    }

    return {
      title,
      excerpt,
      content: translatedChunks.join(''),
    };
  }

  private splitContentIntoChunks(
    content: string,
    maxChunkSize: number,
  ): string[] {
    const chunks: string[] = [];
    const parts = content.split(/(<\/p>)/i);
    let currentChunk = '';

    for (const part of parts) {
      if (
        currentChunk.length + part.length > maxChunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [content];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
