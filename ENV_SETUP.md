# Environment Variables Setup

## Overview
This project uses environment variables to manage configuration securely. All sensitive information should be stored in the `.env` file which is not tracked by git.

## Setup Instructions

1. Copy the `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your actual configuration:
   - Add your database connection string
   - Add API keys for external services
   - Configure CORS origins
   - Set JWT secrets (if using authentication)

## Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time

## Security Notes
- Never commit the `.env` file to version control
- Use strong, random strings for secrets
- Rotate API keys and secrets regularly
- Use different values for development and production
