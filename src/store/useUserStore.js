import { create } from 'zustand';
import { GoogleAuthEvents } from '../components/GoogleDriveLogin';
import { getUserData } from '../utils/indexedDBUtils';

const useUserStore = create((set) => {
  // Khởi tạo state ban đầu
  const initialAccessToken = localStorage.getItem('furina_water');
  const initialIsGuest = !initialAccessToken;

  return {
    userId: null,
    accessToken: initialAccessToken,
    isGuest: initialIsGuest,
    userData: null,

    // Actions
    setUser: async (userId, accessToken) => {
      try {
        const userData = await getUserData(userId);
        console.log('Setting user:', { userId, hasAccessToken: !!accessToken });
        set({
          userId,
          accessToken,
          isGuest: false,
          userData
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        set({
          userId,
          accessToken,
          isGuest: false,
          userData: null
        });
      }
    },

    setGuest: () => {
      console.log('Setting guest mode');
      set({
        userId: null,
        accessToken: null,
        isGuest: true,
        userData: null
      });
    },

    // Initialize store and listen for auth events
    initialize: () => {
      // Subscribe to auth events
      const unsubscribeLogin = GoogleAuthEvents.subscribe('LOGIN_SUCCESS', ({ userId, accessToken }) => {
        console.log('Login success event received:', { userId, hasAccessToken: !!accessToken });
        set({
          userId,
          accessToken,
          isGuest: false
        });
      });

      const unsubscribeLogout = GoogleAuthEvents.subscribe('LOGOUT_SUCCESS', () => {
        console.log('Logout success event received');
        set({
          userId: null,
          accessToken: null,
          isGuest: true,
          userData: null
        });
      });

      // Return cleanup function
      return () => {
        unsubscribeLogin();
        unsubscribeLogout();
      };
    }
  };
});

export default useUserStore; 