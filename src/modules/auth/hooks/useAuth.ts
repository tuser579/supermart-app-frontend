import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks/useRedux';
import { setCredentials, logout, updateUser } from '../../../shared/store/slices/authSlice';
import { setCart } from '../../../shared/store/slices/cartSlice';
import * as authApi from '../services/authApi';
import * as storage from '../../../shared/utils/storage';
import { setCachedTokens } from '../../../shared/api/axiosConfig';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { LoginPayload, RegisterPayload, OTPPayload, UpdateProfilePayload, ChangePasswordPayload } from '../../../shared/types/auth.types';
import { userApi } from '../../user/services/userApi';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isLoggedIn, isHydrated } = useAppSelector((s) => s.auth);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const response = await authApi.login(payload);
      dispatch(setCredentials({
        user: response.user,
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      }));
      setCachedTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await storage.saveAccessToken(response.tokens.accessToken);
      await storage.saveRefreshToken(response.tokens.refreshToken);
      await storage.saveStoredUser(JSON.stringify(response.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, [dispatch]);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const response = await authApi.register(payload);
      dispatch(setCredentials({
        user: response.user,
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      }));
      setCachedTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await storage.saveAccessToken(response.tokens.accessToken);
      await storage.saveRefreshToken(response.tokens.refreshToken);
      await storage.saveStoredUser(JSON.stringify(response.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, [dispatch]);

  const verifyOTP = useCallback(async (payload: OTPPayload) => {
    try {
      const response = await authApi.verifyOTP(payload);
      dispatch(setCredentials({
        user: response.user,
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      }));
      setCachedTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await storage.saveAccessToken(response.tokens.accessToken);
      await storage.saveRefreshToken(response.tokens.refreshToken);
      await storage.saveStoredUser(JSON.stringify(response.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, [dispatch]);

  const resendOTP = useCallback(async (email: string) => {
    try {
      await authApi.resendOTP(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore — we clear locally regardless
    }
    setCachedTokens(null, null);  
    await storage.clearTokens();
    dispatch(logout());
    dispatch(setCart([]));
  }, [dispatch]);

  const updateProfile = useCallback(async (updates: UpdateProfilePayload) => {
    try {
      const updatedUser = await userApi.updateProfile(updates);
      const mergedUser = { ...user, ...updatedUser };
      dispatch(updateUser(mergedUser));
      await storage.saveStoredUser(JSON.stringify(mergedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, [dispatch, user]);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    try {
      await userApi.changePassword(payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await userApi.deleteAccount();
      // On success, clear local state
      setCachedTokens(null, null);
      await storage.clearTokens();
      dispatch(logout());
      dispatch(setCart([]));
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, [dispatch]);

  return {
    user,
    isLoggedIn,
    isHydrated,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout: logoutUser,
    updateProfile,
    changePassword,
    deleteAccount,
  };
}
