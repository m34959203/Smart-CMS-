import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ArticleStatus } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('setup')
export class SetupController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  async initialize() {
    const results = {
      categories: 0,
      admin: false,
      articles: 0,
    };

    try {
      // 1. Create categories
      const categories = [
        {
          slug: 'zhanalyqtar',
          nameKz: 'ЖАҢАЛЫҚТАР',
          nameRu: 'НОВОСТИ',
          descriptionKz: 'Сатпаев қаласы мен облысының соңғы жаңалықтары',
          descriptionRu: 'Последние новости города Сатпаев и области',
          sortOrder: 1,
        },
        {
          slug: 'ozekti',
          nameKz: 'ӨЗЕКТІ',
          nameRu: 'АКТУАЛЬНО',
          descriptionKz: 'Өзекті мәселелер мен маңызды оқиғалар',
          descriptionRu: 'Актуальные вопросы и важные события',
          sortOrder: 2,
        },
        {
          slug: 'sayasat',
          nameKz: 'САЯСАТ',
          nameRu: 'ПОЛИТИКА',
          descriptionKz: 'Саяси жаңалықтар және талдаулар',
          descriptionRu: 'Политические новости и аналитика',
          sortOrder: 3,
        },
        {
          slug: 'madeniyet',
          nameKz: 'МӘДЕНИЕТ',
          nameRu: 'КУЛЬТУРА',
          descriptionKz: 'Мәдени оқиғалар, өнер және әдебиет',
          descriptionRu: 'Культурные события, искусство и литература',
          sortOrder: 4,
        },
        {
          slug: 'qogam',
          nameKz: 'ҚОҒАМ',
          nameRu: 'ОБЩЕСТВО',
          descriptionKz: 'Қоғамдық өмір және әлеуметтік мәселелер',
          descriptionRu: 'Общественная жизнь и социальные вопросы',
          sortOrder: 5,
        },
        {
          slug: 'kazakhmys',
          nameKz: 'Казахмыс',
          nameRu: 'Казахмыс',
          descriptionKz: 'Қазақмыс корпорациясы жаңалықтары',
          descriptionRu: 'Новости корпорации Казахмыс',
          sortOrder: 6,
        },
      ];

      for (const category of categories) {
        const existing = await this.prisma.category.findUnique({
          where: { slug: category.slug },
        });

        if (!existing) {
          await this.prisma.category.create({ data: category });
          results.categories++;
        }
      }

      // 2. Create admin user if not exists
      const adminEmail = 'admin@aimakakshamy.kz';
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.user.create({
          data: {
            email: adminEmail,
            firstName: 'Админ',
            lastName: 'Редактор',
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
        results.admin = true;
      }

      // 3. Create sample articles if none exist
      const existingArticles = await this.prisma.article.count();
      if (existingArticles === 0) {
        const firstCategory = await this.prisma.category.findFirst({
          where: { slug: 'zhanalyqtar' },
        });

        const admin = await this.prisma.user.findUnique({
          where: { email: adminEmail },
        });

        if (firstCategory && admin) {
          // Create 2 sample articles
          const sampleArticles = [
            {
              titleKz: 'Сатпаев қаласында жаңа мәдениет үйі ашылды',
              titleRu: 'В городе Сатпаев открылся новый дом культуры',
              slugKz: 'satpaev-qalasynda-zhana-madeniyet-uii-ashyldy',
              slugRu: 'v-gorode-satpaev-otkrylsya-novyy-dom-kultury',
              excerptKz: 'Қала әкімі жаңа мәдениет үйінің ашылу салтанатына қатысты',
              excerptRu:
                'Глава города принял участие в торжественном открытии нового дома культуры',
              contentKz:
                'Сатпаев қаласында жаңа заманауи мәдениет үйі ашылды. Жаңа ғимарат 500 адамға арналған концерт залы, көрме галереясы және балалар студияларымен жабдықталған.',
              contentRu:
                'В городе Сатпаев состоялось торжественное открытие нового современного дома культуры. Новое здание оборудовано концертным залом на 500 человек, выставочной галереей и детскими студиями.',
              categoryId: firstCategory.id,
              authorId: admin.id,
              status: ArticleStatus.PUBLISHED,
              isFeatured: true,
            },
            {
              titleKz: 'Аймақтағы жол жөндеу жұмыстары басталды',
              titleRu: 'Начались дорожно-ремонтные работы в регионе',
              slugKz: 'aimaqtagy-zhol-zhondeu-zhumystary-bastaldy',
              slugRu: 'nachalis-dorozhno-remontnye-raboty-v-regione',
              excerptKz: 'Облыс бойынша 50 км жол жөнделетін болады',
              excerptRu: 'По области будет отремонтировано 50 км дорог',
              contentKz:
                'Облыс әкімдігі аймақтағы негізгі көшелер мен жолдарды жөндеу жұмыстарын бастады. Жұмыстар мамыр айынан қыркүйек айына дейін жалғасады.',
              contentRu:
                'Областная акиматура начала ремонтные работы основных улиц и дорог в регионе. Работы продлятся с мая по сентябрь.',
              categoryId: firstCategory.id,
              authorId: admin.id,
              status: ArticleStatus.PUBLISHED,
            },
          ];

          for (const article of sampleArticles) {
            await this.prisma.article.create({ data: article });
            results.articles++;
          }
        }
      }

      return {
        success: true,
        message: 'Database initialized successfully',
        results,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        results,
      };
    }
  }

  @Public()
  @Post('reset-database')
  @HttpCode(HttpStatus.OK)
  async resetDatabase() {
    try {
      // Delete failed migration record
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM _prisma_migrations WHERE migration_name = '20251118000000_init';
      `);

      // Drop and recreate schema
      await this.prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE;`);
      await this.prisma.$executeRawUnsafe(`CREATE SCHEMA public;`);
      await this.prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO postgres;`);
      await this.prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO public;`);

      return {
        success: true,
        message: 'Database reset successfully. Please redeploy the application to apply migrations.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async check() {
    try {
      const categoriesCount = await this.prisma.category.count();
      const usersCount = await this.prisma.user.count();
      const articlesCount = await this.prisma.article.count();
      const adminUser = await this.prisma.user.findUnique({
        where: { email: 'admin@aimakakshamy.kz' },
      });

      return {
        database: 'connected',
        categories: categoriesCount,
        users: usersCount,
        articles: articlesCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role || null,
      };
    } catch (error) {
      return {
        database: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('make-admin')
  @HttpCode(HttpStatus.OK)
  async makeAdmin() {
    try {
      // Находим пользователя admin@aimakakshamy.kz
      const user = await this.prisma.user.findUnique({
        where: { email: 'admin@aimakakshamy.kz' },
      });

      if (!user) {
        return {
          success: false,
          message: 'User admin@aimakakshamy.kz not found',
        };
      }

      // Обновляем роль на ADMIN и сбрасываем пароль на admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const updatedUser = await this.prisma.user.update({
        where: { email: 'admin@aimakakshamy.kz' },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          isActive: true,
          isVerified: true,
        },
      });

      return {
        success: true,
        message: 'User role updated to ADMIN and password reset to admin123',
        user: {
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('cleanup-wordpress')
  @HttpCode(HttpStatus.OK)
  async cleanupWordPress() {
    try {
      // Find and delete articles with slugs ending in -wpXXXXX (WordPress imports)
      const wpArticles = await this.prisma.article.findMany({
        where: {
          slugKz: {
            contains: '-wp',
          },
        },
      });

      // Filter to only those ending with -wp followed by digits
      const toDelete = wpArticles.filter(article =>
        /\-wp\d+$/.test(article.slugKz)
      );

      const deletedIds = [];
      for (const article of toDelete) {
        await this.prisma.article.delete({
          where: { id: article.id },
        });
        deletedIds.push(article.id);
      }

      return {
        success: true,
        message: `Deleted ${deletedIds.length} WordPress articles with broken encoding`,
        deletedCount: deletedIds.length,
        deletedIds,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('diagnose-articles')
  @HttpCode(HttpStatus.OK)
  async diagnoseArticles() {
    try {
      const totalArticles = await this.prisma.article.count();
      const publishedTrue = await this.prisma.article.count({ where: { published: true } });
      const publishedFalse = await this.prisma.article.count({ where: { published: false } });

      const statusPublished = await this.prisma.article.count({ where: { status: 'PUBLISHED' } });
      const statusDraft = await this.prisma.article.count({ where: { status: 'DRAFT' } });

      // Рассинхронизированные записи
      const desyncPublishedStatus = await this.prisma.article.count({
        where: {
          status: 'PUBLISHED',
          published: false,
        },
      });

      const desyncDraftStatus = await this.prisma.article.count({
        where: {
          status: 'DRAFT',
          published: true,
        },
      });

      // Примеры статей
      const sampleArticles = await this.prisma.article.findMany({
        take: 5,
        select: {
          id: true,
          titleKz: true,
          status: true,
          published: true,
          publishedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        diagnosis: {
          total: totalArticles,
          byPublishedField: {
            true: publishedTrue,
            false: publishedFalse,
          },
          byStatusField: {
            PUBLISHED: statusPublished,
            DRAFT: statusDraft,
          },
          desynchronized: {
            publishedStatusButNotPublished: desyncPublishedStatus,
            draftStatusButPublished: desyncDraftStatus,
          },
          needsSync: desyncPublishedStatus > 0 || desyncDraftStatus > 0,
        },
        sampleArticles,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('fix-articles-sync')
  @HttpCode(HttpStatus.OK)
  async fixArticlesSync() {
    try {
      // Синхронизировать поле published с полем status
      const result1 = await this.prisma.article.updateMany({
        where: {
          status: 'PUBLISHED',
          published: false,
        },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      const result2 = await this.prisma.article.updateMany({
        where: {
          status: {
            not: 'PUBLISHED',
          },
          published: true,
        },
        data: {
          published: false,
          publishedAt: null,
        },
      });

      return {
        success: true,
        message: 'Articles synchronized successfully',
        fixed: {
          setToPublished: result1.count,
          setToDraft: result2.count,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Public()
  @Post('fix-kazakhmys-category')
  @HttpCode(HttpStatus.OK)
  async fixKazakhmysCategory() {
    try {
      // Check if category with Russian Cyrillic already exists
      const currentCategory = await this.prisma.category.findUnique({
        where: { slug: 'казахмыс' },
      });

      if (currentCategory) {
        return {
          success: true,
          message: 'Kazakhmys category already uses correct slug',
          category: currentCategory,
        };
      }

      // Try to find old Latin slug
      const oldCategory = await this.prisma.category.findUnique({
        where: { slug: 'kazakhmys' },
      });

      if (!oldCategory) {
        return {
          success: false,
          message: 'Kazakhmys category not found (neither Latin nor Cyrillic)',
        };
      }

      // Update from Latin to Russian Cyrillic
      const updatedCategory = await this.prisma.category.update({
        where: { slug: 'kazakhmys' },
        data: {
          slug: 'казахмыс',
          nameKz: 'Казахмыс',
          nameRu: 'Казахмыс',
        },
      });

      return {
        success: true,
        message: 'Kazakhmys category updated from Latin to Cyrillic',
        category: updatedCategory,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }
}
