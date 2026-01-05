import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/lib/api';
import type { CreateBilingualTagDto } from '@/types';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await tagsApi.getAll();
      return response.data;
    },
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: async () => {
      const response = await tagsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBilingualTagDto) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBilingualTagDto> }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useGenerateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      titleKz: string;
      contentKz: string;
      titleRu?: string;
      contentRu?: string;
    }) => tagsApi.generateTags(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useGenerateTagsFromArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tagsApi.generateTagsFromArticles(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
