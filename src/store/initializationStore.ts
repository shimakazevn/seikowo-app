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
        // We don't need to check the boolean return of initializeUser directly here.
        // Its success is determined by useUserStore.getState().storeReady after the call.
        await useUserStore.getState().initializeUser().then(() => {
          set(state => ({
            initializationProgress: { ...state.initializationProgress, user: true }
          }));
          return true; // Mark as successful for this promise chain
        }).catch(error => {
          console.error('[InitializationStore] User store initialization failed:', error);
          return false; // Mark as failed for this promise chain if an actual error occurred
        })
      ]);

      // Theme initialization is handled by ThemeProvider, we just mark it as done
      set(state => ({
        initializationProgress: { ...state.initializationProgress, theme: true }
      }));

      // Get user store state after initialization
      const userStore = useUserStore.getState();
      const userStoreReady = userStore.storeReady; // Use specific variable name for clarity

      // Consider initialization successful if:
      // 1. Database initialized successfully AND
      // 2. User store is ready (regardless of authentication state - it should be 'ready' even if user is not logged in)
      const success = dbResult && userStoreReady;
      
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