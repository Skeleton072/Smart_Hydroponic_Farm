import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  isLoading: boolean;

  checkAuth: () => Promise<void>;
  signIn: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isLoading: true,

  checkAuth: async () => {
    try {
      const storedId = await AsyncStorage.getItem('USER_ID');
      set({ userId: storedId, isLoading: false });
    } catch (error) {
      console.error('Failed to load user ID:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (id: string) => {
    try {
      await AsyncStorage.setItem('USER_ID', id);
      set({ userId: id });
    } catch (error) {
      console.error('Failed to save user ID:', error);
    }
  },
  
  signOut: async () => {
    try {
      await AsyncStorage.removeItem('USER_ID');
      set({ userId: null });
    } catch (error) {
      console.error('Failed to remove user ID:', error);
    }
  },
}));