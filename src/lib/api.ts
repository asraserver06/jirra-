import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isPublicRequest = (url = '') =>
  /\/api\/(?:invites\/(?:validate|preview|accept)|auth\/(?:login|signup|register|google|refresh))(?:[/?]|$)/.test(url);

const isRefreshRequest = (url = '') => /\/api\/auth\/refresh(?:[/?]|$)/.test(url);

api.interceptors.request.use((config) => {
  if (isPublicRequest(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jira_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }

  return config;
});

let refreshRequest: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retry || isPublicRequest(config.url) || isRefreshRequest(config.url)) {
      return Promise.reject(error);
    }

    config._retry = true;

    if (!refreshRequest) {
      refreshRequest = api
        .post<{ success: boolean; data?: { accessToken?: string } }>('/api/auth/refresh', {})
        .then((response) => {
          const token = response.data.data?.accessToken;
          if (!token) {
            throw new Error('Refresh response did not include an access token.');
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('jira_token', token);
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: token }));
          }
          return token;
        })
        .catch((refreshError: unknown) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jira_token');
            localStorage.removeItem('jira_user');
            window.dispatchEvent(new Event('auth:logout'));
          }
          throw refreshError;
        })
        .finally(() => {
          refreshRequest = null;
        });
    }

    try {
      const token = await refreshRequest;
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    } catch {
      return Promise.reject(error);
    }
  }
);

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};
