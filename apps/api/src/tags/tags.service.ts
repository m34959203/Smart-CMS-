import { Injectable, NotFoundException, ConflictException, BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { GenerateTagsDto } from './dto/generate-tags.dto';
import { OpenRouterRetryUtil } from '../common/utils/openrouter-retry.util';

@Injectable()
export class TagsService {
  private openrouterApiKey: string | null = null;
  private openrouterModel: string;

  constructor(private prisma: PrismaService) {
    // Initialize OpenRouter API key
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || null;
    this.openrouterModel = process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';

    if (!this.openrouterApiKey) {
      console.error('❌ OPENROUTER_API_KEY not configured. Tag generation will not work.');
      console.error('Get your API key at: https://openrouter.ai/keys');
    } else {
      const maskedKey = this.openrouterApiKey.slice(0, 8) + '...' + this.openrouterApiKey.slice(-4);
      console.log(`✅ OpenRouter initialized - Model: ${this.openrouterModel}, Key: ${maskedKey}`);
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
        nameRu: dto.name, // Use same name for now
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
      updateData.nameRu = dto.name; // Use same name for now
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
    // Get existing tags to help AI suggest relevant ones
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

    // Prepare content for analysis
    const contentKz = `${dto.titleKz}\n\n${dto.contentKz}`;
    const contentRu = dto.titleRu && dto.contentRu
      ? `${dto.titleRu}\n\n${dto.contentRu}`
      : '';

    const prompt = `Analyze the following article and suggest 3-5 relevant tags in both Kazakh and Russian languages.

Article (Kazakh):
${contentKz}

${contentRu ? `Article (Russian):\n${contentRu}\n` : ''}

Existing tags in the system (for reference):
${existingTagsList || 'No existing tags'}

Instructions:
1. Suggest 3-5 tags that best describe the article's main topics/themes
2. Each tag should be in both Kazakh (nameKz) and Russian (nameRu)
3. Try to match existing tags when appropriate, but you can also suggest new ones
4. Keep tags concise (1-3 words max)
5. Focus on key topics, not general words
6. Return ONLY a valid JSON array in this exact format, no other text:
[
  {"nameKz": "Саясат", "nameRu": "Политика"},
  {"nameKz": "Экономика", "nameRu": "Экономика"}
]

Return only the JSON array, no explanations or additional text.`;

    let aiResponse: string | null = null;

    // Use OpenRouter (Qwen)
    if (!this.openrouterApiKey) {
      console.warn('⚠️ Tag generation skipped: OPENROUTER_API_KEY not configured');
      return {
        existing: [],
        created: [],
        tagIds: [],
      };
    }

    try {
      console.log('Using OpenRouter (Qwen) API for tag generation...');

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
            max_tokens: 500,
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

      aiResponse = message.content;
      console.log('✅ OpenRouter tag generation successful');
    } catch (error: any) {
      // Log detailed error information for debugging
      console.error('❌ OpenRouter tag generation error:', {
        message: error?.message,
        status: error?.response?.status || error?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        code: error?.code,
      });
      // Re-throw HttpExceptions as-is (they have proper status codes)
      if (error instanceof HttpException) {
        throw error;
      }
      // Wrap other errors in InternalServerErrorException with more details
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Unknown error';
      throw new InternalServerErrorException(
        `AI service error: ${errorMessage}`,
      );
    }

    try {
      // Ensure we have a response
      if (!aiResponse) {
        throw new Error('No response received from AI service');
      }

      // Extract JSON from the response (in case AI adds any extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      let suggestedTags = JSON.parse(jsonMatch[0]);

      // Normalize AI response - handle different possible field names
      // AI might return {kazakh, russian} instead of {nameKz, nameRu}
      suggestedTags = suggestedTags.map((tag: any) => {
        // If the tag already has the correct fields, return as is
        if (tag.nameKz && tag.nameRu) {
          return tag;
        }

        // Otherwise, try to map from alternative field names
        return {
          nameKz: tag.nameKz || tag.kazakh || tag.kz || tag.kazakhName || '',
          nameRu: tag.nameRu || tag.russian || tag.ru || tag.russianName || '',
        };
      }).filter((tag: any) => tag.nameKz && tag.nameRu); // Filter out any invalid tags

      // Match suggested tags with existing tags and create new ones if needed
      const matchedTags = [];
      const createdTags = [];

      for (const suggested of suggestedTags) {
        const existing = existingTags.find(
          (tag) =>
            tag.nameKz.toLowerCase() === suggested.nameKz.toLowerCase() ||
            tag.nameRu.toLowerCase() === suggested.nameRu.toLowerCase(),
        );

        if (existing) {
          matchedTags.push(existing);
        } else if (autoCreateTags) {
          // Automatically create the new tag
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
            console.error('Error creating tag:', error);
            // Skip this tag if creation fails (e.g., duplicate)
          }
        } else {
          // Return as suggestion if not auto-creating
          createdTags.push(suggested);
        }
      }

      return {
        existing: matchedTags,
        created: createdTags,
        tagIds: [...matchedTags, ...createdTags].map(tag => tag.id).filter(Boolean),
      };
    } catch (error) {
      console.error('Error parsing AI response for tags:', error);
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }
      // JSON parsing or processing errors from AI response
      throw new BadRequestException(
        'Failed to parse AI response for tag generation. The AI service returned an invalid response.',
      );
    }
  }

  async generateTagsFromArticles() {
    // Check if API key is configured
    if (!this.openrouterApiKey) {
      console.warn('⚠️ Batch tag generation skipped: OPENROUTER_API_KEY not configured');
      return {
        totalArticles: 0,
        processedArticles: 0,
        errorCount: 0,
        newTagsCreated: 0,
        message: 'Tag generation service is not configured. Please set OPENROUTER_API_KEY environment variable.',
      };
    }

    // Get all published articles
    const articles = await this.prisma.article.findMany({
      where: {
        published: true,
      },
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
        // Generate tags for this article
        const result = await this.generateTags(
          {
            titleKz: article.titleKz,
            titleRu: article.titleRu || undefined,
            contentKz: article.contentKz,
            contentRu: article.contentRu || undefined,
          },
          true, // Auto-create tags
        );

        // Collect IDs of all tags (existing + newly created)
        const tagIds = result.tagIds || [];

        if (tagIds.length > 0) {
          // Update the article with the tags
          await this.prisma.article.update({
            where: { id: article.id },
            data: {
              tags: {
                set: tagIds.map(id => ({ id })),
              },
            },
          });
        }

        // Track newly created tags
        result.created?.forEach(tag => {
          if (tag.id) {
            newTagsCreated.add(tag.id);
          }
        });

        processedCount++;
        console.log(`Processed article ${processedCount}/${articles.length}: ${article.titleKz}`);
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        errorCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      totalArticles: articles.length,
      processedArticles: processedCount,
      errorCount,
      newTagsCreated: newTagsCreated.size,
    };
  }
}
