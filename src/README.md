# Backend Folder Structure

## Directory Overview

```
src/
├── models/         # Database models and schemas
├── routes/         # API route definitions
├── controllers/    # Request handlers and business logic
├── middleware/     # Custom middleware functions
├── services/       # Business logic and external API integrations
├── config/         # Configuration files (database, app settings)
└── utils/          # Utility functions and helpers
```

## Description

- **models/**: Define your database schemas and models (MongoDB, PostgreSQL, etc.)
- **routes/**: Define API endpoints and map them to controllers
- **controllers/**: Handle incoming requests, call services, and return responses
- **middleware/**: Custom middleware for authentication, validation, error handling, etc.
- **services/**: Reusable business logic, third-party integrations
- **config/**: Database connections, environment configurations
- **utils/**: Helper functions, constants, formatters
