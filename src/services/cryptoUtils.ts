import { API_BASE_URL } from '../config/runtime';
// Production-ready crypto utilities for AES-GCM encryption/decryption
// Compatible with backend AES-256-GCM implementation

class CryptoUtils {
  constructor() {
    this.algorithm = 'AES-256-GCM';
    this.keyDerivation = 'PBKDF2-SHA256';
    this.iterations = 100000;
    this.isReady = false;
    this.sessionId = null;
  }

  /**
   * Initialize encryption from backend parameters
   */
  setEncryptionParams(algorithmInfo) {
    try {
      this.algorithm = algorithmInfo.algorithm || 'AES-256-GCM';
      this.keyDerivation = algorithmInfo.key_derivation || 'PBKDF2-SHA256';
      this.iterations = algorithmInfo.iterations || 100000;
      this.sessionId = algorithmInfo.session_id;
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('Failed to set encryption parameters:', error);
      return false;
    }
  }

  /**
   * Get encryption parameters from backend
   */
  async fetchEncryptionKey() {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/encryption-key`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch encryption parameters');
      }

      const data = await response.json();
      console.debug('Received encryption parameters:', data);
    
      // New response format contains only algorithm info, not specific keys
      // Keys should be derived from password+salt on each encryption
      return this.setEncryptionParams(data);
    } catch (error) {
      console.error('Error fetching encryption parameters:', error);
      return false;
    }
  }

  /**
   * Derive key from password and salt using PBKDF2
   */
  async deriveKey(password, salt, iterations = 100000) {
    try {
      // Convert strings to Uint8Array
      const passwordBuffer = new TextEncoder().encode(password);
      
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      // Derive key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      return derivedKey;
    } catch (error) {
      console.error('Key derivation error:', error);
      return null;
    }
  }

  /**
   * Decrypt data received from backend using AES-GCM
   */
  async decryptData(encryptedData) {
    try {
      if (!this.isReady) {
        console.error('Encryption not initialized. Call fetchEncryptionKey() first.');
        throw new Error('Encryption not initialized. Call fetchEncryptionKey() first.');
      }

      if (!encryptedData || typeof encryptedData !== 'string') {
        console.error('Invalid encrypted data provided:', typeof encryptedData);
        throw new Error('Invalid encrypted data provided');
      }

      // Decode base64 to get the encrypted package
      let encryptedPackage;
      try {
        encryptedPackage = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      } catch (error) {
        console.error('Failed to decode base64 data:', error);
        throw new Error('Failed to decode base64 data');
      }
      
      // Check minimum package size (salt + iv + tag = 44 bytes minimum)
      if (encryptedPackage.length < 44) {
        console.error('Encrypted package too small:', encryptedPackage.length);
        throw new Error('Encrypted package too small');
      }
      
      // Extract components (salt + iv + tag + ciphertext)
      const salt = encryptedPackage.slice(0, 16);       // First 16 bytes: salt
      const iv = encryptedPackage.slice(16, 28);        // Next 12 bytes: IV
      const tag = encryptedPackage.slice(28, 44);       // Next 16 bytes: authentication tag
      const ciphertext = encryptedPackage.slice(44);    // Remaining: ciphertext

      console.debug('Decryption components:', {
        saltLength: salt.length,
        ivLength: iv.length,
        tagLength: tag.length,
        ciphertextLength: ciphertext.length
      });

      // SECURITY: every AES key here derives from this one value, and until
      // now it was ALWAYS the literal below. `process.env.REACT_APP_*` is a
      // Create React App leftover that Vite never populates, and
      // vite.config.ts defines `process.env` as `{}`, so the read could only
      // ever be undefined. Reading VITE_ENCRYPTION_PASSWORD at least lets the
      // value come from somewhere real.
      //
      // This is NOT a fix for the underlying problem. A build-time constant in
      // a browser bundle is readable by anyone who opens devtools, so this is
      // shared-secret obfuscation, not key management. Deliberately NOT moved
      // to runtime config: publishing it in a fetchable /config.js would be
      // strictly worse. Needs real key management, tracked separately.
      const password =
        import.meta.env.VITE_ENCRYPTION_PASSWORD || 'default-key-change-in-production';
      
      // Derive key from password and extracted salt
      const key = await this.deriveKey(password, salt, this.iterations);
      if (!key) {
        console.error('Failed to derive decryption key');
        throw new Error('Failed to derive decryption key');
      }

      // For Web Crypto API, AES-GCM expects ciphertext with tag appended at the end
      const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
      ciphertextWithTag.set(ciphertext);
      ciphertextWithTag.set(tag, ciphertext.length);

      // Decrypt using AES-GCM
      try {
        const decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          ciphertextWithTag
        );

        // Convert to string and parse JSON
        const decryptedStr = new TextDecoder().decode(decryptedBuffer);
        const result = JSON.parse(decryptedStr);
        console.debug('Decryption successful');
        return result;
      } catch (cryptoError) {
        console.error('Crypto.subtle.decrypt failed:', cryptoError);
        throw new Error(`Decryption failed: ${cryptoError.message}`);
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data to send to backend (if needed for requests)
   */
  async encryptData(data) {
    try {
      if (!this.isReady) {
        throw new Error('Encryption not initialized');
      }
      
      // Note: Frontend encryption for requests is optional
      // Current implementation focuses on decrypting responses
      console.warn('Frontend encryption not implemented. Backend handles request encryption if needed.');
      return JSON.stringify(data);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Check if encryption is properly initialized
   */
  isInitialized() {
    return this.isReady && this.algorithm === 'AES-256-GCM';
  }
}

// Export singleton instance
const cryptoUtils = new CryptoUtils();
export default cryptoUtils;