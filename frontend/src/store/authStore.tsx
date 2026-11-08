// import { create } from 'zustand';
// import * as SecureStore from "expo-secure-store";

// interface AuthState {
//   userId: string | null;
//   isLoading: boolean;

//   checkAuth: () => Promise<void>;
//   signOut: () => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   userId: null,
//   isLoading: true,

//   checkAuth: async () => {
//     try {
//       const storedId = await AsyncStorage.getItem('USER_ID');
//       set({ userId: storedId, isLoading: false });
//     } catch (error) {
//       console.error('Failed to load user ID:', error);
//       set({ isLoading: false });
//     }
//   },
  
//   signOut: async () => {
//     try {
//       await AsyncStorage.removeItem('USER_ID');
//       set({ userId: null });
//     } catch (error) {
//       console.error('Failed to remove user ID:', error);
//     }
//   },
// }));