import { useMutation } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api';

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
  });
}

export function useUploadVideo() {
  return useMutation({
    mutationFn: (file: File) => mediaApi.uploadVideo(file),
  });
}
