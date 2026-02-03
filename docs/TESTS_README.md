# Test Suite

This directory contains the comprehensive test suite for the AI Craft Recognition platform.

## Structure

```
src/
├── __tests__/
│   └── integration/          # Integration tests
│       ├── craft.test.js     # Craft API tests
│       └── marketplace.test.js # Marketplace API tests
├── controllers/
│   └── __tests__/            # Controller unit tests
│       └── authController.test.js
└── middleware/
    └── __tests__/            # Middleware unit tests
        └── auth.test.js      # Auth & RBAC tests

frontend/src/
└── __tests__/                # Frontend smoke tests
    ├── App.smoke.test.jsx
    ├── Dashboard.smoke.test.jsx
    └── Marketplace.smoke.test.jsx
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual functions in isolation
- **Location**: `src/*/__tests__/*.test.js`
- **Coverage**: Authentication, authorization, business logic
- **Speed**: Fast (< 1s per test)

### 2. Integration Tests
- **Purpose**: Test complete API workflows
- **Location**: `src/__tests__/integration/*.test.js`
- **Coverage**: End-to-end API operations
- **Speed**: Medium (1-5s per test)

### 3. Smoke Tests
- **Purpose**: Verify critical paths work
- **Location**: `frontend/src/__tests__/*.smoke.test.jsx`
- **Coverage**: Essential user journeys
- **Speed**: Fast (< 2s per test)

## Running Tests

### Quick Start

```bash
# Backend unit tests
npm test

# Backend with coverage
npm run test:coverage

# Frontend smoke tests
cd frontend && npm test

# All tests with coverage report
./scripts/test-coverage.sh
```

### Detailed Commands

#### Backend

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

#### Frontend

```bash
cd frontend

# Run once
npm test

# Interactive UI
npm run test:ui

# Coverage
npm run test:coverage
```

## Test Configuration

### Backend (Jest)
- **Config**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: Node
- **Coverage**: 70% threshold

### Frontend (Vitest)
- **Config**: `frontend/vitest.config.js`
- **Setup**: `frontend/src/test/setup.js`
- **Environment**: jsdom
- **Coverage**: Tracked, not enforced

## Writing Tests

### Backend Example

```javascript
const { protect } = require('../auth');

describe('protect middleware', () => {
  it('should authenticate valid token', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();
    
    await protect(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });
});
```

### Frontend Example

```jsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render text', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

## Mocking

### API Calls

```javascript
// Backend
jest.mock('../../services/aiService');

// Frontend
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [] }),
  })
);
```

### Database

```javascript
// Use test database
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Or mock Mongoose models
jest.mock('../../models/User');
```

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Coverage reports uploaded to Codecov

See `.github/workflows/test-coverage.yml` for configuration.

## Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Backend API | 70% | Check coverage report |
| Frontend | 65% | Check coverage report |
| Critical Paths | 90% | Manual review |

## Troubleshooting

### Tests fail locally but pass in CI
- Check Node version (use 18.x or 20.x)
- Ensure `npm ci` was run
- Clear `node_modules` and reinstall

### Coverage not generated
- Run `npm run test:coverage` not `npm test`
- Check write permissions in project directory

### Frontend tests timeout
- Increase timeout in test file: `{ timeout: 10000 }`
- Check for unmocked async operations

## Best Practices

1. ✅ Test behavior, not implementation
2. ✅ Use descriptive test names
3. ✅ Keep tests independent
4. ✅ Mock external dependencies
5. ✅ Test error cases
6. ✅ Avoid testing third-party libraries
7. ✅ Use setup/teardown for common code

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest API Testing](https://github.com/visionmedia/supertest)
