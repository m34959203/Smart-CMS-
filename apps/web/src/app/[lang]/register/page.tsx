'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function RegisterPage() {
  const params = useParams();
  const lang = (params.lang as 'kz' | 'ru') || 'kz';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const t = {
    kz: {
      title: 'Тіркелу',
      firstName: 'Аты',
      lastName: 'Тегі',
      email: 'Email',
      password: 'Құпия сөз',
      registerButton: 'Тіркелу',
      registering: 'Тіркелу...',
      error: 'Тіркелу қатесі',
      errorMessage: 'Деректерді тексеріп, қайталап көріңіз',
      hasAccount: 'Аккаунт бар ма?',
      login: 'Кіру',
      firstNamePlaceholder: 'Иван',
      lastNamePlaceholder: 'Иванов',
      emailPlaceholder: 'user@example.com',
      passwordPlaceholder: 'Кем дегенде 8 таңба',
    },
    ru: {
      title: 'Регистрация',
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Email',
      password: 'Пароль',
      registerButton: 'Зарегистрироваться',
      registering: 'Регистрация...',
      error: 'Ошибка регистрации',
      errorMessage: 'Проверьте данные и попробуйте еще раз',
      hasAccount: 'Уже есть аккаунт?',
      login: 'Войти',
      firstNamePlaceholder: 'Иван',
      lastNamePlaceholder: 'Иванов',
      emailPlaceholder: 'user@example.com',
      passwordPlaceholder: 'Минимум 8 символов',
    },
  };

  const text = t[lang];

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push(`/${lang}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ email, password, firstName, lastName });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">{text.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {registerMutation.isError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">{text.error}:</p>
              <p className="text-sm mt-1">
                {(registerMutation.error as any)?.response?.data?.message ||
                 (registerMutation.error as any)?.message ||
                 text.errorMessage}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              {text.firstName}
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={text.firstNamePlaceholder}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              {text.lastName}
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={text.lastNamePlaceholder}
              required
            />
          </div>

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
              minLength={8}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? text.registering : text.registerButton}
            </button>
            <Link href={`/${lang}/login`} className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
              {text.hasAccount} {text.login}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
