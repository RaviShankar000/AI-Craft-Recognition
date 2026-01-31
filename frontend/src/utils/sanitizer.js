/**
 * Frontend Input Sanitization Utility
 * Sanitizes text input to prevent XSS attacks in React components
 */

/**
 * Sanitize text by removing/escaping potentially dangerous characters
 * @param {String} text - Raw text input
 * @returns {String} Sanitized text
 */
export function sanitizeText(text) {
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
export function sanitizeTranscript(transcript, options = {}) {
  const {
    maxLength = 5000,
    removeUrls = false,
    removeScripts = true,
    normalizeWhitespace = true,
  } = options;

  if (!transcript || typeof transcript !== 'string') {
    return '';
  }

  let sanitized = transcript;

  // Remove potential script injections
  if (removeScripts) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Remove URLs if specified
  if (removeUrls) {
    sanitized = sanitized.replace(
      /https?:\/\/[^\s]+/gi,
      '[URL removed]'
    );
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
  }

  // Apply basic HTML sanitization
  sanitized = sanitizeText(sanitized);

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

/**
 * Create safe text content for display (returns plain text, React will handle escaping)
 * @param {String} text - Text to display
 * @returns {String} Safe text for React display
 */
export function createSafeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let safe = text.replace(/\0/g, '');
  // eslint-disable-next-line no-control-regex
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  safe = safe.replace(/\s+/g, ' ').trim();

  return safe;
}

export default {
  sanitizeText,
  sanitizeTranscript,
  createSafeText,
};
