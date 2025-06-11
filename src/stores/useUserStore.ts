const initializeUser = async () => {
  console.log('[useUserStore] Starting user initialization...');
  try {
    const [userData, token] = await Promise.all([
      getAndDecryptUserData<UserData>(),
      getAndDecryptToken()
    ]);
    
    console.log('[useUserStore] Retrieved data:', {
      hasUserData: !!userData,
      hasToken: !!token
    });

    if (userData && token) {
      console.log('[useUserStore] Setting user data and token...');
      set({ user: userData, accessToken: token, isAuthenticated: true });
      console.log('[useUserStore] User initialization complete');
    } else {
      console.log('[useUserStore] Missing user data or token, clearing state...');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  } catch (error) {
    console.error('[useUserStore] Error during user initialization:', error);
    set({ user: null, accessToken: null, isAuthenticated: false });
  }
}; 