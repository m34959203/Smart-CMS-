import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    // Транслитерация казахских и русских символов в латиницу
    const translitMap: { [key: string]: string } = {
      // Казахские специфичные буквы
      'ә': 'a', 'Ә': 'A',
      'і': 'i', 'І': 'I',
      'ң': 'n', 'Ң': 'N',
      'ғ': 'g', 'Ғ': 'G',
      'ү': 'u', 'Ү': 'U',
      'ұ': 'u', 'Ұ': 'U',
      'қ': 'q', 'Қ': 'Q',
      'ө': 'o', 'Ө': 'O',
      'һ': 'h', 'Һ': 'H',
      // Общие кириллические буквы
      'а': 'a', 'А': 'A',
      'б': 'b', 'Б': 'B',
      'в': 'v', 'В': 'V',
      'г': 'g', 'Г': 'G',
      'д': 'd', 'Д': 'D',
      'е': 'e', 'Е': 'E',
      'ё': 'yo', 'Ё': 'Yo',
      'ж': 'zh', 'Ж': 'Zh',
      'з': 'z', 'З': 'Z',
      'и': 'i', 'И': 'I',
      'й': 'y', 'Й': 'Y',
      'к': 'k', 'К': 'K',
      'л': 'l', 'Л': 'L',
      'м': 'm', 'М': 'M',
      'н': 'n', 'Н': 'N',
      'о': 'o', 'О': 'O',
      'п': 'p', 'П': 'P',
      'р': 'r', 'Р': 'R',
      'с': 's', 'С': 'S',
      'т': 't', 'Т': 'T',
      'у': 'u', 'У': 'U',
      'ф': 'f', 'Ф': 'F',
      'х': 'kh', 'Х': 'Kh',
      'ц': 'ts', 'Ц': 'Ts',
      'ч': 'ch', 'Ч': 'Ch',
      'ш': 'sh', 'Ш': 'Sh',
      'щ': 'shch', 'Щ': 'Shch',
      'ъ': '', 'Ъ': '',
      'ы': 'y', 'Ы': 'Y',
      'ь': '', 'Ь': '',
      'э': 'e', 'Э': 'E',
      'ю': 'yu', 'Ю': 'Yu',
      'я': 'ya', 'Я': 'Ya',
    };

    // Транслитерация
    const transliterated = name.split('').map(char => translitMap[char] || char).join('');

    // Генерация slug: только латиница и цифры
    return transliterated
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Только латиница и цифры!
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateCategoryDto) {
    // Use provided slug or generate from nameKz/name
    const nameForSlug = dto.nameKz || dto.name || '';
    const slug = dto.slug || this.generateSlug(nameForSlug);

    if (!slug) {
      throw new ConflictException('Name or slug is required');
    }

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({
      data: {
        nameKz: dto.nameKz || dto.name || '',
        nameRu: dto.nameRu || dto.name || '',
        slug,
        descriptionKz: dto.descriptionKz || dto.description || null,
        descriptionRu: dto.descriptionRu || dto.description || null,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
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
    const category = await this.prisma.category.findUnique({
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

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = {};

    // Support bilingual fields
    if (dto.nameKz !== undefined) {
      updateData.nameKz = dto.nameKz;
    }
    if (dto.nameRu !== undefined) {
      updateData.nameRu = dto.nameRu;
    }
    if (dto.descriptionKz !== undefined) {
      updateData.descriptionKz = dto.descriptionKz;
    }
    if (dto.descriptionRu !== undefined) {
      updateData.descriptionRu = dto.descriptionRu;
    }

    // Legacy support for single name/description
    if (dto.name) {
      updateData.nameKz = dto.name;
      updateData.nameRu = dto.name;
      updateData.slug = this.generateSlug(dto.name);
    }

    if (dto.description !== undefined && !dto.descriptionKz && !dto.descriptionRu) {
      updateData.descriptionKz = dto.description;
      updateData.descriptionRu = dto.description;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.articles > 0) {
      throw new ConflictException('Cannot delete category with existing articles');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
