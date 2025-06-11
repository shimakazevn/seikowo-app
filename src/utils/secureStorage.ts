// Secure Storage Utility for sensitive data
import { saveDataToDB, getDataFromDB, clearDataFromDB } from './indexedDBUtils';

interface SecureStorageOptions {
  storeName?: string;
  keyName?: string;
  sessionKey?: boolean;
}

export class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKeys: Map<string, string> = new Map();

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Generate a secure encryption key
   */
  private generateSecureKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or generate encryption key for a specific context
   */
  private async getEncryptionKey(keyName: string, sessionKey: boolean = true): Promise<string> {
    console.log(`[SecureStorage] Getting encryption key: ${keyName}, sessionKey: ${sessionKey}`);

    // Check memory cache first
    if (this.encryptionKeys.has(keyName)) {
      console.log(`[SecureStorage] Found encryption key in memory cache`);
      return this.encryptionKeys.get(keyName)!;
    }

    // Check session/local storage
    const storage = sessionKey ? sessionStorage : localStorage;
    const storageType = sessionKey ? 'sessionStorage' : 'localStorage';
    let key = storage.getItem(`secure_key_${keyName}`);

    if (!key) {
      // Generate new key
      console.log(`[SecureStorage] No encryption key found in ${storageType}, generating new one`);
      key = this.generateSecureKey();
      storage.setItem(`secure_key_${keyName}`, key);
      console.log(`[SecureStorage] New encryption key generated and stored in ${storageType}`);
    } else {
      console.log(`[SecureStorage] Found existing encryption key in ${storageType}`);
    }

    // Cache in memory
    this.encryptionKeys.set(keyName, key);
    return key;
  }

  /**
   * Encrypt data using XOR encryption with salt
   * Note: For production, use Web Crypto API with proper AES
   */
  private async encryptData(data: string, keyName: string, sessionKey: boolean): Promise<string> {
    try {
      console.log(`[SecureStorage] Encrypting data with key: ${keyName}`);

      const key = await this.getEncryptionKey(keyName, sessionKey);
      if (!key || key.length === 0) {
        throw new Error('Invalid encryption key');
      }

      // Add timestamp and random salt for better security
      const timestamp = Date.now().toString();
      const salt = this.generateSecureKey().substring(0, 16);
      const payload = `${timestamp}:${salt}:${data}`;

      console.log(`[SecureStorage] Payload prepared, length: ${payload.length}`);

      // Simple XOR encryption (fallback for compatibility)
      let encrypted = '';
      for (let i = 0; i < payload.length; i++) {
        const keyIndex = i % key.length;
        const keyChar = key.charCodeAt(keyIndex);
        const dataChar = payload.charCodeAt(i);
        encrypted += String.fromCharCode(dataChar ^ keyChar);
      }

      const result = btoa(encrypted);
      console.log(`[SecureStorage] Data encrypted successfully, result length: ${result.length}`);
      return result;
    } catch (error) {
      console.error('[SecureStorage] Encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   */
  private async decryptData(encryptedData: string, keyName: string, sessionKey: boolean): Promise<string> {
    try {
      console.log(`[SecureStorage] Decrypting data with key: ${keyName}`);

      const key = await this.getEncryptionKey(keyName, sessionKey);
      if (!key || key.length === 0) {
        throw new Error('Invalid decryption key');
      }

      const encrypted = atob(encryptedData);
      console.log(`[SecureStorage] Base64 decoded, length: ${encrypted.length}`);

      // Simple XOR decryption (matching encryption)
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyIndex = i % key.length;
        const keyChar = key.charCodeAt(keyIndex);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }

      console.log(`[SecureStorage] Data decrypted, length: ${decrypted.length}`);

      // Extract actual data (remove timestamp and salt)
      const parts = decrypted.split(':');
      if (parts.length >= 3) {
        const result = parts.slice(2).join(':');
        console.log(`[SecureStorage] Payload extracted successfully`);
        return result;
      }

      throw new Error('Invalid encrypted data format');
    } catch (error) {
      console.error('[SecureStorage] Decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Store data securely
   */
  async setItem(
    key: string,
    data: any,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    const {
      storeName = 'secureStorage',
      keyName = 'default',
      sessionKey = true
    } = options;

    try {
      console.log(`[SecureStorage] Attempting to store: ${key}`);

      // 1. Serialize data
      const serializedData = JSON.stringify(data);
      console.log(`[SecureStorage] Data serialized, length: ${serializedData.length}`);

      // 2. Encrypt data
      const encryptedData = await this.encryptData(serializedData, keyName, sessionKey);
      console.log(`[SecureStorage] Data encrypted, length: ${encryptedData.length}`);

      // 3. Try to store in preferred store, fallback to 'cache' if needed
      let actualStoreName = storeName;
      try {
        await saveDataToDB(storeName, key, {
          data: encryptedData,
          timestamp: Date.now(),
          keyName,
          sessionKey
        });
      } catch (storeError) {
        if (storeError.message?.includes('not found') && storeName === 'secureStorage') {
          console.warn(`[SecureStorage] Store '${storeName}' not found, falling back to 'cache'`);
          actualStoreName = 'cache';
          await saveDataToDB(actualStoreName, key, {
            data: encryptedData,
            timestamp: Date.now(),
            keyName,
            sessionKey
          });
        } else {
          throw storeError;
        }
      }

      console.log(`[SecureStorage] Data stored securely in '${actualStoreName}': ${key}`);
    } catch (error) {
      console.error(`[SecureStorage] Failed to store ${key}:`, error);
      console.error(`[SecureStorage] Error details:`, {
        message: error.message,
        stack: error.stack,
        storeName,
        keyName,
        sessionKey
      });
      throw new Error(`SecureStorage setItem failed: ${error.message}`);
    }
  }

  /**
   * Retrieve data securely
   */
  async getItem<T = any>(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<T | null> {
    const {
      storeName = 'secureStorage',
      keyName = 'default',
      sessionKey = true
    } = options;

    try {
      // Try preferred store first, then fallback to 'cache'
      let storedData: any = null;
      let actualStoreName = storeName;

      try {
        storedData = await getDataFromDB<{
          data: string;
          timestamp: number;
          keyName: string;
          sessionKey: boolean;
        }>(storeName, key);
      } catch (storeError) {
        if (storeError.message?.includes('not found') && storeName === 'secureStorage') {
          console.warn(`[SecureStorage] Store '${storeName}' not found, trying 'cache'`);
          actualStoreName = 'cache';
          storedData = await getDataFromDB<{
            data: string;
            timestamp: number;
            keyName: string;
            sessionKey: boolean;
          }>(actualStoreName, key);
        } else {
          throw storeError;
        }
      }

      if (!storedData?.data) {
        console.log(`[SecureStorage] No data found for key: ${key}`);
        return null;
      }

      // Use stored key preferences
      const actualKeyName = storedData.keyName || keyName;
      const actualSessionKey = storedData.sessionKey ?? sessionKey;

      const decryptedData = await this.decryptData(
        storedData.data,
        actualKeyName,
        actualSessionKey
      );

      console.log(`[SecureStorage] Data retrieved securely from '${actualStoreName}': ${key}`);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error(`[SecureStorage] Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data securely
   */
  async removeItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    const { storeName = 'secureStorage' } = options;

    try {
      // Try to remove from preferred store, then fallback
      try {
        await clearDataFromDB(storeName, key);
        console.log(`[SecureStorage] Data removed securely from '${storeName}': ${key}`);
      } catch (storeError) {
        if (storeError.message?.includes('not found') && storeName === 'secureStorage') {
          console.warn(`[SecureStorage] Store '${storeName}' not found, trying 'cache'`);
          await clearDataFromDB('cache', key);
          console.log(`[SecureStorage] Data removed securely from 'cache': ${key}`);
        } else {
          throw storeError;
        }
      }
    } catch (error) {
      console.error(`[SecureStorage] Failed to remove ${key}:`, error);
      // Don't throw error for missing data during cleanup
      if (error.name === 'NotFoundError') {
        console.warn(`[SecureStorage] Data '${key}' not found during removal, skipping`);
        return;
      }
      throw error;
    }
  }

  /**
   * Clear all encryption keys (logout)
   */
  async clearAllKeys(): Promise<void> {
    try {
      console.log('[SecureStorage] ⚠️ Clearing all encryption keys - this should only happen on logout');

      // Clear memory cache
      this.encryptionKeys.clear();

      // Clear session storage keys
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('secure_key_'));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));

      // Clear localStorage keys (for persistent login)
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith('secure_key_'));
      localKeys.forEach(key => localStorage.removeItem(key));

      console.log('[SecureStorage] All encryption keys cleared:', {
        memoryKeys: 'cleared',
        sessionKeys: sessionKeys.length,
        localKeys: localKeys.length
      });
    } catch (error) {
      console.error('[SecureStorage] Failed to clear keys:', error);
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Export types
export type { SecureStorageOptions };
