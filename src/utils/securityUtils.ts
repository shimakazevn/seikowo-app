import CryptoJS from 'crypto-js';
import { saveDataToDB, getDataFromDB, deleteUserData, STORES } from './indexedDBUtils';
import type { EncryptedData, SessionData, TokenResponse } from '../types/auth';

// Constants
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.warn('[securityUtils] VITE_ENCRYPTION_KEY is not set in environment variables. This may cause authentication issues.');
}

const TOKEN_KEY = 'encrypted_token';
const USER_DATA_KEY = 'encrypted_user_data';
const SESSION_KEY = 'secure_session';

// Encryption helpers
export const encryptData = <T>(data: T): string | null => {
  try {
    if (!data) return null;
    if (!ENCRYPTION_KEY) {
      console.error('[securityUtils] Cannot encrypt data: ENCRYPTION_KEY is not set');
      return null;
    }
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[securityUtils] Encryption error:', error.message);
    } else {
      console.error('[securityUtils] Encryption error: Unknown error', error);
    }
    return null;
  }
};

export const decryptData = <T>(encryptedData: string): T | null => {
  try {
    if (!encryptedData) return null;
    if (!ENCRYPTION_KEY) {
      console.error('[securityUtils] Cannot decrypt data: ENCRYPTION_KEY is not set');
      return null;
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      console.error('[securityUtils] Decryption failed: empty result');
      return null;
    }
    return JSON.parse(decryptedString);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[securityUtils] Decryption error:', error.message);
    }
    else {
      console.error('[securityUtils] Decryption error: Unknown error', error);
    }
    return null;
  }
};

// Token management with encryption
export const encryptAndStoreToken = async (token: string): Promise<boolean> => {
  try {
    if (!token) return false;
    const encryptedToken = encryptData(token);
    if (!encryptedToken) return false;
    
    await saveDataToDB(STORES.USER_DATA, TOKEN_KEY, encryptedToken);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error storing encrypted token:', error.message);
    } else {
      console.error('Error storing encrypted token: Unknown error', error);
    }
    return false;
  }
};

export const getAndDecryptToken = async (): Promise<string | null> => {
  try {
    console.log('[securityUtils] Attempting to get and decrypt token...');
    const tokenData = await getDataFromDB<EncryptedData>(STORES.USER_DATA, TOKEN_KEY);
    console.log('[securityUtils] Token data from IndexedDB:', tokenData ? 'exists' : 'not found');
    
    if (!tokenData?.value) {
      console.log('[securityUtils] No token value found');
      return null;
    }
    
    const decryptedToken = decryptData<string>(tokenData.value);
    console.log('[securityUtils] Token decryption result:', decryptedToken ? 'success' : 'failed');
    return decryptedToken;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[securityUtils] Error retrieving encrypted token:', error.message);
    } else {
      console.error('[securityUtils] Error retrieving encrypted token: Unknown error', error);
    }
    return null;
  }
};

// User data encryption
export const encryptAndStoreUserData = async <T>(userData: T): Promise<boolean> => {
  try {
    if (!userData) return false;
    const encryptedData = encryptData(userData);
    if (!encryptedData) return false;
    
    await saveDataToDB(STORES.USER_DATA, USER_DATA_KEY, encryptedData);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error storing encrypted user data:', error.message);
    } else {
      console.error('Error storing encrypted user data: Unknown error', error);
    }
    return false;
  }
};

export const getAndDecryptUserData = async <T>(): Promise<T | null> => {
  try {
    console.log('[securityUtils] Attempting to get and decrypt user data...');
    const userData = await getDataFromDB<EncryptedData>(STORES.USER_DATA, USER_DATA_KEY);
    console.log('[securityUtils] User data from IndexedDB:', userData ? 'exists' : 'not found');
    
    if (!userData?.value) {
      console.log('[securityUtils] No user data value found');
      return null;
    }
    
    const decryptedData = decryptData<T>(userData.value);
    console.log('[securityUtils] User data decryption result:', decryptedData ? 'success' : 'failed');
    return decryptedData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[securityUtils] Error retrieving encrypted user data:', error.message);
    } else {
      console.error('[securityUtils] Error retrieving encrypted user data: Unknown error', error);
    }
    return null;
  }
};

// Clear encrypted data
export const clearEncryptedData = async (): Promise<boolean> => {
  try {
    await Promise.all([
      deleteUserData(TOKEN_KEY),
      deleteUserData(USER_DATA_KEY),
      deleteUserData(SESSION_KEY)
    ]);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error clearing encrypted data:', error.message);
    } else {
      console.error('Error clearing encrypted data: Unknown error', error);
    }
    return false;
  }
};

// Data compression
export const compressData = <T>(data: T): string | null => {
  try {
    if (!data) return null;
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Simple base64 encoding for now
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Compression error:', error.message);
    } else {
      console.error('Compression error: Unknown error', error);
    }
    return null;
  }
};

export const decompressData = <T>(compressedData: string): T | null => {
  try {
    if (!compressedData) return null;
    const jsonString = atob(compressedData);
    return JSON.parse(jsonString);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Decompression error:', error.message);
    } else {
      console.error('Decompression error: Unknown error', error);
    }
    return null;
  }
};

// Session management
export const createSecureSession = async (
  userData: unknown,
  token: string,
  refreshToken: string
): Promise<boolean> => {
  try {
    console.log('Creating secure session...', {
      hasUserData: !!userData,
      hasToken: !!token,
      hasRefreshToken: !!refreshToken
    });

    const sessionData: SessionData = {
      userData: userData,
      token,
      refreshToken,
      timestamp: Date.now(),
      sessionId: CryptoJS.lib.WordArray.random(16).toString(),
      expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour
    };
    
    const encryptedSession = encryptData(sessionData);
    if (!encryptedSession) {
      console.error('Failed to encrypt session data');
      return false;
    }
    
    await saveDataToDB(STORES.USER_DATA, SESSION_KEY, encryptedSession);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error creating secure session:', error.message);
    } else {
      console.error('Error creating secure session: Unknown error', error);
    }
    return false;
  }
};

export const validateSession = async (): Promise<boolean> => {
  try {
    console.log('Validating session...');
    const sessionData = await getDataFromDB<EncryptedData>(STORES.USER_DATA, SESSION_KEY);
    if (!sessionData?.value) {
      console.log('No secure session found');
      return false;
    }
    
    const decryptedSession = decryptData<SessionData>(sessionData.value);
    if (!decryptedSession) {
      console.error('Failed to decrypt session data');
      return false;
    }
    
    if (decryptedSession.expiresAt && Date.now() > decryptedSession.expiresAt) {
      console.log('Session expired');
      await clearEncryptedData(); // Clear expired session
      return false;
    }
    
    // You might want to re-validate token with Google API here as well if not done elsewhere
    // For now, just checking existence and expiry
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error validating session:', error.message);
    } else {
      console.error('Error validating session: Unknown error', error);
    }
    return false;
  }
};

// TOTP management (Time-based One-Time Password)
export const generateTOTP = (secret?: string): { secret: string; code: string } | null => {
  try {
    const s = secret || CryptoJS.lib.WordArray.random(20).toString(CryptoJS.enc.Hex); // Generate a new secret if not provided
    const otp = { secret: s, code: s }; // Placeholder for actual TOTP generation logic
    return otp;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error generating TOTP:', error.message);
    } else {
      console.error('Error generating TOTP: Unknown error', error);
    }
    return null;
  }
};

export const verifyTOTP = async (secret: string, code: string): Promise<boolean> => {
  try {
    // Placeholder for actual TOTP verification logic
    // This function might need await if it involves API calls, etc.
    // For now, it's assumed to be async based on initial definition.
    return true; // Always true for now
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error verifying TOTP:', error.message);
    } else {
      console.error('Error verifying TOTP: Unknown error', error);
    }
    return false;
  }
};

export const deleteAuthData = async (): Promise<void> => {
  try {
    await clearEncryptedData();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting auth data:', error.message);
    } else {
      console.error('Error deleting auth data: Unknown error', error);
    }
  }
}; 