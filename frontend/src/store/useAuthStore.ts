import { create } from 'zustand';
import api from '../services/api';
import useSocketStore from './useSocketStore';

export interface IUserStoreData {
  _id: string;
  username: string;
  name: string;
  email: string;
  token?: string;
  bio?: string;
  motto?: string;
  interests?: string[];
  domain?: string;
  skills?: string[];
  profilePicture?: string;
}

interface AuthState {
  user: IUserStoreData | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<IUserStoreData>;
  register: (userData: any) => Promise<IUserStoreData>;
  verifyOtp: (email: string, otp: string) => Promise<IUserStoreData>;
  resendOtp: (email: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  checkUserSession: () => Promise<void>;
  updateToken: (token: string) => void;
  updateProfile: (profileData: any) => Promise<IUserStoreData>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post<IUserStoreData>('/auth/login', { email, password });
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify({ _id: data._id, username: data.username, name: data.name, email: data.email }));
      if (data.token) {
        useSocketStore.getState().connectSocket(data.token);
      }
      return data;
    } catch (error: any) {
      set({ loading: false });
      throw error.response?.data?.message || 'Login failed';
    }
  },

  register: async (userData) => {
    set({ loading: true });
    try {
      const { data } = await api.post<IUserStoreData>('/auth/register', userData);
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify({ _id: data._id, username: data.username, name: data.name, email: data.email }));
      if (data.token) {
        useSocketStore.getState().connectSocket(data.token);
      }
      return data;
    } catch (error: any) {
      set({ loading: false });
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  verifyOtp: async (email, otp) => {
    set({ loading: true });
    try {
      const { data } = await api.post<IUserStoreData>('/auth/verify-otp', { email, otp });
      set({ user: data, loading: false });
      localStorage.setItem('userInfo', JSON.stringify({ _id: data._id, username: data.username, name: data.name, email: data.email }));
      return data;
    } catch (error: any) {
      set({ loading: false });
      throw error.response?.data?.message || 'Verification failed';
    }
  },

  resendOtp: async (email) => {
    try {
      const { data } = await api.post<{ message: string }>('/auth/resend-otp', { email });
      return data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to resend OTP';
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      useSocketStore.getState().disconnectSocket();
      localStorage.removeItem('userInfo');
      set({ user: null, loading: false });
    }
  },

  checkUserSession: async () => {
    const localInfo = localStorage.getItem('userInfo');
    if (!localInfo) {
      set({ user: null, loading: false, initialized: true });
      return;
    }

    try {
      // Attempt to refresh the access token first using the HttpOnly cookie
      const { data: refreshData } = await api.get('/auth/refresh');
      const token = refreshData.token;

      // Fetch user profile using the new access token
      const { data: profileData } = await api.get<IUserStoreData>('/auth/profile');
      set({ 
        user: { ...profileData, token }, 
        loading: false, 
        initialized: true 
      });
      useSocketStore.getState().connectSocket(token);
    } catch (error) {
      console.error('Session initialization failed:', error);
      localStorage.removeItem('userInfo');
      set({ user: null, loading: false, initialized: true });
    }
  },

  updateToken: (token) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, token } });
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true });
    try {
      const { data } = await api.put<IUserStoreData>('/auth/profile', profileData);
      const currentUser = get().user;
      const token = currentUser?.token;
      
      const updatedUser = { ...data, token };
      set({ user: updatedUser, loading: false });
      
      localStorage.setItem('userInfo', JSON.stringify({ 
        _id: updatedUser._id, 
        username: updatedUser.username, 
        name: updatedUser.name, 
        email: updatedUser.email 
      }));
      return updatedUser;
    } catch (error: any) {
      set({ loading: false });
      throw error.response?.data?.message || 'Profile update failed';
    }
  }
}));

export default useAuthStore;
