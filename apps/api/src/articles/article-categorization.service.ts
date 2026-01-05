import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenRouterRetryUtil } from '../common/utils/openrouter-retry.util';

/**
 * Сервис для автоматической категоризации статей с использованием OpenRouter (Qwen)
 */
@Injectable()
export class ArticleCategorizationService {
  private openrouterApiKey: string | null = null;
  private openrouterModel: string;

  constructor() {
    // Initialize OpenRouter API key
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';
  }

  /**
   * Определить категорию для статьи на основе её содержимого
   */
  async categorizeArticle(
    article: { titleKz: string; contentKz: string; excerptKz?: string | null },
    categories: Array<{
      slug: string;
      nameKz: string;
      nameRu: string;
      descriptionKz: string | null;
      descriptionRu: string | null;
    }>
  ): Promise<string | null> {
    if (!this.openrouterApiKey) {
      throw new BadRequestException(
        'AI categorization is not configured. Please set OPENROUTER_API_KEY environment variable.'
      );
    }

    const categoriesDesc = this.getCategoriesDescription(categories);
    const prompt = this.buildPrompt(article, categoriesDesc);
    const validSlugs = categories.map(c => c.slug);

    let aiResponse: string | null = null;

    // Use OpenRouter (Qwen)
    aiResponse = await this.categorizeWithOpenRouter(prompt);

    if (!aiResponse) {
      return null;
    }

    // Extract and validate slug from response
    const suggestedSlug = this.extractSlugFromResponse(aiResponse, validSlugs);

    if (suggestedSlug) {
      return suggestedSlug;
    }

    console.error(`AI returned invalid category slug. Response: "${aiResponse.substring(0, 100)}"`);
    return null;
  }

  /**
   * Извлечь slug категории из ответа AI
   */
  private extractSlugFromResponse(response: string, validSlugs: string[]): string | null {
    const cleaned = response.toLowerCase().trim();

    // Проверяем, является ли весь ответ валидным slug
    if (validSlugs.includes(cleaned)) {
      return cleaned;
    }

    // Пробуем найти валидный slug в ответе
    for (const slug of validSlugs) {
      if (cleaned.includes(slug)) {
        return slug;
      }
    }

    // Пробуем взять первое слово
    const firstWord = cleaned.split(/\s+/)[0].replace(/[^a-z]/g, '');
    if (validSlugs.includes(firstWord)) {
      return firstWord;
    }

    return null;
  }

  /**
   * Описание категорий для AI
   */
  private getCategoriesDescription(
    categories: Array<{
      slug: string;
      nameKz: string;
      nameRu: string;
      descriptionKz: string | null;
      descriptionRu: string | null;
    }>
  ): string {
    return categories
      .map(cat => {
        return `- ${cat.slug} (${cat.nameKz} / ${cat.nameRu}): ${cat.descriptionRu || cat.descriptionKz || 'Без описания'}`;
      })
      .join('\n');
  }

  /**
   * Построить промпт для AI
   */
  private buildPrompt(
    article: { titleKz: string; contentKz: string; excerptKz?: string | null },
    categoriesDesc: string
  ): string {
    return `Categorize this article. Respond with ONLY ONE WORD - the category slug.

ARTICLE:
Title: ${article.titleKz}
${article.excerptKz ? `Excerpt: ${article.excerptKz}` : ''}
Content: ${article.contentKz.substring(0, 1500)}${article.contentKz.length > 1500 ? '...' : ''}

AVAILABLE CATEGORIES:
${categoriesDesc}

RULES:
- kazakhmys: Kazakhmys company or mining industry news
- sayasat: Politics, government, policy
- madeniyet: Culture, art, literature
- qogam: Society, social issues
- ozekti: Important/urgent news that doesn't fit other categories
- zhanalyqtar: General news

RESPOND WITH ONLY THE SLUG (one word), nothing else. Example: zhanalyqtar`;
  }

  /**
   * Категоризация через OpenRouter (Qwen) (с retry для rate limit)
   */
  private async categorizeWithOpenRouter(prompt: string): Promise<string | null> {
    if (!this.openrouterApiKey) {
      return null;
    }

    try {
      const response = await OpenRouterRetryUtil.executeWithRetry(
        {
          url: 'https://openrouter.ai/api/v1/chat/completions',
          method: 'POST',
          data: {
            model: this.openrouterModel,
            messages: [
              {
                role: 'user',
                content: prompt + '\n\nREMEMBER: Output ONLY the category slug word, nothing else!',
              },
            ],
            temperature: 0,
            max_tokens: 10,
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'HTTP-Referer': 'https://aimak.kz',
            'X-Title': 'AIMAK News',
          },
        },
        {
          maxRetries: 2,
          baseDelay: 2000,
        },
      );

      if (!response?.choices || response.choices.length === 0) {
        throw new Error('Invalid response from OpenRouter: no choices');
      }

      const choice = response.choices[0];
      const message = choice?.message;

      if (!message?.content) {
        throw new Error('Empty response from OpenRouter');
      }

      const messageContent = message.content.trim();

      if (!messageContent || messageContent.length === 0) {
        throw new Error('Empty response from OpenRouter');
      }

      return messageContent;
    } catch (error) {
      console.error('OpenRouter categorization error:', error);
      throw error;
    }
  }
}
