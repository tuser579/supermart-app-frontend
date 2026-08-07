import axiosInstance from './axiosConfig';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: Record<string, unknown>;
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await axiosInstance.get<ApiResponse<T>>(url, { params });
  return response.data.data;
}

export async function getFull<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const response = await axiosInstance.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function post<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const response = await axiosInstance.post<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function put<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const response = await axiosInstance.put<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const response = await axiosInstance.patch<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await axiosInstance.delete<ApiResponse<T>>(url);
  return response.data.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    console.log('Axios error details:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      request: !!error.request
    });
    if (error.response?.data) {
      const data = error.response.data as ApiResponse<unknown>;
      if (data.errors && data.errors.length > 0) {
        return data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      }
      return data.message || error.message || 'An error occurred';
    }
    if (error.request) {
      return 'Network error. Please check your internet connection or server availability.';
    }
    return error.message || 'Network error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

import axios from 'axios';
