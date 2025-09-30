/**
 * URL Helper Utility
 * 
 * This utility helps convert storage identifiers (Cloudinary or Supabase)
 * into accessible URLs for the client.
 * 
 * For Supabase (private bucket): Generates signed URLs
 * For Cloudinary (public): Returns the URL as-is
 */

const { generateSignedUrl } = require('./gcsStorage');

/**
 * Convert storage identifier to accessible URL
 * @param {string} identifier - Storage identifier (URL or supabase:// path)
 * @param {number} expiresIn - Expiry time in seconds (default: 3600)
 * @returns {Promise<string>} - Accessible URL
 */
async function getAccessibleUrl(identifier, expiresIn = 3600) {
  if (!identifier) return '';
  
  // If it's already a full HTTP URL (Cloudinary), return as-is
  if (/^https?:\/\//i.test(identifier)) {
    return identifier;
  }
  
  // For Supabase paths, generate signed URL
  return await generateSignedUrl(identifier, expiresIn);
}

/**
 * Process an object and convert all storage identifiers to accessible URLs
 * @param {object} obj - Object containing storage identifiers
 * @param {string[]} fields - Array of field names to convert
 * @param {number} expiresIn - Expiry time in seconds
 * @returns {Promise<object>} - Object with converted URLs
 */
async function processUrlFields(obj, fields = [], expiresIn = 3600) {
  if (!obj) return obj;
  
  const processed = { ...obj };
  
  for (const field of fields) {
    const value = getNestedValue(processed, field);
    if (value && typeof value === 'string') {
      const accessibleUrl = await getAccessibleUrl(value, expiresIn);
      setNestedValue(processed, field, accessibleUrl);
    }
  }
  
  return processed;
}

/**
 * Process an array of objects and convert storage identifiers
 * @param {Array} items - Array of objects
 * @param {string[]} fields - Field names to convert
 * @param {number} expiresIn - Expiry time in seconds
 * @returns {Promise<Array>} - Array with converted URLs
 */
async function processUrlFieldsArray(items, fields = [], expiresIn = 3600) {
  if (!Array.isArray(items)) return items;
  
  return await Promise.all(
    items.map(item => processUrlFields(item, fields, expiresIn))
  );
}

// Helper: Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper: Set nested value in object using dot notation
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Middleware to automatically convert storage URLs in response
 * Usage: router.get('/destinations', convertStorageUrls(['image']), controller)
 */
function convertStorageUrls(fields = [], expiresIn = 3600) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      if (!data) return originalJson(data);
      
      try {
        // Handle { data: [...] } or { data: {...} } response format
        if (data.data) {
          if (Array.isArray(data.data)) {
            data.data = await processUrlFieldsArray(data.data, fields, expiresIn);
          } else if (typeof data.data === 'object') {
            data.data = await processUrlFields(data.data, fields, expiresIn);
          }
        } else if (Array.isArray(data)) {
          data = await processUrlFieldsArray(data, fields, expiresIn);
        } else if (typeof data === 'object') {
          data = await processUrlFields(data, fields, expiresIn);
        }
        
        return originalJson(data);
      } catch (err) {
        console.error('Error converting storage URLs:', err);
        return originalJson(data); // Return original data on error
      }
    };
    
    next();
  };
}

module.exports = {
  getAccessibleUrl,
  processUrlFields,
  processUrlFieldsArray,
  convertStorageUrls
};
