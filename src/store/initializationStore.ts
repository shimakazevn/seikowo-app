import { create } from 'zustand';
import { initializeDatabase } from '../utils/indexedDBUtils';
import useUserStore from './useUserStore';

interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: Error | null;
  initializationProgress: {
    database: boolean;
    user: boolean;
    theme: boolean;
  };
  initialize: () => Promise<void>;
  reset: () => void;
}

const useInitializationStore = create<InitializationState>((set, get) => ({
  isInitialized: false,
  isInitializing: false,
  initializationError: null,
  initializationProgress: {
    database: false,
    user: false,
    theme: false,
  },

  initialize: async () => {
    // Prevent multiple simultaneous initializations
    if (get().isInitializing) {
      return;
    }

    set({ isInitializing: true, initializationError: null });

    try {
      // Run database and user initialization in parallel
      const [dbResult, userResult] = await Promise.all([
        // Initialize database
        initializeDatabase().then(() => {
          set(state => ({
            initializationProgress: { ...state.initializationProgress, database: true }
          }));
          return true;
        }).catch(error => {
          console.error('[InitializationStore] Database initialization failed:', error);
          return false;
        }),

        // Initialize user store
        useUserStore.getState().initializeUser().then(() => {
          set(state => ({
            initializationProgress: { ...state.initializationProgress, user: true }
          }));
          return true;
        }).catch(error => {
          console.error('[InitializationStore] User store initialization failed:', error);
          return false;
        })
      ]);

      // Theme initialization is handled by ThemeProvider, we just mark it as done
      set(state => ({
        initializationProgress: { ...state.initializationProgress, theme: true }
      }));

      // Get user store state after initialization
      const userStore = useUserStore.getState();
      const storeReady = userStore.storeReady;

      // Consider initialization successful if:
      // 1. Database initialized successfully AND
      // 2. User store is ready (regardless of authentication state)
      const success = dbResult && storeReady;
      
      set({
        isInitialized: success,
        isInitializing: false,
        initializationError: success ? null : new Error('Initialization failed')
      });

    } catch (error) {
      console.error('[InitializationStore] Initialization error:', error);
      set({
        isInitialized: false,
        isInitializing: false,
        initializationError: error as Error
      });
    }
  },

  reset: () => {
    set({
      isInitialized: false,
      isInitializing: false,
      initializationError: null,
      initializationProgress: {
        database: false,
        user: false,
        theme: false,
      }
    });
  }
}));

export default useInitializationStore; 