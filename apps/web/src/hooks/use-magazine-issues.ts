import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { magazineIssuesApi } from '@/lib/api';
import type { CreateMagazineIssueDto, UpdateMagazineIssueDto } from '@/types';

export function useMagazineIssues(published?: boolean) {
  return useQuery({
    queryKey: ['magazine-issues', published],
    queryFn: async () => {
      const response = await magazineIssuesApi.getAll(published);
      return response.data;
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

export function useMagazineIssue(id: string) {
  return useQuery({
    queryKey: ['magazine-issue', id],
    queryFn: async () => {
      const response = await magazineIssuesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateMagazineIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: CreateMagazineIssueDto; file: File }) =>
      magazineIssuesApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magazine-issues'] });
    },
  });
}

export function useUpdateMagazineIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMagazineIssueDto }) =>
      magazineIssuesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['magazine-issues'] });
      queryClient.invalidateQueries({ queryKey: ['magazine-issue', variables.id] });
    },
  });
}

export function useDeleteMagazineIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => magazineIssuesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['magazine-issues'] });
    },
  });
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: (id: string) => magazineIssuesApi.incrementViews(id),
  });
}

export function useIncrementDownloads() {
  return useMutation({
    mutationFn: (id: string) => magazineIssuesApi.incrementDownloads(id),
  });
}
