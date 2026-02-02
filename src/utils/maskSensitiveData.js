/**
 * Sensitive Fields Masking Utility
 * Masks passwords, tokens, and other sensitive data in logs and responses
 */

const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'secretKey',
  'privateKey',
  'authToken',
  'sessionToken',
  'jwt',
  'bearerToken',
  'otp',
  'pin',
  'ssn',
  'creditCard',
  'cvv',
  'cardNumber',
];

/**
 * Mask a single value
 */
const maskValue = (value) => {
  if (!value) return value;
  
  const strValue = String(value);
  if (strValue.length <= 4) {
    return '***';
  }
  
  // Show first 2 and last 2 characters
  return `${strValue.slice(0, 2)}${'*'.repeat(strValue.length - 4)}${strValue.slice(-2)}`;
};

/**
 * Recursively mask sensitive fields in an object
 */
const maskSensitiveData = (obj, depth = 0, maxDepth = 10) => {
  if (depth > maxDepth) return obj;
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1, maxDepth));
  }
  
  // Handle objects
  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field should be masked
    const shouldMask = SENSITIVE_FIELDS.some((field) => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (shouldMask) {
      masked[key] = maskValue(value);
    } else if (value && typeof value === 'object') {
      masked[key] = maskSensitiveData(value, depth + 1, maxDepth);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
};

/**
 * Remove sensitive fields completely
 */
const removeSensitiveFields = (obj, depth = 0, maxDepth = 10) => {
  if (depth > maxDepth) return obj;
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => removeSensitiveFields(item, depth + 1, maxDepth));
  }
  
  // Handle objects
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field should be removed
    const shouldRemove = SENSITIVE_FIELDS.some((field) => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (!shouldRemove) {
      if (value && typeof value === 'object') {
        cleaned[key] = removeSensitiveFields(value, depth + 1, maxDepth);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

/**
 * Mask sensitive data in request body
 */
const maskRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  return maskSensitiveData(body);
};

/**
 * Mask sensitive data in response
 */
const maskResponse = (data) => {
  if (!data || typeof data !== 'object') return data;
  return maskSensitiveData(data);
};

/**
 * Express middleware to mask sensitive fields in responses
 */
const maskResponseMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function (data) {
    // Don't mask if explicitly disabled
    if (res.locals.skipMasking) {
      return originalJson.call(this, data);
    }
    
    // Mask sensitive data
    const maskedData = maskResponse(data);
    return originalJson.call(this, maskedData);
  };
  
  next();
};

/**
 * Mask sensitive fields in error messages
 */
const maskErrorMessage = (message) => {
  if (!message) return message;
  
  let masked = message;
  
  // Mask common patterns
  // JWT tokens
  masked = masked.replace(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g, '[TOKEN]');
  
  // API keys (format: alphanumeric, 20+ chars)
  masked = masked.replace(/\b[A-Za-z0-9]{20,}\b/g, '[API_KEY]');
  
  // Email in certain contexts
  masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, 
    (match, user, domain) => `${user.slice(0, 2)}***@${domain}`
  );
  
  return masked;
};

/**
 * Add custom sensitive fields
 */
const addSensitiveField = (field) => {
  if (!SENSITIVE_FIELDS.includes(field)) {
    SENSITIVE_FIELDS.push(field);
  }
};

module.exports = {
  maskSensitiveData,
  removeSensitiveFields,
  maskRequestBody,
  maskResponse,
  maskResponseMiddleware,
  maskErrorMessage,
  maskValue,
  addSensitiveField,
  SENSITIVE_FIELDS,
};
