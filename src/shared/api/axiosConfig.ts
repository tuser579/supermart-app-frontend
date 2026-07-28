import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken, clearTokens } from '../utils/storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://supermart-api.up.railway.app/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Memory cache for token (faster than SecureStore on every request)
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

export async function initTokens() {
  cachedAccessToken = await getAccessToken();
  cachedRefreshToken = await getRefreshToken();
}

export function setCachedTokens(access: string | null, refresh: string | null) {
  cachedAccessToken = access;
  cachedRefreshToken = refresh;
}

// Request interceptor — attach Bearer token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!cachedAccessToken) {
      cachedAccessToken = await getAccessToken();
    }
    if (cachedAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${cachedAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — silent refresh on 401
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string | null) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (!cachedRefreshToken) {
          cachedRefreshToken = await getRefreshToken();
        }

        if (!cachedRefreshToken) {
          onRefreshed(null);
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: cachedRefreshToken,
        });

        const newAccessToken = response.data.data.tokens.accessToken;
        const newRefreshToken = response.data.data.tokens.refreshToken;

        cachedAccessToken = newAccessToken;
        cachedRefreshToken = newRefreshToken;
        await saveAccessToken(newAccessToken);
        await saveRefreshToken(newRefreshToken);

        onRefreshed(newAccessToken);

        originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        onRefreshed(null);
        cachedAccessToken = null;
        cachedRefreshToken = null;
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
