import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { TranslateDto, TranslateArticleDto, TranslationLanguage } from './dto/translate.dto';
import { AILoggingService } from '../common/services/ai-logging.service';
import { OpenRouterRetryUtil } from '../common/utils/openrouter-retry.util';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly aiLogging = new AILoggingService();
  private readonly openrouterApiKey: string;
  private readonly openrouterModel: string;

  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

    // Validate that OpenRouter API key is configured
    if (!this.openrouterApiKey || this.openrouterApiKey.length === 0) {
      this.logger.error('❌ CRITICAL: OPENROUTER_API_KEY not configured!');
      this.logger.error('Please set OPENROUTER_API_KEY environment variable.');
      this.logger.error('Get your API key at: https://openrouter.ai/keys');
    } else {
      this.logger.log('✅ Using OpenRouter (Qwen) API for translations');
      this.logger.log(`📊 Model: ${this.openrouterModel}`);
    }

    this.aiLogging.logConfigCheck('TranslationService', {
      openrouterApiKeySet: !!this.openrouterApiKey,
      model: this.openrouterModel,
    });
  }

  /**
   * Translate a single text from one language to another
   */
  async translateText(dto: TranslateDto): Promise<{ translatedText: string }> {
    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException('Source and target languages must be different');
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `You are a professional translator specializing in ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]} translation.

Your task is to translate the following text accurately while preserving:
- The original meaning and tone
- Cultural context and nuances
- HTML tags and formatting (if present)
- Technical terms appropriately

Source language: ${languageNames[dto.sourceLanguage]}
Target language: ${languageNames[dto.targetLanguage]}

Text to translate:
${dto.text}

IMPORTANT: Return ONLY the translated text without any explanations, notes, or additional commentary.`;

    const callId = this.aiLogging.logCall('TranslationService', 'translateText', {
      sourceLanguage: dto.sourceLanguage,
      targetLanguage: dto.targetLanguage,
      textLength: dto.text.length,
    });

    const startTime = Date.now();

    if (!this.openrouterApiKey || this.openrouterApiKey.length === 0) {
      this.logger.error('❌ Translation failed: OPENROUTER_API_KEY not configured');
      this.logger.error('Please set OPENROUTER_API_KEY environment variable');
      this.logger.error('Get your API key at: https://openrouter.ai/keys');
      throw new BadRequestException(
        'Translation service is not configured. Please set OPENROUTER_API_KEY environment variable. Get your API key at: https://openrouter.ai/keys',
      );
    }

    console.log('✨ Using OpenRouter (Qwen) API for translation');
    try {
      // Step 1: Validate configuration
      this.aiLogging.logValidation(callId, {
        apiKeyPresent: !!this.openrouterApiKey,
        apiKeyLength: this.openrouterApiKey?.length || 0,
        apiKeyFormat: this.openrouterApiKey?.startsWith('sk-or-') ? 'valid' : 'invalid',
        model: this.openrouterModel,
      });

      // Step 2: Prepare OpenRouter API request
      const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

      const requestConfig = {
        url: apiUrl,
        method: 'POST',
        data: {
          model: this.openrouterModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        },
      };

      this.aiLogging.logSending(callId, requestConfig);

      // Execute with retry logic
      const response = await OpenRouterRetryUtil.executeWithRetry(
        {
          url: apiUrl,
          method: 'POST',
          data: requestConfig.data,
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

      // Validate response structure
      if (!response?.choices || response.choices.length === 0) {
        console.error('Invalid OpenRouter response: no choices array');
        console.error('Response data:', JSON.stringify(response));
        throw new Error('Invalid response from OpenRouter: no choices');
      }

      const choice = response.choices[0];
      const message = choice?.message;

      if (!message?.content) {
        console.error('Invalid OpenRouter response: no content in message');
        console.error('Choice:', JSON.stringify(choice));
        throw new Error('Empty response from OpenRouter');
      }

      const translatedText = message.content.trim();
      const duration = Date.now() - startTime;
      this.aiLogging.logSuccess(callId, { data: response }, duration);
      console.log('✅ OpenRouter translation successful');
      return { translatedText };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.aiLogging.logError(callId, error, duration);
      console.error('❌ OpenRouter translation error:', error);

      // OpenRouterRetryUtil will throw proper HttpException with correct status codes
      // Just re-throw it to preserve the status code
      throw error;
    }
  }

  /**
   * Translate an entire article (title, excerpt, content)
   * For large content (>15000 chars), uses chunked translation
   */
  async translateArticle(dto: TranslateArticleDto): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    console.log('Translation request received:', {
      titleLength: dto.title?.length,
      contentLength: dto.content?.length,
      excerptLength: dto.excerpt?.length,
      sourceLanguage: dto.sourceLanguage,
      targetLanguage: dto.targetLanguage,
    });

    if (dto.sourceLanguage === dto.targetLanguage) {
      throw new BadRequestException('Source and target languages must be different');
    }

    // Validate input data
    if (!dto.title || !dto.content) {
      throw new BadRequestException('Title and content are required for translation');
    }

    const CHUNKED_THRESHOLD = 12000; // Use chunked translation for content > 12KB
    const contentLength = dto.content?.length || 0;

    // Use chunked translation for large content
    if (contentLength > CHUNKED_THRESHOLD) {
      console.log(`Large content detected (${contentLength} chars). Using chunked translation...`);
      return this.translateArticleChunked(dto);
    }

    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `You are a professional news translator specializing in ${languageNames[dto.sourceLanguage]} to ${languageNames[dto.targetLanguage]} translation for a bilingual news website.

Your task is to translate ALL parts of the following news article accurately while preserving:
- Journalistic tone and style
- Cultural context and nuances
- HTML tags and formatting (if present)
- Proper names (people, places, organizations)
- Numbers, dates, and statistics

Source language: ${languageNames[dto.sourceLanguage]}
Target language: ${languageNames[dto.targetLanguage]}

ARTICLE TO TRANSLATE:

Title: ${dto.title}

${dto.excerpt ? `Excerpt: ${dto.excerpt}` : ''}

Content: ${dto.content}

Return your translation as a JSON object with this EXACT structure:
{
  "title": "Translated title",
  ${dto.excerpt ? '"excerpt": "Translated excerpt",' : ''}
  "content": "Translated content"
}

IMPORTANT: Return ONLY the JSON object, no additional text or explanations.`;

    if (!this.openrouterApiKey || this.openrouterApiKey.length === 0) {
      this.logger.error('❌ Translation failed: OPENROUTER_API_KEY not configured');
      this.logger.error('Please set OPENROUTER_API_KEY environment variable');
      this.logger.error('Get your API key at: https://openrouter.ai/keys');
      throw new BadRequestException(
        'Translation service is not configured. Please set OPENROUTER_API_KEY environment variable. Get your API key at: https://openrouter.ai/keys',
      );
    }

    try {
      console.log('✨ Using OpenRouter (Qwen) API for article translation');

      const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

      // Execute with retry logic
      const response = await OpenRouterRetryUtil.executeWithRetry(
        {
          url: apiUrl,
          method: 'POST',
          data: {
            model: this.openrouterModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 8192,
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

      console.log('OpenRouter API response received');

      // Validate response structure
      if (!response?.choices || response.choices.length === 0) {
        console.error('Invalid OpenRouter response: no choices array');
        console.error('Response data:', JSON.stringify(response));
        throw new Error('Invalid response from OpenRouter: no choices');
      }

      const choice = response.choices[0];
      const message = choice?.message;

      if (!message?.content) {
        console.error('Invalid OpenRouter response: no content in message');
        console.error('Choice:', JSON.stringify(choice));
        throw new Error('Empty response from OpenRouter');
      }

      const aiResponse = message.content;

      // Extract JSON from the response (handle markdown code blocks)
      const translation = this.extractJsonFromResponse(aiResponse);
      if (!translation) {
        console.error('Failed to extract JSON from response:', aiResponse.substring(0, 500));
        throw new Error('Failed to parse translation response');
      }
      console.log('✅ OpenRouter article translation successful');

      return {
        title: translation.title as string,
        excerpt: dto.excerpt ? (translation.excerpt as string) : undefined,
        content: translation.content as string,
      };
    } catch (error) {
      console.error('Article translation error:', error);

      // Handle parsing errors specifically
      if (error instanceof Error && error.message?.includes('Failed to parse')) {
        throw new BadRequestException(
          'Translation returned invalid format. Please try again.',
        );
      }

      // OpenRouterRetryUtil will throw proper HttpException with correct status codes
      // Just re-throw it to preserve the status code
      throw error;
    }
  }

  /**
   * Extract JSON from AI response, handling markdown code blocks
   */
  private extractJsonFromResponse(response: string): Record<string, unknown> | null {
    try {
      // Try to find JSON in markdown code block first
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        const jsonStr = codeBlockMatch[1].trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Try direct JSON extraction
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  /**
   * Split HTML content into chunks by paragraphs
   */
  private splitContentIntoChunks(content: string, maxChunkSize: number = 15000): string[] {
    const chunks: string[] = [];
    const parts = content.split(/(<\/p>)/i);
    let currentChunk = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (currentChunk.length + part.length > maxChunkSize && currentChunk.length > 0) {
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

  /**
   * Translate a single content chunk
   */
  private async translateContentChunk(
    content: string,
    sourceLanguage: TranslationLanguage,
    targetLanguage: TranslationLanguage,
  ): Promise<string> {
    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `You are a professional translator. Translate the following HTML content from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

IMPORTANT:
- Preserve ALL HTML tags and formatting exactly
- Translate only the text content, not the tags
- Return ONLY the translated HTML, no explanations

Content to translate:
${content}`;

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await OpenRouterRetryUtil.executeWithRetry(
      {
        url: apiUrl,
        method: 'POST',
        data: {
          model: this.openrouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 8192,
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openrouterApiKey}`,
          'HTTP-Referer': 'https://aimak.kz',
          'X-Title': 'AIMAK News',
        },
      },
      { maxRetries: 2, baseDelay: 2000 },
    );

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Empty response from translation API');
    }

    return response.choices[0].message.content.trim();
  }

  /**
   * Translate title and excerpt only (for chunked translation)
   */
  private async translateTitleAndExcerpt(
    title: string,
    excerpt: string | undefined,
    sourceLanguage: TranslationLanguage,
    targetLanguage: TranslationLanguage,
  ): Promise<{ title: string; excerpt?: string }> {
    const languageNames = {
      [TranslationLanguage.KAZAKH]: 'Kazakh (Қазақ тілі)',
      [TranslationLanguage.RUSSIAN]: 'Russian (Русский)',
    };

    const prompt = `Translate the following news article metadata from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

Title: ${title}
${excerpt ? `Excerpt: ${excerpt}` : ''}

Return as JSON:
{
  "title": "Translated title"${excerpt ? ',\n  "excerpt": "Translated excerpt"' : ''}
}

IMPORTANT: Return ONLY the JSON object.`;

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await OpenRouterRetryUtil.executeWithRetry(
      {
        url: apiUrl,
        method: 'POST',
        data: {
          model: this.openrouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2048,
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openrouterApiKey}`,
          'HTTP-Referer': 'https://aimak.kz',
          'X-Title': 'AIMAK News',
        },
      },
      { maxRetries: 2, baseDelay: 1000 },
    );

    const aiResponse = response?.choices?.[0]?.message?.content || '';
    const result = this.extractJsonFromResponse(aiResponse);
    if (!result) {
      throw new Error('Failed to parse title translation');
    }

    return {
      title: (result.title as string) || title,
      excerpt: excerpt ? (result.excerpt as string) : undefined,
    };
  }

  /**
   * Translate large article using sequential chunked approach
   * Processes chunks one by one with delays to avoid rate limiting
   */
  private async translateArticleChunked(dto: TranslateArticleDto): Promise<{
    title: string;
    excerpt?: string;
    content: string;
  }> {
    // Use smaller chunks for faster individual translations
    const MAX_CHUNK_SIZE = 8000;
    const CHUNK_DELAY_MS = 5000; // 5 second delay between chunks to avoid rate limiting

    console.log(`Starting sequential chunked translation (delay: ${CHUNK_DELAY_MS}ms)...`);

    // Split content into chunks
    const chunks = this.splitContentIntoChunks(dto.content, MAX_CHUNK_SIZE);
    console.log(`Content split into ${chunks.length} chunks`);

    // Translate title/excerpt first
    let headerResult: { title: string; excerpt?: string } = { title: dto.title, excerpt: dto.excerpt };
    try {
      console.log('Translating title and excerpt...');
      headerResult = await this.translateTitleAndExcerpt(
        dto.title,
        dto.excerpt,
        dto.sourceLanguage,
        dto.targetLanguage,
      );
      console.log('✅ Title and excerpt translated');
      // Wait before starting content translation
      await this.delay(CHUNK_DELAY_MS);
    } catch (error) {
      console.error('Failed to translate title/excerpt, keeping original:', error);
    }

    // Process chunks sequentially (one at a time) to avoid rate limiting
    const translatedChunks: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Translating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

      try {
        const translated = await this.translateContentChunk(
          chunks[i],
          dto.sourceLanguage,
          dto.targetLanguage,
        );
        translatedChunks.push(translated);
        console.log(`✅ Chunk ${i + 1}/${chunks.length} done`);
      } catch (error) {
        console.error(`⚠️ Chunk ${i + 1} failed, using original:`, error);
        translatedChunks.push(chunks[i]);
      }

      // Add delay between chunks (except after last chunk)
      if (i < chunks.length - 1) {
        console.log(`Waiting ${CHUNK_DELAY_MS}ms before next chunk...`);
        await this.delay(CHUNK_DELAY_MS);
      }
    }

    const translatedContent = translatedChunks.join('');
    console.log(`✅ Sequential chunked translation complete. Total: ${translatedContent.length} chars`);

    return {
      title: headerResult.title,
      excerpt: headerResult.excerpt,
      content: translatedContent,
    };
  }

  /**
   * Helper function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
