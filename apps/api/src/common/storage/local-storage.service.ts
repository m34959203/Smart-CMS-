import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

// Cyrillic to Latin transliteration map
const cyrillicToLatinMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya',
  // Kazakh specific letters
  'ә': 'a', 'ғ': 'g', 'қ': 'q', 'ң': 'n', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 'һ': 'h', 'і': 'i',
  // Uppercase
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
  'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
  'Я': 'Ya',
  // Kazakh uppercase
  'Ә': 'A', 'Ғ': 'G', 'Қ': 'Q', 'Ң': 'N', 'Ө': 'O', 'Ұ': 'U', 'Ү': 'U', 'Һ': 'H', 'І': 'I',
};

function sanitizeFilename(filename: string): string {
  // Transliterate Cyrillic to Latin
  let result = '';
  for (const char of filename) {
    result += cyrillicToLatinMap[char] || char;
  }
  // Replace spaces with underscores, remove special characters except dots, hyphens, underscores
  result = result.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  // Remove multiple consecutive underscores/hyphens
  result = result.replace(/[-_]+/g, '_');
  // Ensure filename is not empty
  return result || 'file';
}

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private uploadDir: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', '/var/www/html/uploads');
    this.baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:4000');

    // Ensure upload directory exists (async, fire-and-forget on startup)
    this.ensureUploadDir().then(() => {
      this.logger.log(`Local storage initialized: ${this.uploadDir}`);
    });
  }

  private async ensureUploadDir(subdir?: string): Promise<void> {
    const targetDir = subdir ? path.join(this.uploadDir, subdir) : this.uploadDir;
    try {
      await fs.access(targetDir);
    } catch {
      await fs.mkdir(targetDir, { recursive: true });
      this.logger.log(`Created upload directory: ${targetDir}`);
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    subdir?: string,
  ): Promise<{ url: string; path: string } | null> {
    try {
      // Ensure subdirectory exists if specified
      if (subdir) {
        await this.ensureUploadDir(subdir);
      }

      // Generate unique filename with sanitization (Cyrillic to Latin)
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const sanitizedBasename = sanitizeFilename(basename);
      const uniqueName = `${Date.now()}-${sanitizedBasename}${ext}`;

      // Build file path with optional subdirectory
      const relativePath = subdir ? path.join(subdir, uniqueName) : uniqueName;
      const filePath = path.join(this.uploadDir, relativePath);

      // Write file to disk (async - doesn't block event loop)
      await fs.writeFile(filePath, buffer);

      // Generate public URL
      const publicUrl = `${this.baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

      this.logger.log(`File uploaded locally: ${filePath}`);

      return {
        url: publicUrl,
        path: relativePath,
      };
    } catch (error) {
      this.logger.error('Error uploading file locally:', error);
      return null;
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        this.logger.log(`File deleted: ${filePath}`);
        return true;
      } catch {
        // File doesn't exist
        return false;
      }
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
