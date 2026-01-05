import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../common/storage/storage.module';

// Image file filter
export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

// Video file filter
export const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
    return callback(new Error('Only video files are allowed!'), false);
  }
  callback(null, true);
};

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for images
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
