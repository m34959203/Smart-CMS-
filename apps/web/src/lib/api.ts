import axios from 'axios';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  User,
  Article,
  Category,
  Tag,
  CreateBilingualArticleDto,
  UpdateBilingualArticleDto,
  CreateBilingualCategoryDto,
  CreateBilingualTagDto,
  MagazineIssue,
  CreateMagazineIssueDto,
  UpdateMagazineIssueDto,
} from '@/types';
import { getApiUrl } from './api-url';

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Only access localStorage on client side (prevents SSR crash)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 on client side (prevents SSR crash)
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      // Also clear the zustand auth storage
      localStorage.removeItem('auth-storage');

      const currentPath = window.location.pathname;

      // Only redirect to login if on protected routes (admin panel)
      // Don't redirect on public pages - just clear auth silently
      const isProtectedRoute = currentPath.startsWith('/admin');
      const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');

      if (isProtectedRoute && !isAuthPage) {
        const langMatch = currentPath.match(/^\/(kz|ru)\//);
        const lang = langMatch ? langMatch[1] : 'kz';
        window.location.href = `/${lang}/login`;
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
};

// Articles API
export const articlesApi = {
  getAll: (published?: boolean) =>
    api.get<Article[]>('/articles', {
      params: published !== undefined ? { published } : {},
    }),
  getById: (id: string) => api.get<Article>(`/articles/${id}`),
  getBySlug: (slug: string) => api.get<Article>(`/articles/slug/${slug}`),
  create: (data: CreateBilingualArticleDto) => api.post<Article>('/articles', data),
  update: (id: string, data: UpdateBilingualArticleDto) =>
    api.patch<Article>(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
  deleteMany: (ids: string[]) =>
    api.post<{ message: string; count: number }>('/articles/delete-many', { ids }),
  analyze: (data: {
    titleKz: string;
    contentKz: string;
    excerptKz?: string;
    titleRu?: string;
    contentRu?: string;
    excerptRu?: string;
  }) =>
    api.post<{
      score: number;
      summary: string;
      suggestions: Array<{
        category: string;
        severity: 'low' | 'medium' | 'high';
        title: string;
        description: string;
      }>;
      strengths: string[];
      improvements: {
        title?: string;
        excerpt?: string;
      };
    }>('/articles/analyze', data),
  categorizeAll: () =>
    api.post<{
      success: boolean;
      message: string;
      stats: {
        total: number;
        updated: number;
        skipped: number;
        errors: number;
      };
    }>('/articles/categorize-all'),
  spellCheck: (data: {
    titleKz?: string;
    contentKz?: string;
    excerptKz?: string;
    titleRu?: string;
    contentRu?: string;
    excerptRu?: string;
  }) =>
    api.post<{
      hasErrors: boolean;
      errorCount: number;
      summary: string;
      corrections: Array<{
        language: string;
        field: string;
        original: string;
        corrected: string;
        errorType: string;
        description: string;
      }>;
      correctedVersions: {
        kazakh?: {
          title?: string;
          excerpt?: string;
          content?: string;
        };
        russian?: {
          title?: string;
          excerpt?: string;
          content?: string;
        };
      };
    }>('/articles/spell-check', data),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (data: CreateBilingualCategoryDto) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: Partial<CreateBilingualCategoryDto>) =>
    api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Tags API
export const tagsApi = {
  getAll: () => api.get<Tag[]>('/tags'),
  getById: (id: string) => api.get<Tag>(`/tags/${id}`),
  create: (data: CreateBilingualTagDto) => api.post<Tag>('/tags', data),
  update: (id: string, data: Partial<CreateBilingualTagDto>) =>
    api.patch<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
  generateTags: (data: {
    titleKz: string;
    contentKz: string;
    titleRu?: string;
    contentRu?: string;
  }) =>
    api.post<{
      existing: Tag[];
      created: Tag[];
      tagIds: string[];
    }>('/tags/generate', data),
  generateTagsFromArticles: () =>
    api.post<{
      totalArticles: number;
      processedArticles: number;
      errorCount: number;
      newTagsCreated: number;
    }>('/tags/generate-from-articles'),
};

// Users API
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, data: { firstName?: string; lastName?: string }) =>
    api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Media API
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{
      id: string;
      url: string;
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      createdAt: string;
    }>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<{
      id: string;
      url: string;
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      duration?: number;
      createdAt: string;
    }>('/media/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Magazine Issues API
export const magazineIssuesApi = {
  getAll: (published?: boolean) =>
    api.get<MagazineIssue[]>('/magazine-issues', {
      params: published !== undefined ? { published } : {},
    }),
  getById: (id: string) => api.get<MagazineIssue>(`/magazine-issues/${id}`),
  create: (data: CreateMagazineIssueDto, pdfFile: File) => {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('issueNumber', data.issueNumber.toString());
    formData.append('publishDate', data.publishDate);
    formData.append('titleKz', data.titleKz);
    formData.append('titleRu', data.titleRu);
    if (data.pagesCount) formData.append('pagesCount', data.pagesCount.toString());
    if (data.coverImageUrl) formData.append('coverImageUrl', data.coverImageUrl);
    if (data.isPublished !== undefined) formData.append('isPublished', data.isPublished.toString());
    if (data.isPinned !== undefined) formData.append('isPinned', data.isPinned.toString());

    return api.post<MagazineIssue>('/magazine-issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id: string, data: UpdateMagazineIssueDto) =>
    api.patch<MagazineIssue>(`/magazine-issues/${id}`, data),
  delete: (id: string) => api.delete(`/magazine-issues/${id}`),
  incrementViews: (id: string) =>
    api.post(`/magazine-issues/${id}/view`),
  incrementDownloads: (id: string) =>
    api.post(`/magazine-issues/${id}/download`),
};

// Translation API
export const translationApi = {
  translateText: (data: {
    text: string;
    sourceLanguage: 'kk' | 'ru';
    targetLanguage: 'kk' | 'ru';
  }) =>
    api.post<{ translatedText: string }>('/translation/text', data),
  translateArticle: (data: {
    title: string;
    content: string;
    excerpt?: string;
    sourceLanguage: 'kk' | 'ru';
    targetLanguage: 'kk' | 'ru';
  }) =>
    api.post<{
      title: string;
      content: string;
      excerpt?: string;
    }>('/translation/article', data),
};

// PM2 Status API
export interface PM2Process {
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
  memoryFormatted: string;
  uptime: number;
  uptimeFormatted: string;
  restarts: number;
  createdAt: string;
}

export interface PM2StatusResponse {
  available: boolean;
  processes: PM2Process[];
  error?: string;
}

export const pm2Api = {
  getStatus: () => api.get<PM2StatusResponse>('/health/pm2/status'),
  restartProcess: (processName: string) =>
    api.post<{ success: boolean; message: string }>(`/health/pm2/restart/${processName}`),
  stopProcess: (processName: string) =>
    api.post<{ success: boolean; message: string }>(`/health/pm2/stop/${processName}`),
  startProcess: (processName: string) =>
    api.post<{ success: boolean; message: string }>(`/health/pm2/start/${processName}`),
  getLogs: (processName: string, lines?: number) =>
    api.get<{ logs: string; error?: string }>(`/health/pm2/logs/${processName}`, {
      params: lines ? { lines } : {},
    }),
};

// System Settings API
export interface SystemSettings {
  id: string;
  imageOptimizationEnabled: boolean;
  maintenanceMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export const systemSettingsApi = {
  getSettings: () => api.get<SystemSettings>('/health/settings'),
  updateSettings: (data: Partial<Pick<SystemSettings, 'imageOptimizationEnabled' | 'maintenanceMode'>>) =>
    api.patch<SystemSettings>('/health/settings', data),
  isImageOptimizationEnabled: () =>
    api.get<{ imageOptimizationEnabled: boolean }>('/health/settings/image-optimization'),
};

export default api;
