import { useMutation } from '@tanstack/react-query';
import { translationApi } from '@/lib/api';

export function useTranslateText() {
  return useMutation({
    mutationFn: (data: {
      text: string;
      sourceLanguage: 'kk' | 'ru';
      targetLanguage: 'kk' | 'ru';
    }) => translationApi.translateText(data),
  });
}

export function useTranslateArticle() {
  return useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      excerpt?: string;
      sourceLanguage: 'kk' | 'ru';
      targetLanguage: 'kk' | 'ru';
    }) => translationApi.translateArticle(data),
  });
}
