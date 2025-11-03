/**
 * Utility functions to mask sensitive information in logs
 */

/**
 * Mask private key - shows only first 6 and last 4 characters
 * @param {string} privateKey - Private key to mask
 * @returns {string} Masked private key (e.g., "0x1234...5678")
 */
function maskPrivateKey(privateKey) {
  if (!privateKey || typeof privateKey !== 'string') {
    return '***';
  }
  if (privateKey.startsWith('0x') && privateKey.length >= 10) {
    return `${privateKey.substring(0, 8)}...${privateKey.substring(privateKey.length - 4)}`;
  }
  if (privateKey.length >= 10) {
    return `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}`;
  }
  return '***';
}

/**
 * Mask mnemonic phrase - shows only first 2 and last 2 words
 * @param {string} mnemonic - Mnemonic phrase to mask
 * @returns {string} Masked mnemonic (e.g., "word1 word2 ... word11 word12")
 */
function maskMnemonic(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return '***';
  }
  const words = mnemonic.split(' ');
  if (words.length >= 4) {
    return `${words[0]} ${words[1]} ... ${words[words.length - 2]} ${words[words.length - 1]}`;
  }
  return '*** *** ... *** ***';
}

/**
 * Mask any sensitive string - generic function
 * @param {string} value - Value to mask
 * @param {string} type - Type of sensitive data ('key', 'mnemonic', or 'generic')
 * @returns {string} Masked value
 */
function maskSensitive(value, type = 'generic') {
  if (!value || typeof value !== 'string') {
    return '***';
  }
  
  switch (type) {
    case 'key':
      return maskPrivateKey(value);
    case 'mnemonic':
      return maskMnemonic(value);
    default:
      // Generic masking: show first 4 and last 4 characters
      if (value.length >= 12) {
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      }
      return '***';
  }
}

module.exports = {
  maskPrivateKey,
  maskMnemonic,
  maskSensitive
};

