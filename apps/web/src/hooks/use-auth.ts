import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { LoginDto, RegisterDto } from '@/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Hydrate the store on client-side mount to prevent hydration mismatches
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setIsMounted(true);
  }, []);

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.accessToken);
      queryClient.invalidateQueries();
      router.push('/');
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
    // Try to get current lang from pathname, default to 'kz'
    const currentPath = window.location.pathname;
    const langMatch = currentPath.match(/^\/(kz|ru)\//);
    const lang = langMatch ? langMatch[1] : 'kz';
    router.push(`/${lang}/login`);
  };

  // Query current user - only runs when mounted, hydrated, and has a valid token
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        return response.data;
      } catch (error: any) {
        // On 401, clear auth state silently - this is expected for invalid/expired tokens
        if (error.response?.status === 401) {
          clearAuth();
          return null;
        }
        throw error;
      }
    },
    // Only enable after mount, hydration, and when we have an access token
    enabled: isMounted && _hasHydrated && !!accessToken,
    retry: false,
    // Don't log errors for this query - 401 is expected for logged-out users
    meta: { silentError: true },
  });

  return {
    user: currentUser || user,
    accessToken,
    isAuthenticated: isAuthenticated(),
    isLoading: loginMutation.isPending || registerMutation.isPending || isLoadingUser,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
