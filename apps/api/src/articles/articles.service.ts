import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateArticleDto, ArticleStatus } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { SpellCheckArticleDto } from './dto/spell-check-article.dto';
import { TranslationService } from '../translation/translation.service';
import { TranslationLanguage } from '../translation/dto/translate.dto';
import { OpenRouterRetryUtil } from '../common/utils/openrouter-retry.util';
import { SocialMediaService } from '../social-media/social-media.service';
import { ArticleStatus as PrismaArticleStatus } from '@prisma/client';

@Injectable()
export class ArticlesService {
  private openrouterApiKey: string | null = null;
  private openrouterModel: string;

  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
    @Inject(forwardRef(() => SocialMediaService))
    private socialMediaService: SocialMediaService,
  ) {
    // Initialize OpenRouter API key
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Helper method to split HTML content into chunks by paragraphs
  private splitContentIntoChunks(content: string, maxChunkSize: number = 15000): string[] {
    const chunks: string[] = [];

    // Split by paragraph closing tags while keeping the tags
    const parts = content.split(/(<\/p>)/i);
    let currentChunk = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // If adding this part would exceed the limit, save current chunk and start new one
      if (currentChunk.length + part.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = part;
      } else {
        currentChunk += part;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [content];
  }

  // Helper method to translate large content in chunks
  private async translateLargeContent(
    title: string,
    content: string,
    excerpt: string | undefined,
    sourceLanguage: TranslationLanguage,
    targetLanguage: TranslationLanguage,
  ): Promise<{ title: string; content: string; excerpt?: string }> {
    const MAX_CHUNK_SIZE = 15000;
    const contentLength = content?.length || 0;

    // If content is small enough, translate normally
    if (contentLength <= MAX_CHUNK_SIZE) {
      return this.translationService.translateArticle({
        title,
        content,
        excerpt,
        sourceLanguage,
        targetLanguage,
      });
    }

    console.log(`Large content detected (${contentLength} chars). Using chunked translation...`);

    // First, translate title and excerpt only
    let translatedTitle = title;
    let translatedExcerpt = excerpt;

    try {
      const headerTranslation = await this.translationService.translateArticle({
        title,
        content: title, // Use title as minimal content for this call
        excerpt,
        sourceLanguage,
        targetLanguage,
      });
      translatedTitle = headerTranslation.title;
      translatedExcerpt = headerTranslation.excerpt;
      console.log('✅ Title and excerpt translated');
    } catch (error) {
      console.error('Failed to translate title/excerpt:', error);
      // Continue with original title/excerpt
    }

    // Split content into chunks
    const chunks = this.splitContentIntoChunks(content, MAX_CHUNK_SIZE);
    console.log(`Content split into ${chunks.length} chunks`);

    // Translate each chunk
    const translatedChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`Translating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
        const chunkTranslation = await this.translationService.translateArticle({
          title: `Part ${i + 1}`,
          content: chunks[i],
          sourceLanguage,
          targetLanguage,
        });
        translatedChunks.push(chunkTranslation.content);
        console.log(`✅ Chunk ${i + 1}/${chunks.length} translated`);
      } catch (error) {
        console.error(`Failed to translate chunk ${i + 1}:`, error);
        // Keep original chunk if translation fails
        translatedChunks.push(chunks[i]);
      }
    }

    // Combine translated chunks
    const translatedContent = translatedChunks.join('');
    console.log(`✅ All chunks combined. Total translated content: ${translatedContent.length} chars`);

    return {
      title: translatedTitle,
      content: translatedContent,
      excerpt: translatedExcerpt,
    };
  }

  async create(dto: CreateArticleDto, authorId: string) {
    const slugKz = this.generateSlug(dto.titleKz);
    let slugRu = dto.titleRu ? this.generateSlug(dto.titleRu) : undefined;

    // Auto-translate from Kazakh to Russian if Russian content is not provided
    let titleRu = dto.titleRu;
    let contentRu = dto.contentRu;
    let excerptRu = dto.excerptRu;

    if (!titleRu || !contentRu) {
      try {
        console.log('Auto-translating article from Kazakh to Russian...');
        const translation = await this.translateLargeContent(
          dto.titleKz,
          dto.contentKz,
          dto.excerptKz,
          TranslationLanguage.KAZAKH,
          TranslationLanguage.RUSSIAN,
        );

        titleRu = titleRu || translation.title;
        contentRu = contentRu || translation.content;
        excerptRu = excerptRu || translation.excerpt;
        slugRu = titleRu ? this.generateSlug(titleRu) : undefined;

        console.log('Auto-translation completed successfully');
      } catch (error) {
        console.error('Auto-translation failed:', error);
        // Continue without translation if it fails
        console.log('Proceeding without Russian translation');
      }
    }

    // Determine status based on both status field and backward-compatible published field
    let status: ArticleStatus = dto.status || ArticleStatus.DRAFT;
    if (dto.published !== undefined) {
      status = dto.published ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
    }

    const article = await this.prisma.article.create({
      data: {
        // Kazakh content (required)
        titleKz: dto.titleKz,
        slugKz,
        contentKz: dto.contentKz,
        excerptKz: dto.excerptKz,

        // Russian content (optional, auto-translated if not provided)
        titleRu,
        slugRu,
        contentRu,
        excerptRu,

        // Common fields
        coverImage: dto.coverImage,
        categoryId: dto.categoryId,

        // Status and flags
        status,
        published: status === 'PUBLISHED',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        isBreaking: dto.isBreaking || false,
        isFeatured: dto.isFeatured || false,
        isPinned: dto.isPinned || false,
        allowComments: dto.allowComments !== false, // Default to true
        autoPublishEnabled: dto.autoPublishEnabled || false,

        authorId,

        tags: dto.tagIds
          ? {
              connect: dto.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    // Auto-publish to social media if enabled and article is published
    if (
      dto.autoPublishEnabled &&
      dto.autoPublishPlatforms &&
      dto.autoPublishPlatforms.length > 0 &&
      status === ArticleStatus.PUBLISHED
    ) {
      try {
        console.log(
          `Auto-publishing article ${article.id} to ${dto.autoPublishPlatforms.join(', ')}`,
        );
        await this.socialMediaService.publishArticle(
          article.id,
          dto.autoPublishPlatforms,
        );
      } catch (error) {
        console.error('Failed to auto-publish to social media:', error);
        // Continue even if social media publishing fails
      }
    }

    return article;
  }

  async findAll(filters?: {
    published?: boolean;
    isBreaking?: boolean;
    isFeatured?: boolean;
    isPinned?: boolean;
    categorySlug?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.isBreaking !== undefined) {
      where.isBreaking = filters.isBreaking;
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters?.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    if (filters?.categorySlug) {
      where.category = {
        slug: filters.categorySlug,
      };
    }

    // Pagination parameters
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    // If pagination is requested (page or limit is provided), return paginated response
    if (filters?.page !== undefined || filters?.limit !== undefined) {
      const [articles, total] = await Promise.all([
        this.prisma.article.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            category: true,
            tags: true,
          },
          orderBy: [
            // Pinned articles first
            { isPinned: 'desc' },
            // Then by creation date
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.article.count({
          where: Object.keys(where).length > 0 ? where : undefined,
        }),
      ]);

      return {
        data: articles,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Otherwise, return all articles (backward compatibility)
    return this.prisma.article.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
      orderBy: [
        // Pinned articles first
        { isPinned: 'desc' },
        // Then by creation date
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment views
    await this.prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async findBySlug(slug: string) {
    // Decode the slug in case it comes URL-encoded (e.g., from Telegram mobile)
    const decodedSlug = decodeURIComponent(slug);

    // Try Kazakh slug first
    let article = await this.prisma.article.findUnique({
      where: { slugKz: decodedSlug },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    // If not found, try Russian slug
    if (!article) {
      article = await this.prisma.article.findUnique({
        where: { slugRu: decodedSlug },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          category: true,
          tags: true,
        },
      });
    }

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment views
    await this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async update(id: string, dto: UpdateArticleDto, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own articles');
    }

    const updateData: any = {};

    // Kazakh content
    if (dto.titleKz) {
      updateData.titleKz = dto.titleKz;
      updateData.slugKz = this.generateSlug(dto.titleKz);
    }

    if (dto.contentKz !== undefined) {
      updateData.contentKz = dto.contentKz;
    }

    if (dto.excerptKz !== undefined) {
      updateData.excerptKz = dto.excerptKz;
    }

    // Russian content
    if (dto.titleRu !== undefined) {
      updateData.titleRu = dto.titleRu;
      updateData.slugRu = dto.titleRu ? this.generateSlug(dto.titleRu) : null;
    }

    if (dto.contentRu !== undefined) {
      updateData.contentRu = dto.contentRu;
    }

    if (dto.excerptRu !== undefined) {
      updateData.excerptRu = dto.excerptRu;
    }

    // Common fields
    if (dto.coverImage !== undefined) {
      updateData.coverImage = dto.coverImage;
    }

    if (dto.categoryId) {
      updateData.categoryId = dto.categoryId;
    }

    // Status and flags
    if (dto.status) {
      updateData.status = dto.status;
      updateData.published = dto.status === 'PUBLISHED';

      if (dto.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }

    // Backward compatibility with published field
    if (dto.published !== undefined && !dto.status) {
      updateData.published = dto.published;
      updateData.status = dto.published ? 'PUBLISHED' : 'DRAFT';

      if (dto.published && !article.published) {
        updateData.publishedAt = new Date();
      }
    }

    if (dto.isBreaking !== undefined) {
      updateData.isBreaking = dto.isBreaking;
    }

    if (dto.isFeatured !== undefined) {
      updateData.isFeatured = dto.isFeatured;
    }

    if (dto.isPinned !== undefined) {
      updateData.isPinned = dto.isPinned;
    }

    if (dto.allowComments !== undefined) {
      updateData.allowComments = dto.allowComments;
    }

    // Social Media Auto-Publish
    if (dto.autoPublishEnabled !== undefined) {
      updateData.autoPublishEnabled = dto.autoPublishEnabled;
    }

    if (dto.autoPublishPlatforms !== undefined) {
      updateData.autoPublishPlatforms = dto.autoPublishPlatforms;
    }

    // Tags
    if (dto.tagIds) {
      updateData.tags = {
        set: [],
        connect: dto.tagIds.map((id) => ({ id })),
      };
    }

    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        tags: true,
      },
    });

    // Auto-publish to social media if enabled and article is published
    const isNowPublished = updatedArticle.status === 'PUBLISHED';

    if (
      dto.autoPublishEnabled &&
      dto.autoPublishPlatforms &&
      dto.autoPublishPlatforms.length > 0 &&
      isNowPublished
    ) {
      try {
        console.log(
          `Auto-publishing updated article ${updatedArticle.id} to ${dto.autoPublishPlatforms.join(', ')}`,
        );
        await this.socialMediaService.publishArticle(
          updatedArticle.id,
          dto.autoPublishPlatforms,
        );
      } catch (error: any) {
        console.error('Failed to auto-publish to social media:', error);
        // Continue even if social media publishing fails
      }
    }

    return updatedArticle;
  }

  async remove(id: string, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
  }

  async removeMany(ids: string[], userId: string, userRole: string) {
    // Fetch all articles to check permissions
    const articles = await this.prisma.article.findMany({
      where: { id: { in: ids } },
    });

    if (articles.length === 0) {
      throw new NotFoundException('No articles found with provided IDs');
    }

    // Check permissions for each article
    const unauthorizedArticles = articles.filter(
      article => article.authorId !== userId && userRole !== 'ADMIN'
    );

    if (unauthorizedArticles.length > 0) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    // Delete all articles
    const result = await this.prisma.article.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      message: `${result.count} article(s) deleted successfully`,
      count: result.count,
    };
  }

  async analyzeArticle(dto: AnalyzeArticleDto) {
    // Prepare content for analysis
    const kazakh = {
      title: dto.titleKz,
      excerpt: dto.excerptKz || '',
      content: dto.contentKz,
    };

    const russian = dto.titleRu && dto.contentRu
      ? {
          title: dto.titleRu,
          excerpt: dto.excerptRu || '',
          content: dto.contentRu,
        }
      : null;

    // Determine target language for improvements (default to 'kz')
    const targetLang = dto.targetLanguage || 'kz';
    const targetLangName = targetLang === 'kz' ? 'казахском' : 'русском';

    // Strip HTML tags for cleaner text analysis
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const contentTextKz = stripHtml(kazakh.content);
    const contentTextRu = russian ? stripHtml(russian.content) : '';

    // Calculate basic metrics
    const wordCountKz = contentTextKz.split(/\s+/).filter(w => w.length > 0).length;
    const wordCountRu = contentTextRu ? contentTextRu.split(/\s+/).filter(w => w.length > 0).length : 0;
    const paragraphCountKz = kazakh.content.split(/<\/p>|<br\s*\/?>/gi).filter(p => stripHtml(p).length > 0).length;

    const prompt = `Ты — опытный редактор новостного сайта. Проанализируй статью ЧЕСТНО и ОБЪЕКТИВНО.

ВАЖНЫЕ ПРАВИЛА:
1. НЕ ПРИДУМЫВАЙ информацию, которой нет в тексте
2. НЕ ХВАЛИ без причины — будь конкретен
3. Если статья плохая — скажи честно
4. Давай КОНКРЕТНЫЕ примеры из текста
5. Предлагай РЕАЛЬНЫЕ улучшения, а не общие фразы

СТАТЬЯ (${targetLang === 'kz' ? 'Қазақша' : 'Русский'}):
Заголовок: ${targetLang === 'kz' ? kazakh.title : (russian?.title || kazakh.title)}
${(targetLang === 'kz' ? kazakh.excerpt : russian?.excerpt) ? `Описание: ${targetLang === 'kz' ? kazakh.excerpt : russian?.excerpt}` : '(Описание отсутствует)'}
Текст (${targetLang === 'kz' ? wordCountKz : wordCountRu} слов): ${targetLang === 'kz' ? contentTextKz : contentTextRu}

${russian && targetLang === 'kz' ? `
РУССКАЯ ВЕРСИЯ (для сравнения):
Заголовок: ${russian.title}
` : ''}
${!russian && targetLang === 'ru' ? `
КАЗАХСКАЯ ВЕРСИЯ:
Заголовок: ${kazakh.title}
Текст: ${contentTextKz}
` : ''}

КРИТЕРИИ ОЦЕНКИ (0-100 баллов):
- Заголовок (0-20): Привлекает внимание? Отражает суть? Не кликбейт?
- Содержание (0-30): Есть кто/что/где/когда/почему? Полная информация?
- Структура (0-20): Логичный порядок? Абзацы? Читабельность?
- Язык (0-15): Грамматика? Стиль? Ясность изложения?
- Описание (0-15): Есть? Информативное? Привлекает к прочтению?

ВЕРНИ JSON (строго по формату):
{
  "score": число_от_0_до_100,
  "summary": "1-2 предложения: главные проблемы или почему статья хорошая",
  "suggestions": [
    {
      "category": "Заголовок|Содержание|Структура|Язык|Описание",
      "severity": "high|medium|low",
      "title": "Конкретная проблема",
      "description": "Что не так + как исправить + пример из текста"
    }
  ],
  "strengths": ["конкретное преимущество со ссылкой на текст"],
  "improvements": {
    "title": "улучшенный заголовок на ${targetLangName} языке (только если текущий плохой)",
    "excerpt": "краткое описание 1-2 предложения на ${targetLangName} языке (только если отсутствует или плохое)"
  }
}

ПРИМЕРЫ ХОРОШИХ ПРЕДЛОЖЕНИЙ:
- severity: "high" — "Отсутствует дата события" (критично для новости)
- severity: "medium" — "Заголовок слишком длинный (15 слов), сократить до 8-10"
- severity: "low" — "Можно добавить цитату для достоверности"

ПРИМЕРЫ ПЛОХИХ ПРЕДЛОЖЕНИЙ (НЕ ПИШИ ТАК):
- "Статья хорошо написана" (слишком общо)
- "Добавьте больше деталей" (каких именно?)
- "Улучшите структуру" (как именно?)

Если статья короткая (<100 слов), это ПРОБЛЕМА — укажи.
Если нет описания (excerpt) — это ПРОБЛЕМА — укажи.
Если заголовок не отражает суть — это ПРОБЛЕМА — укажи.

ВЕРНИ ТОЛЬКО JSON, без лишнего текста.`;

    let aiResponse: string | null = null;

    // Use OpenRouter (Qwen)
    if (!this.openrouterApiKey) {
      throw new BadRequestException(
        'AI editor is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      console.log('Using OpenRouter API for article analysis...');
      console.log(`Article: ${kazakh.title}, Words: ${wordCountKz}, Paragraphs: ${paragraphCountKz}`);

      // Execute with retry logic - use lower temperature for consistency
      const response = await OpenRouterRetryUtil.executeWithRetry(
        {
          url: 'https://openrouter.ai/api/v1/chat/completions',
          method: 'POST',
          data: {
            model: this.openrouterModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3, // Lower temperature for more consistent, factual responses
            max_tokens: 2048,
          },
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'Content-Type': 'application/json',
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

      // Try to get content from different possible fields
      let messageContent = message?.content;

      if (!messageContent || messageContent.trim().length === 0) {
        if (message?.reasoning) {
          console.log('Content field is empty, using reasoning field instead');
          messageContent = message.reasoning;
        } else if (choice?.reasoning_details && Array.isArray(choice.reasoning_details)) {
          console.log('Content field is empty, using reasoning_details instead');
          const reasoningText = choice.reasoning_details
            .map((detail: any) => detail.text)
            .join('\n');
          if (reasoningText) {
            messageContent = reasoningText;
          }
        }
      }

      if (!messageContent || messageContent.trim().length === 0) {
        console.error('Invalid OpenRouter response: empty content and no reasoning field');
        console.error('Choices[0]:', JSON.stringify(choice));
        throw new Error('Empty response from OpenRouter');
      }

      aiResponse = messageContent;
      console.log('OpenRouter article analysis successful');
      console.log('Response preview:', messageContent.substring(0, 200));
    } catch (error) {
      console.error('OpenRouter article analysis error:', error);

      // OpenRouterRetryUtil will throw proper HttpException with correct status codes
      // Just re-throw it to preserve the status code
      throw error;
    }

    try {
      // Ensure we have a response
      if (!aiResponse) {
        throw new BadRequestException('No response received from AI service.');
      }

      console.log('Parsing AI response for article analysis...');
      console.log('Full response length:', aiResponse.length);

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response');
        console.error('Response preview:', aiResponse.substring(0, 500));
        throw new Error('Failed to parse AI response - no JSON found');
      }

      console.log('JSON extracted, parsing...');
      let analysis = JSON.parse(jsonMatch[0]);
      console.log('Analysis parsed successfully');

      // Validate and normalize the response
      analysis.score = Math.min(100, Math.max(0, Number(analysis.score) || 50));

      // Ensure suggestions is an array
      if (!Array.isArray(analysis.suggestions)) {
        analysis.suggestions = [];
      }

      // Validate severity levels
      analysis.suggestions = analysis.suggestions.map((s: any) => ({
        ...s,
        severity: ['low', 'medium', 'high'].includes(s.severity) ? s.severity : 'medium',
        category: s.category || 'Содержание',
        title: s.title || 'Рекомендация',
        description: s.description || '',
      }));

      // Ensure strengths is an array
      if (!Array.isArray(analysis.strengths)) {
        analysis.strengths = [];
      }

      // Normalize improvements - AI might return {kk, ru} instead of plain strings
      if (analysis.improvements) {
        // Handle title
        if (analysis.improvements.title && typeof analysis.improvements.title === 'object') {
          analysis.improvements.title =
            analysis.improvements.title.kk ||
            analysis.improvements.title.ru ||
            analysis.improvements.title.kazakh ||
            analysis.improvements.title.russian ||
            '';
        }

        // Handle excerpt
        if (analysis.improvements.excerpt && typeof analysis.improvements.excerpt === 'object') {
          analysis.improvements.excerpt =
            analysis.improvements.excerpt.kk ||
            analysis.improvements.excerpt.ru ||
            analysis.improvements.excerpt.kazakh ||
            analysis.improvements.excerpt.russian ||
            '';
        }
      } else {
        analysis.improvements = {};
      }

      // Add automatic suggestions based on metrics
      if (wordCountKz < 100 && !analysis.suggestions.some((s: any) => s.title.includes('короткая'))) {
        analysis.suggestions.unshift({
          category: 'Содержание',
          severity: 'high',
          title: 'Статья слишком короткая',
          description: `Всего ${wordCountKz} слов. Для полноценной новости рекомендуется минимум 150-200 слов.`,
        });
      }

      if (!kazakh.excerpt && !analysis.suggestions.some((s: any) => s.category === 'Описание')) {
        analysis.suggestions.unshift({
          category: 'Описание',
          severity: 'medium',
          title: 'Отсутствует краткое описание',
          description: 'Добавьте описание (excerpt) для отображения в списках статей и для SEO.',
        });
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing article:', error);
      console.error('Error type:', error?.constructor?.name);

      if (error instanceof SyntaxError) {
        console.error('JSON parsing error');
        throw new BadRequestException(
          'AI returned invalid JSON format. Please try again.',
        );
      }

      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if (error.message?.includes('Failed to parse') || error.message?.includes('no JSON found')) {
          throw new BadRequestException(
            'AI returned invalid response format. Please try again.',
          );
        }
        if (error.message?.includes('Content blocked')) {
          throw new BadRequestException(
            'Content was blocked by AI safety filters. Please modify your article content.',
          );
        }
      }

      throw new BadRequestException(
        'Failed to analyze article. Please try again later.',
      );
    }
  }

  async spellCheckArticle(dto: SpellCheckArticleDto) {
    // Prepare content for spell checking
    const parts: { lang: string; title?: string; excerpt?: string; content?: string }[] = [];

    if (dto.titleKz || dto.excerptKz || dto.contentKz) {
      parts.push({
        lang: 'Kazakh',
        title: dto.titleKz,
        excerpt: dto.excerptKz,
        content: dto.contentKz,
      });
    }

    if (dto.titleRu || dto.excerptRu || dto.contentRu) {
      parts.push({
        lang: 'Russian',
        title: dto.titleRu,
        excerpt: dto.excerptRu,
        content: dto.contentRu,
      });
    }

    if (parts.length === 0) {
      throw new BadRequestException('At least one field must be provided for spell checking');
    }

    const prompt = `You are an expert proofreader for a bilingual news website (Kazakh/Russian). Your task is to check the following article content for spelling errors, typos, and grammar mistakes, then provide corrected versions.

${parts.map((part, idx) => `
ARTICLE PART ${idx + 1} (${part.lang}):
${part.title ? `Title: ${part.title}` : ''}
${part.excerpt ? `Excerpt: ${part.excerpt}` : ''}
${part.content ? `Content: ${part.content}` : ''}
`).join('\n')}

Please perform the following tasks:
1. Check for spelling errors and typos
2. Fix grammar mistakes
3. Correct punctuation errors
4. Ensure proper capitalization
5. Maintain the original meaning and tone
6. Keep the original formatting (paragraphs, line breaks, etc.)

Return your response as a JSON object with this EXACT structure (respond in Russian for descriptions):
{
  "hasErrors": true/false,
  "errorCount": number,
  "summary": "Краткое описание найденных ошибок",
  "corrections": [
    {
      "language": "Kazakh" or "Russian",
      "field": "title" or "excerpt" or "content",
      "original": "текст с ошибкой",
      "corrected": "исправленный текст",
      "errorType": "spelling" or "grammar" or "punctuation" or "capitalization",
      "description": "Краткое описание ошибки"
    }
  ],
  "correctedVersions": {
    "kazakh": {
      "title": "corrected title in Kazakh if provided",
      "excerpt": "corrected excerpt in Kazakh if provided",
      "content": "corrected content in Kazakh if provided"
    },
    "russian": {
      "title": "corrected title in Russian if provided",
      "excerpt": "corrected excerpt in Russian if provided",
      "content": "corrected content in Russian if provided"
    }
  }
}

IMPORTANT:
- Return ONLY the JSON object, no additional text or markdown formatting
- Include all corrected versions in the correctedVersions object
- If a field was not provided, omit it from correctedVersions
- If no errors were found, set hasErrors to false and errorCount to 0, but still include the original text in correctedVersions
- List individual corrections in the corrections array for reference`;

    let aiResponse: string | null = null;

    // Use OpenRouter (Qwen)
    if (!this.openrouterApiKey) {
      throw new BadRequestException(
        'Spell checker is not configured. Please set OPENROUTER_API_KEY environment variable.',
      );
    }

    try {
      console.log('Using OpenRouter (Qwen) API for spell checking...');
      const response = await OpenRouterRetryUtil.executeWithRetry(
        {
          url: 'https://openrouter.ai/api/v1/chat/completions',
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
            max_tokens: 4096,
          },
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'Content-Type': 'application/json',
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
      let messageContent = message?.content;

      if (!messageContent || messageContent.trim().length === 0) {
        if (message?.reasoning) {
          messageContent = message.reasoning;
        }
      }

      if (!messageContent || messageContent.trim().length === 0) {
        throw new Error('Empty response from OpenRouter');
      }

      aiResponse = messageContent;
      console.log('OpenRouter spell check successful');
    } catch (error) {
      console.error('OpenRouter spell check error:', error);
      throw error;
    }

    try {
      if (!aiResponse) {
        throw new BadRequestException('No response received from AI service.');
      }

      console.log('Parsing AI response for spell check...');

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response');
        throw new Error('Failed to parse AI response - no JSON found');
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log('Spell check result parsed successfully');

      return result;
    } catch (error) {
      console.error('Error checking spelling:', error);

      if (error instanceof SyntaxError) {
        throw new BadRequestException(
          'AI returned invalid JSON format. Please try again.',
        );
      }

      if (error instanceof Error) {
        if (error.message?.includes('Failed to parse') || error.message?.includes('no JSON found')) {
          throw new BadRequestException(
            'AI returned invalid response format. Please try again.',
          );
        }
      }

      throw new BadRequestException(
        'Failed to check spelling. Please try again later.',
      );
    }
  }
}
