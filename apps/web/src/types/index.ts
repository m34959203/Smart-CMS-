export enum Role {
  USER = 'USER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum SocialMediaPlatform {
  TELEGRAM = 'TELEGRAM',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  FACEBOOK = 'FACEBOOK',
}

export enum PublicationStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  // Bilingual fields
  nameKz: string;
  nameRu: string;
  descriptionKz?: string;
  descriptionRu?: string;
  // Hierarchy
  parentId?: string;
  parent?: Category;
  children?: Category[];
  sortOrder: number;
  isActive: boolean;
  articles?: Article[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  slug: string;
  nameKz: string;
  nameRu: string;
  usageCount: number;
  articles?: Article[];
  createdAt: string;
}

export interface Article {
  id: string;

  // Kazakh language
  slugKz: string;
  titleKz: string;
  subtitleKz?: string;
  excerptKz?: string;
  contentKz: string;

  // Russian language
  slugRu?: string;
  titleRu?: string;
  subtitleRu?: string;
  excerptRu?: string;
  contentRu?: string;

  // Media
  coverImage?: string;
  featuredImageId?: string;

  // Status and publication
  status: ArticleStatus;
  published: boolean;
  publishedAt?: string;
  scheduledAt?: string;

  // Flags
  isBreaking: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  allowComments: boolean;
  autoPublishEnabled: boolean;
  autoPublishPlatforms?: SocialMediaPlatform[];

  // Metrics
  views: number;
  likes: number;
  shares: number;

  // AI
  aiGenerated: boolean;
  aiProvider?: string;

  // Relations
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  categoryId: string;
  category: Category;
  tags: Tag[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  altTextKz?: string;
  altTextRu?: string;
  captionKz?: string;
  captionRu?: string;
  uploadedById?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId?: string;
  parentId?: string;
  content: string;
  guestName?: string;
  guestEmail?: string;
  isApproved: boolean;
  isDeleted: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Backward compatible DTO (maps to Kazakh fields)
export interface CreateArticleDto {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId: string;
  tagIds?: string[];
  published?: boolean;
}

// Backward compatible DTO
export interface UpdateArticleDto {
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  tagIds?: string[];
  published?: boolean;
}

// New bilingual DTOs
export interface CreateBilingualArticleDto {
  // Kazakh (required)
  titleKz: string;
  contentKz: string;
  excerptKz?: string;

  // Russian (optional)
  titleRu?: string;
  contentRu?: string;
  excerptRu?: string;

  // Common fields
  coverImage?: string;
  categoryId: string;
  tagIds?: string[];
  status?: ArticleStatus;
  published?: boolean;

  // Flags
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  allowComments?: boolean;

  // Social Media Auto-Publish
  autoPublishEnabled?: boolean;
  autoPublishPlatforms?: SocialMediaPlatform[];
}

export interface UpdateBilingualArticleDto {
  // Kazakh
  titleKz?: string;
  contentKz?: string;
  excerptKz?: string;

  // Russian
  titleRu?: string;
  contentRu?: string;
  excerptRu?: string;

  // Common fields
  coverImage?: string;
  categoryId?: string;
  tagIds?: string[];
  status?: ArticleStatus;
  published?: boolean;

  // Flags
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  allowComments?: boolean;

  // Social Media Auto-Publish
  autoPublishEnabled?: boolean;
  autoPublishPlatforms?: SocialMediaPlatform[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface CreateBilingualCategoryDto {
  slug: string;
  nameKz: string;
  nameRu: string;
  descriptionKz?: string;
  descriptionRu?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CreateTagDto {
  name: string;
}

export interface UpdateTagDto {
  name?: string;
}

export interface CreateBilingualTagDto {
  nameKz: string;
  nameRu: string;
}

// Magazine Issues
export interface MagazineIssue {
  id: string;
  issueNumber: number;
  publishDate: string;

  // Bilingual fields
  titleKz: string;
  titleRu: string;

  // PDF file
  pdfFilename: string;
  pdfUrl: string;
  fileSize: number;
  pagesCount?: number;

  // Cover
  coverImageUrl?: string;

  // Metrics
  viewsCount: number;
  downloadsCount: number;

  // Status
  isPublished: boolean;
  isPinned: boolean;

  // Relations
  uploadedById?: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateMagazineIssueDto {
  issueNumber: number;
  publishDate: string;
  titleKz: string;
  titleRu: string;
  pagesCount?: number;
  coverImageUrl?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}

export interface UpdateMagazineIssueDto {
  issueNumber?: number;
  publishDate?: string;
  titleKz?: string;
  titleRu?: string;
  pagesCount?: number;
  coverImageUrl?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}
