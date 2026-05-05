import axios from 'axios';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
});

// Request interceptor: attach Supabase access token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Set Content-Type to application/json ONLY if body is not FormData
    // (Axios auto-sets multipart/form-data with the correct boundary for FormData)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 by signing out and redirecting
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
