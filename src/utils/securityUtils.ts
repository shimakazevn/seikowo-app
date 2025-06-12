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
  } catch (error: any) {
    console.error('[securityUtils] Encryption error:', error);
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
  } catch (error: any) {
    console.error('[securityUtils] Decryption error:', error);
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
  } catch (error: any) {
    console.error('Error storing encrypted token:', error);
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
  } catch (error: any) {
    console.error('[securityUtils] Error retrieving encrypted token:', error);
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
  } catch (error: any) {
    console.error('Error storing encrypted user data:', error);
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
  } catch (error: any) {
    console.error('[securityUtils] Error retrieving encrypted user data:', error);
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
  } catch (error: any) {
    console.error('Error clearing encrypted data:', error);
    return false;
  }
};

// Data compression
export const compressData = <T>(data: T): string | null => {
  try {
    if (!data) return null;
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Simple base64 encoding for now
  } catch (error: any) {
    console.error('Compression error:', error);
    return null;
  }
};

export const decompressData = <T>(compressedData: string): T | null => {
  try {
    if (!compressedData) return null;
    const jsonString = atob(compressedData);
    return JSON.parse(jsonString);
  } catch (error: any) {
    console.error('Decompression error:', error);
    return null;
  }
};

// Session management
export const createSecureSession = async (
  userData: any,
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
      userData,
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
  } catch (error: any) {
    console.error('Error creating secure session:', error);
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
    
    const session = decryptData<SessionData>(sessionData.value);
    if (!session) {
      console.log('Failed to decrypt session data');
      return false;
    }

    console.log('Session data:', {
      hasUserData: !!session.userData,
      hasToken: !!session.token,
      hasRefreshToken: !!session.refreshToken,
      expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : null,
      currentTime: new Date().toISOString()
    });
    
    // Check if session is expired
    if (Date.now() >= session.expiresAt) {
      console.log('Session expired, attempting to refresh token');
      // Try to refresh token if we have one
      if (session.refreshToken) {
        try {
          console.log('Attempting to refresh token...');
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });
          
          if (response.ok) {
            console.log('Token refresh successful');
            const { accessToken, refreshToken } = await response.json() as TokenResponse;
            // Update session with new tokens
            const success = await createSecureSession(session.userData, accessToken, refreshToken);
            if (success) {
              console.log('Session updated with new tokens');
              return true;
            }
          }
          console.log('Token refresh failed');
        } catch (error: any) {
          console.error('Error refreshing token:', error);
        }
      } else {
        console.log('No refresh token available');
      }
      
      // If refresh failed or no refresh token, clear session
      console.log('Clearing expired session');
      await clearEncryptedData();
      return false;
    }
    
    console.log('Session is valid');
    return true;
  } catch (error: any) {
    console.error('Error validating session:', error);
    return false;
  }
};

// Two-factor authentication helpers
export const generateTOTP = async (secret?: string): Promise<{ secret: string; code: string } | null> => {
  try {
    // Generate a new secret if none provided
    const finalSecret = secret || CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    
    const timestamp = Math.floor(Date.now() / 30000); // 30-second window
    const message = timestamp.toString(16).padStart(16, '0');
    const key = CryptoJS.enc.Hex.parse(finalSecret);
    const hash = CryptoJS.HmacSHA1(message, key);
    const offset = hash.words[hash.words.length - 1] & 0xf;
    const code = ((hash.words[offset >> 2] >> (24 - (offset & 0x3) * 8)) & 0x7fffffff) % 1000000;
    return {
      secret: finalSecret,
      code: code.toString().padStart(6, '0')
    };
  } catch (error: any) {
    console.error('Error generating TOTP:', error);
    return null;
  }
};

export const verifyTOTP = async (secret: string, code: string): Promise<boolean> => {
  try {
    const result = await generateTOTP(secret);
    if (!result) return false;
    return result.code === code;
  } catch (error: any) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
}; 