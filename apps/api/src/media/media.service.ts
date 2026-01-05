import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LocalStorageService } from '../common/storage/local-storage.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: LocalStorageService,
  ) {}

  async saveMediaFile(file: Express.Multer.File, userId: string) {
    // Upload to local storage
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    if (!uploadResult) {
      this.logger.error('Failed to upload file');
      throw new Error('Failed to upload file');
    }

    this.logger.log(`File uploaded successfully: ${uploadResult.url}`);

    // Save metadata to database with error handling
    try {
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          filename: uploadResult.path,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: uploadResult.url,
          uploadedById: userId,
        },
      });

      return {
        id: mediaFile.id,
        url: mediaFile.url,
        filename: mediaFile.filename,
        originalFilename: mediaFile.originalFilename,
        mimeType: mediaFile.mimeType,
        size: mediaFile.size,
        width: mediaFile.width,
        height: mediaFile.height,
        createdAt: mediaFile.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to save media file to database:', error);
      // Try to clean up uploaded file on database error
      await this.storageService.deleteFile(uploadResult.path);
      throw new Error('Failed to save media file metadata');
    }
  }

  async saveVideoFile(file: Express.Multer.File, userId: string) {
    // Upload video to local storage (in videos subdirectory)
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'videos', // Store videos in a separate folder
    );

    if (!uploadResult) {
      this.logger.error('Failed to upload video file');
      throw new Error('Failed to upload video file');
    }

    this.logger.log(`Video uploaded successfully: ${uploadResult.url}`);

    // Save metadata to database with error handling
    try {
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          filename: uploadResult.path,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: uploadResult.url,
          uploadedById: userId,
        },
      });

      return {
        id: mediaFile.id,
        url: mediaFile.url,
        filename: mediaFile.filename,
        originalFilename: mediaFile.originalFilename,
        mimeType: mediaFile.mimeType,
        size: mediaFile.size,
        createdAt: mediaFile.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to save video file to database:', error);
      await this.storageService.deleteFile(uploadResult.path);
      throw new Error('Failed to save video file metadata');
    }
  }

  async findOne(id: string) {
    return this.prisma.mediaFile.findUnique({
      where: { id },
    });
  }

  async findAll(userId?: string, take = 100, skip = 0) {
    return this.prisma.mediaFile.findMany({
      where: userId ? { uploadedById: userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take, // Limit results to prevent memory exhaustion
      skip,
    });
  }
}
