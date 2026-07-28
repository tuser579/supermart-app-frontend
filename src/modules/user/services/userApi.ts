import { get, put, del, post } from '../../../shared/api/apiClient';
import { User, UpdateProfilePayload, ChangePasswordPayload } from '../../../shared/types/auth.types';

export const userApi = {
  getProfile: () => {
    return get<User>('/users/profile');
  },
  
  updateProfile: (payload: UpdateProfilePayload) => {
    return put<User>('/users/profile', payload as unknown as Record<string, unknown>);
  },
  
  changePassword: (payload: ChangePasswordPayload) => {
    return put<{ message: string }>('/users/change-password', payload as unknown as Record<string, unknown>);
  },
  
  deleteAccount: () => {
    return del<{ message: string }>('/users/account');
  },
  
  savePushToken: (token: string) => {
    return post<{ message: string }>('/users/push-token', { token });
  }
};
