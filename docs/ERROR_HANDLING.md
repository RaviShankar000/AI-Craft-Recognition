# Controller Error Handling Refactoring Guide

All controllers have been refactored to use async/await with try-catch blocks that forward errors to the global error handler using `next()`.

## Pattern

### Before:
```javascript
const myController = async (req, res) => {
  try {
    // logic
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### After:
```javascript
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');

const myController = catchAsync(async (req, res, next) => {
  const item = await Model.findById(req.params.id);
  
  if (!item) {
    return next(new NotFoundError('Item not found'));
  }
  
  res.json({ success: true, data: item });
});
```

## Using catchAsync Wrapper

The `catchAsync` wrapper automatically catches async errors and forwards them to the error handler:

```javascript
const { catchAsync } = require('../middleware/errorHandler');

exports.getAll = catchAsync(async (req, res, next) => {
  const items = await Model.find();
  res.json({ success: true, data: items });
});
```

## Custom Error Classes

Use custom error classes for specific error types:

```javascript
const {
  ValidationError,      // 400 - Bad Request
  AuthenticationError,  // 401 - Unauthorized
  AuthorizationError,   // 403 - Forbidden
  NotFoundError,        // 404 - Not Found
  ConflictError,        // 409 - Conflict
  AppError,            // Custom status code
} = require('../utils/errors');

// Example usage
if (!user) {
  return next(new NotFoundError('User not found'));
}

if (user.email !== req.body.email) {
  return next(new ValidationError('Email mismatch'));
}

if (req.user.role !== 'admin') {
  return next(new AuthorizationError());
}
```

## Benefits

1. **Consistent error responses** across all endpoints
2. **Automatic error logging** with stack traces in development
3. **No error detail leakage** in production
4. **Proper HTTP status codes**
5. **Cleaner controller code**

## Implementation Status

✅ All controllers refactored to use `catchAsync` wrapper  
✅ Custom error classes implemented  
✅ Consistent error forwarding with `next()`  
✅ Mongoose error handling centralized  
✅ JWT error handling centralized
