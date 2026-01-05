import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api';
import type { CreateBilingualArticleDto, UpdateBilingualArticleDto } from '@/types';

export function useArticles(published?: boolean) {
  return useQuery({
    queryKey: ['articles', published],
    queryFn: async () => {
      const response = await articlesApi.getAll(published);
      return response.data;
    },
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await articlesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ['article', 'slug', slug],
    queryFn: async () => {
      const response = await articlesApi.getBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBilingualArticleDto) => articlesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBilingualArticleDto }) =>
      articlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteManyArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => articlesApi.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useAnalyzeArticle() {
  return useMutation({
    mutationFn: (data: {
      titleKz: string;
      contentKz: string;
      excerptKz?: string;
      titleRu?: string;
      contentRu?: string;
      excerptRu?: string;
      targetLanguage?: 'kz' | 'ru';
    }) => articlesApi.analyze(data),
  });
}

export function useCategorizeAllArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => articlesApi.categorizeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useSpellCheckArticle() {
  return useMutation({
    mutationFn: (data: {
      titleKz?: string;
      contentKz?: string;
      excerptKz?: string;
      titleRu?: string;
      contentRu?: string;
      excerptRu?: string;
    }) => articlesApi.spellCheck(data),
  });
}
