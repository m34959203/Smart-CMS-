'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface CommentsSectionProps {
  articleId: string;
  lang: 'kz' | 'ru';
}

export function CommentsSection({ articleId, lang }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    kz: {
      title: 'Пікірлер',
      noComments: 'Әзірге пікірлер жоқ',
      beFirst: 'Бірінші болып пікір қалдырыңыз!',
      placeholder: 'Пікіріңізді жазыңыз...',
      submit: 'Жіберу',
      loginRequired: 'Пікір қалдыру үшін жүйеге кіріңіз',
      login: 'Кіру',
    },
    ru: {
      title: 'Комментарии',
      noComments: 'Пока нет комментариев',
      beFirst: 'Будьте первым, кто оставит комментарий!',
      placeholder: 'Напишите ваш комментарий...',
      submit: 'Отправить',
      loginRequired: 'Войдите, чтобы оставить комментарий',
      login: 'Войти',
    },
  };

  const text = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);

    // TODO: Implement API call to save comment
    // For now, just add to local state
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      author: `${user?.firstName} ${user?.lastName}`,
      createdAt: new Date().toISOString(),
    };

    setComments([newComment, ...comments]);
    setComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {text.title}
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-500">({comments.length})</span>
        )}
      </h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={text.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {text.submit}...
                </span>
              ) : (
                text.submit
              )}
            </button>
            {comment.trim() && (
              <span className="text-sm text-gray-500">
                {comment.length} символов
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600 mb-3">{text.loginRequired}</p>
          <a
            href={`/${lang}/login`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            {text.login}
          </a>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                    {comment.author[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{text.noComments}</h3>
          <p className="text-gray-500">{text.beFirst}</p>
        </div>
      )}
    </div>
  );
}
