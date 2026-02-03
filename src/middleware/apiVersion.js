/**
 * API Version Middleware
 * Adds version information to all API responses
 */

const API_VERSION = 'v1';
const API_VERSION_NUMBER = '1.0.0';

/**
 * Add version headers to all responses
 */
const addVersionHeaders = (req, res, next) => {
  // Add version to response headers
  res.set('X-API-Version', API_VERSION);
  res.set('X-API-Version-Number', API_VERSION_NUMBER);

  // Add to response locals for access in routes
  res.locals.apiVersion = API_VERSION;
  res.locals.apiVersionNumber = API_VERSION_NUMBER;

  next();
};

/**
 * Version deprecation middleware (for future use)
 */
const checkDeprecation = (deprecatedVersion, sunsetDate) => {
  return (req, res, next) => {
    if (req.path.startsWith(`/api/${deprecatedVersion}`)) {
      res.set('X-API-Deprecated', 'true');
      res.set('X-API-Sunset-Date', sunsetDate);
      res.set(
        'Warning',
        `299 - "This API version is deprecated and will be sunset on ${sunsetDate}"`
      );
    }
    next();
  };
};

/**
 * Extract version from request path
 */
const getVersionFromPath = path => {
  const match = path.match(/^\/api\/(v\d+)\//);
  return match ? match[1] : null;
};

/**
 * Version validation middleware
 */
const validateVersion = (req, res, next) => {
  const version = getVersionFromPath(req.path);

  if (version && version !== API_VERSION) {
    // Check if it's a sunset version
    return res.status(410).json({
      success: false,
      error: 'API version no longer supported',
      message: `API version ${version} has been sunset. Please use ${API_VERSION}.`,
      currentVersion: API_VERSION,
      migrationGuide: '/docs/API_VERSIONING.md',
    });
  }

  next();
};

module.exports = {
  addVersionHeaders,
  checkDeprecation,
  validateVersion,
  getVersionFromPath,
  API_VERSION,
  API_VERSION_NUMBER,
};
