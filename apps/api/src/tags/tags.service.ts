import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { GenerateTagsDto } from './dto/generate-tags.dto';
import { AIService } from '../common/ai/ai.service';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {
    if (!this.aiService.isAvailable()) {
      this.logger.warn('No AI provider configured. Tag generation will not work.');
    } else {
      this.logger.log(`Using ${this.aiService.getActiveProvider()?.toUpperCase()} for tag generation`);
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яәіңғүұқөһ0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateTagDto) {
    const slug = this.generateSlug(dto.name);

    const existingTag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.create({
      data: {
        nameKz: dto.name,
        nameRu: dto.name,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: {
        nameKz: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        articles: {
          where: { published: true },
          select: {
            id: true,
            titleKz: true,
            titleRu: true,
            slugKz: true,
            slugRu: true,
            excerptKz: true,
            excerptRu: true,
            coverImage: true,
            publishedAt: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updateData: any = {};

    if (dto.name) {
      const slug = this.generateSlug(dto.name);

      const existingTag = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (existingTag && existingTag.id !== id) {
        throw new ConflictException('Tag with this name already exists');
      }

      updateData.nameKz = dto.name;
      updateData.nameRu = dto.name;
      updateData.slug = slug;
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }

  async generateTags(dto: GenerateTagsDto, autoCreateTags = false) {
    if (!this.aiService.isAvailable()) {
      this.logger.warn('Tag generation skipped: No AI provider configured');
      return {
        existing: [],
        created: [],
        tagIds: [],
      };
    }

    // Get existing tags
    const existingTags = await this.prisma.tag.findMany({
      select: {
        id: true,
        nameKz: true,
        nameRu: true,
        slug: true,
      },
    });

    const existingTagsList = existingTags
      .map((tag) => `${tag.nameKz} / ${tag.nameRu}`)
      .join(', ');

    const contentKz = `${dto.titleKz}\n\n${dto.contentKz}`;
    const contentRu =
      dto.titleRu && dto.contentRu ? `${dto.titleRu}\n\n${dto.contentRu}` : '';

    const systemPrompt = `You are a tag extraction expert for a news website. Extract relevant tags in Kazakh and Russian.`;

    const prompt = `Analyze this article and suggest 3-5 relevant tags.

Article (Kazakh):
${contentKz}

${contentRu ? `Article (Russian):\n${contentRu}\n` : ''}

Existing tags: ${existingTagsList || 'None'}

Return ONLY a JSON array:
[
  {"nameKz": "Саясат", "nameRu": "Политика"},
  {"nameKz": "Экономика", "nameRu": "Экономика"}
]

Rules:
- 3-5 tags maximum
- Both nameKz and nameRu required
- Keep tags concise (1-3 words)
- Match existing tags when appropriate`;

    try {
      const result = await this.aiService.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 500,
      });

      // Parse JSON response
      let suggestedTags = this.aiService.parseJsonResponse<
        Array<{ nameKz: string; nameRu: string }>
      >(result.content);

      // Normalize response
      suggestedTags = suggestedTags
        .map((tag: any) => ({
          nameKz: tag.nameKz || tag.kazakh || tag.kz || '',
          nameRu: tag.nameRu || tag.russian || tag.ru || '',
        }))
        .filter((tag) => tag.nameKz && tag.nameRu);

      // Match with existing tags
      const matchedTags: Array<{ id: string; nameKz: string; nameRu: string; slug: string }> = [];
      const createdTags: Array<{ id?: string; nameKz: string; nameRu: string; slug?: string }> = [];

      for (const suggested of suggestedTags) {
        const existing = existingTags.find(
          (tag) =>
            tag.nameKz.toLowerCase() === suggested.nameKz.toLowerCase() ||
            tag.nameRu.toLowerCase() === suggested.nameRu.toLowerCase(),
        );

        if (existing) {
          matchedTags.push(existing);
        } else if (autoCreateTags) {
          try {
            const slug = this.generateSlug(suggested.nameKz);
            const newTag = await this.prisma.tag.create({
              data: {
                nameKz: suggested.nameKz,
                nameRu: suggested.nameRu,
                slug,
              },
            });
            createdTags.push(newTag);
          } catch (error) {
            this.logger.warn(`Failed to create tag: ${suggested.nameKz}`);
          }
        } else {
          createdTags.push(suggested);
        }
      }

      this.logger.log(
        `Tag generation completed using ${result.provider}/${result.model}`,
      );

      return {
        existing: matchedTags,
        created: createdTags,
        tagIds: [...matchedTags, ...createdTags]
          .map((tag) => tag.id)
          .filter((id): id is string => Boolean(id)),
      };
    } catch (error) {
      this.logger.error('Tag generation error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Tag generation failed',
      );
    }
  }

  async generateTagsFromArticles() {
    if (!this.aiService.isAvailable()) {
      return {
        totalArticles: 0,
        processedArticles: 0,
        errorCount: 0,
        newTagsCreated: 0,
        message:
          'AI service not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      };
    }

    const articles = await this.prisma.article.findMany({
      where: { published: true },
      select: {
        id: true,
        titleKz: true,
        titleRu: true,
        contentKz: true,
        contentRu: true,
      },
    });

    let processedCount = 0;
    let errorCount = 0;
    const newTagsCreated = new Set<string>();

    for (const article of articles) {
      try {
        const result = await this.generateTags(
          {
            titleKz: article.titleKz,
            titleRu: article.titleRu || undefined,
            contentKz: article.contentKz,
            contentRu: article.contentRu || undefined,
          },
          true,
        );

        const tagIds = result.tagIds || [];

        if (tagIds.length > 0) {
          await this.prisma.article.update({
            where: { id: article.id },
            data: {
              tags: {
                set: tagIds.map((id) => ({ id })),
              },
            },
          });
        }

        result.created?.forEach((tag: { id?: string }) => {
          if (tag.id) newTagsCreated.add(tag.id);
        });

        processedCount++;
        this.logger.log(
          `Processed ${processedCount}/${articles.length}: ${article.titleKz}`,
        );
      } catch (error) {
        this.logger.error(`Error processing article ${article.id}:`, error);
        errorCount++;
      }

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return {
      totalArticles: articles.length,
      processedArticles: processedCount,
      errorCount,
      newTagsCreated: newTagsCreated.size,
    };
  }
}
