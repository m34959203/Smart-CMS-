import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MagazineIssuesController } from './magazine-issues.controller';
import { MagazineIssuesService } from './magazine-issues.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        // Разрешить только PDF файлы
        if (!file.originalname.match(/\.pdf$/i)) {
          return callback(new Error('Разрешены только PDF файлы!'), false);
        }

        // Проверка MIME type
        if (file.mimetype !== 'application/pdf') {
          return callback(new Error('Неверный MIME type. Разрешен только application/pdf'), false);
        }

        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB (PDF журналов обычно больше 5MB)
      },
    }),
  ],
  controllers: [MagazineIssuesController],
  providers: [MagazineIssuesService],
  exports: [MagazineIssuesService],
})
export class MagazineIssuesModule {}
