# AI Services

This directory contains AI microservice code for craft recognition and analysis.

## Overview

Flask-based microservice that provides AI-powered craft recognition and classification.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Run the service:
```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service status

### Predict Craft Type
- **POST** `/predict`
- Content-Type: `multipart/form-data`
- Field: `image` (file)
- Returns: JSON with craft name, confidence score, and all predictions

**Response Format:**
```json
{
  "success": true,
  "craft_name": "pottery",
  "confidence": 0.8543,
  "all_predictions": [
    {"class": "pottery", "confidence": 0.8543},
    {"class": "sculpture", "confidence": 0.0892},
    ...
  ],
  "image_info": {
    "filename": "craft.jpg",
    "dimensions": "800x600",
    "format": "JPEG"
  },
  "model_version": "1.0.0-placeholder"
}
```

## Features

- Image upload validation (PNG, JPG, JPEG, GIF, WEBP)
- File size limit (16MB)
- CORS enabled for frontend integration
- Error handling with proper HTTP status codes
- Health check endpoint for monitoring

## Future Enhancements

- Integrate TensorFlow/PyTorch models for actual predictions
- Add model versioning
- Implement caching for faster predictions
- Add batch prediction endpoint
- Integrate with cloud storage for uploaded images
