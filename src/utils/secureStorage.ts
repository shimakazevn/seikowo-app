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
  private getEncryptionKey(keyName: string, sessionKey: boolean = true): string {
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

      const key = this.getEncryptionKey(keyName, sessionKey);
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('[SecureStorage] Encryption error:', error.message);
        throw new Error(`Failed to encrypt data: ${error.message}`);
      }
      console.error('[SecureStorage] Encryption error: Unknown error', error);
      throw new Error(`Failed to encrypt data: Unknown error`);
    }
  }

  /**
   * Decrypt data
   */
  private async decryptData(encryptedData: string, keyName: string, sessionKey: boolean): Promise<string> {
    try {
      console.log(`[SecureStorage] Decrypting data with key: ${keyName}`);

      const key = this.getEncryptionKey(keyName, sessionKey);
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('[SecureStorage] Decryption error:', error.message);
        throw new Error(`Failed to decrypt data: ${error.message}`);
      }
      console.error('[SecureStorage] Decryption error: Unknown error', error);
      throw new Error(`Failed to decrypt data: Unknown error`);
    }
  }

  /**
   * Store data securely
   */
  async setItem(
    key: string,
    data: unknown,
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
      } catch (storeError: unknown) {
        if (storeError instanceof Error && storeError.message?.includes('not found') && storeName === 'secureStorage') {
          console.warn(`[SecureStorage] Store '${storeName}' not found, falling back to 'cache'`);
          actualStoreName = 'cache';
          await saveDataToDB(actualStoreName, key, {
            data: encryptedData,
            timestamp: Date.now(),
            keyName,
            sessionKey
          });
        } else if (storeError instanceof Error) {
          throw storeError;
        } else {
          throw new Error(`Unknown error during store operation: ${storeError}`);
        }
      }

      console.log(`[SecureStorage] Data stored securely in '${actualStoreName}': ${key}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`[SecureStorage] Failed to store ${key}:`, error.message);
        console.error(`[SecureStorage] Error details:`, {
          message: error.message,
          stack: error.stack,
          storeName,
          keyName,
          sessionKey
        });
        throw new Error(`SecureStorage setItem failed: ${error.message}`);
      }
      console.error(`[SecureStorage] Failed to store ${key}: Unknown error`, error);
      throw new Error(`SecureStorage setItem failed: Unknown error`);
    }
  }

  /**
   * Retrieve data securely
   */
  async getItem<T = unknown>(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<T | null> {
    const {
      storeName = 'secureStorage',
      keyName = 'default',
      sessionKey = true
    } = options;

    try {
      console.log(`[SecureStorage] Attempting to retrieve: ${key}`);
      let retrievedData;
      let actualStoreName = storeName;

      try {
        retrievedData = await getDataFromDB<{data: string;timestamp: number;keyName: string;sessionKey: boolean;}>(storeName, key);
      } catch (retrieveError: unknown) {
        if (retrieveError instanceof Error && retrieveError.message?.includes('not found') && storeName === 'secureStorage') {
          console.warn(`[SecureStorage] Store '${storeName}' not found for retrieval, falling back to 'cache'`);
          actualStoreName = 'cache';
          retrievedData = await getDataFromDB<{data: string;timestamp: number;keyName: string;sessionKey: boolean;}>(actualStoreName, key);
        } else if (retrieveError instanceof Error) {
          throw retrieveError;
        } else {
          throw new Error(`Unknown error during retrieve operation: ${retrieveError}`);
        }
      }

      if (!retrievedData || !retrievedData.data) {
        console.log(`[SecureStorage] No data found for key: ${key} in store: ${actualStoreName}`);
        return null;
      }

      // Check keyName and sessionKey matching if they were stored
      if (retrievedData.keyName !== keyName || retrievedData.sessionKey !== sessionKey) {
        console.warn(`[SecureStorage] Key mismatch for ${key}. Stored with keyName: ${retrievedData.keyName}, sessionKey: ${retrievedData.sessionKey}. Requested with keyName: ${keyName}, sessionKey: ${sessionKey}. Returning null.`);
        return null;
      }

      // 1. Decrypt data
      const decryptedData = await this.decryptData(retrievedData.data, keyName, sessionKey);
      console.log(`[SecureStorage] Data decrypted, length: ${decryptedData.length}`);

      // 2. Deserialize data
      const deserializedData: T = JSON.parse(decryptedData);
      console.log(`[SecureStorage] Data deserialized for ${key}`);
      return deserializedData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`[SecureStorage] Failed to retrieve ${key}:`, error.message);
      } else {
        console.error(`[SecureStorage] Failed to retrieve ${key}: Unknown error`, error);
      }
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
      console.log(`[SecureStorage] Attempting to remove: ${key} from store: ${storeName}`);
      await clearDataFromDB(storeName, key);
      console.log(`[SecureStorage] Data removed securely: ${key}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`[SecureStorage] Failed to remove ${key}:`, error.message);
      } else {
        console.error(`[SecureStorage] Failed to remove ${key}: Unknown error`, error);
      }
      throw new Error(`SecureStorage removeItem failed: ${error}`);
    }
  }

  /**
   * Clear all secure keys and data from storage.
   * This should be used cautiously as it will invalidate all secure items.
   */
  async clearAllKeys(): Promise<void> {
    try {
      console.log('[SecureStorage] Clearing all secure keys...');
      // Clear in-memory cache
      this.encryptionKeys.clear();

      // Clear from session/local storage
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('secure_key_')) {
          sessionStorage.removeItem(key);
        }
      }
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('secure_key_')) {
          localStorage.removeItem(key);
        }
      }

      // Clear from IndexedDB stores (assuming 'secureStorage' and 'cache' are the main ones)
      await clearDataFromDB('secureStorage');
      await clearDataFromDB('cache');

      console.log('[SecureStorage] All secure keys cleared.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('[SecureStorage] Error clearing all keys:', error.message);
      } else {
        console.error('[SecureStorage] Error clearing all keys: Unknown error', error);
      }
      throw new Error(`SecureStorage clearAllKeys failed: ${error}`);
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Export types
export type { SecureStorageOptions };
