'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const t = {
    kz: {
      title: 'Кіру',
      email: 'Email',
      password: 'Құпия сөз',
      loginButton: 'Кіру',
      loggingIn: 'Кіру...',
      error: 'Қате email немесе құпия сөз',
      noAccount: 'Аккаунт жоқ па?',
      register: 'Тіркелу',
      emailPlaceholder: 'user@example.com',
      passwordPlaceholder: '••••••••',
    },
    ru: {
      title: 'Вход',
      email: 'Email',
      password: 'Пароль',
      loginButton: 'Войти',
      loggingIn: 'Вход...',
      error: 'Неверный email или пароль',
      noAccount: 'Нет аккаунта?',
      register: 'Регистрация',
      emailPlaceholder: 'user@example.com',
      passwordPlaceholder: '••••••••',
    },
  };

  const text = t[lang];

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push(`/${lang}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">{text.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {loginMutation.isError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {text.error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              {text.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={text.emailPlaceholder}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              {text.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={text.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? text.loggingIn : text.loginButton}
            </button>
            <Link href={`/${lang}/register`} className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
              {text.noAccount} {text.register}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
