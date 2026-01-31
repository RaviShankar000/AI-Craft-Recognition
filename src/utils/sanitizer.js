/**
 * Input Sanitization Utility
 * Sanitizes text input to prevent XSS and other injection attacks
 */

/**
 * Sanitize text by removing/escaping potentially dangerous characters
 * @param {String} text - Raw text input
 * @returns {String} Sanitized text
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize and normalize speech transcript
 * @param {String} transcript - Raw transcript from speech recognition
 * @param {Object} options - Sanitization options
 * @returns {String} Sanitized transcript
 */
function sanitizeTranscript(transcript, options = {}) {
  const {
    maxLength = 5000,
    removeUrls = true,
    removeScripts = true,
    normalizeWhitespace = true,
  } = options;

  if (!transcript || typeof transcript !== 'string') {
    return '';
  }

  let sanitized = transcript;

  // Remove potential script injections
  if (removeScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Remove URLs if specified
  if (removeUrls) {
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '[URL removed]');
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
  }

  // Apply basic HTML sanitization
  sanitized = sanitizeText(sanitized);

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate audio file before processing
 * @param {Object} file - File object or buffer
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateAudioFile(file, options = {}) {
  const {
    maxSize = 25 * 1024 * 1024, // 25MB default
    allowedMimeTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
    ],
  } = options;

  const result = {
    valid: true,
    errors: [],
  };

  // Check if file exists
  if (!file) {
    result.valid = false;
    result.errors.push('No audio file provided');
    return result;
  }

  // Check file size
  const fileSize = file.size || file.length || (file.buffer && file.buffer.length);
  if (fileSize && fileSize > maxSize) {
    result.valid = false;
    result.errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  // Check MIME type if available
  if (file.mimetype) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      result.valid = false;
      result.errors.push(`Invalid audio format: ${file.mimetype}`);
    }
  }

  return result;
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {String} filename - Original filename
 * @returns {String} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'audio.wav';
  }

  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove special characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250) + '.' + ext;
  }

  return sanitized || 'audio.wav';
}

module.exports = {
  sanitizeText,
  sanitizeTranscript,
  validateAudioFile,
  sanitizeFilename,
};
