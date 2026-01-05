import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;
  private bucketName: string;
  private useLocalStorage: boolean = false;
  private localStoragePath: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET', 'media');

    // Local storage configuration
    this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH', './uploads');
    this.publicUrl = this.configService.get<string>('PUBLIC_URL', 'http://localhost:4000');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured. Using local file storage.');
      this.useLocalStorage = true;
      this.ensureUploadDirectory();
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    const uploadDir = path.join(this.localStoragePath, 'magazines');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${uploadDir}`);
    }
  }

  /**
   * Upload file (Supabase or local storage)
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ url: string; path: string } | null> {
    if (this.useLocalStorage) {
      return this.uploadFileLocally(buffer, filename);
    }

    return this.uploadToSupabase(buffer, filename, mimeType);
  }

  /**
   * Upload file to local storage
   */
  private async uploadFileLocally(
    buffer: Buffer,
    filename: string,
  ): Promise<{ url: string; path: string } | null> {
    try {
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
      const filePath = path.join(this.localStoragePath, 'magazines', uniqueFilename);

      // Ensure directory exists
      this.ensureUploadDirectory();

      // Write file
      fs.writeFileSync(filePath, buffer);

      const relativePath = `magazines/${uniqueFilename}`;
      const publicUrl = `${this.publicUrl}/uploads/${relativePath}`;

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

  /**
   * Upload file to Supabase Storage
   */
  private async uploadToSupabase(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ url: string; path: string } | null> {
    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      return null;
    }

    try {
      const filePath = `uploads/${Date.now()}-${filename}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        this.logger.error('Failed to upload file to Supabase:', error);
        return null;
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Supabase:', error);
      return null;
    }
  }

  /**
   * Delete file (Supabase or local storage)
   */
  async deleteFile(filePath: string): Promise<boolean> {
    if (this.useLocalStorage) {
      return this.deleteFileLocally(filePath);
    }

    return this.deleteFromSupabase(filePath);
  }

  /**
   * Delete file from local storage
   */
  private async deleteFileLocally(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.localStoragePath, filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`File deleted locally: ${fullPath}`);
        return true;
      }

      this.logger.warn(`File not found for deletion: ${fullPath}`);
      return false;
    } catch (error) {
      this.logger.error('Error deleting file locally:', error);
      return false;
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  private async deleteFromSupabase(filePath: string): Promise<boolean> {
    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      return false;
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error('Failed to delete file from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error deleting file from Supabase:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (this.useLocalStorage) {
      const fullPath = path.join(this.localStoragePath, filePath);
      return fs.existsSync(fullPath);
    }

    if (!this.supabase) {
      return false;
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('uploads', {
          search: filePath,
        });

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}
