# AI Service Setup Guide

This guide provides detailed instructions for setting up and running the Flask-based AI microservice locally.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment (recommended)

## Quick Start

### 1. Navigate to AI Service Directory

```bash
cd ai-services
```

### 2. Create Virtual Environment (Recommended)

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables (Optional)

```bash
cp .env.example .env
```

Edit `.env` file to configure:

- `FLASK_ENV=development` - Enable debug mode
- `PORT=5001` - Service port (default: 5001)
- `MAX_CONTENT_LENGTH=16777216` - Max upload size in bytes (default: 16MB)

### 5. Run the Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

You should see:

```
Loading placeholder ML model...
Model loaded successfully (version: 1.0.0-placeholder)
Initializing AI Craft Recognition Service...
Service ready!
 * Running on http://0.0.0.0:5001
```

## Testing the Service

### Health Check

```bash
curl http://localhost:5001/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "AI Craft Recognition Service",
  "model": {
    "version": "1.0.0-placeholder",
    "classes": ["pottery", "sculpture", "textile", ...],
    "num_classes": 8,
    "is_loaded": true,
    "type": "placeholder"
  }
}
```

### Test Prediction

```bash
curl -X POST http://localhost:5001/predict \
  -F "image=@/path/to/your/image.jpg"
```

Expected response:

```json
{
  "success": true,
  "craft_name": "pottery",
  "confidence": 0.8543,
  "all_predictions": [...],
  "image_info": {...},
  "model_version": "1.0.0-placeholder",
  "processing_time": 0.234
}
```

## API Endpoints

### GET /health

Health check endpoint for monitoring service status.

**Response:**

- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service has issues

### POST /predict

Predict craft type from uploaded image.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `image` (file)
- Supported formats: PNG, JPG, JPEG, GIF, WEBP
- Max size: 16MB

**Response:**

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
  "model_version": "1.0.0-placeholder",
  "processing_time": 0.234
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Project Structure

```
ai-services/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── README.md             # Service documentation
├── models/               # ML models and utilities
│   ├── __init__.py
│   ├── craft_classifier.py    # Placeholder model
│   ├── model_loader.py        # Model loading utility
│   └── README.md
└── utils/                # Helper utilities
    ├── __init__.py
    └── image_preprocessor.py  # Image preprocessing
```

## Configuration

### Environment Variables

| Variable             | Default                      | Description                                |
| -------------------- | ---------------------------- | ------------------------------------------ |
| `FLASK_ENV`          | `production`                 | Flask environment (development/production) |
| `PORT`               | `5001`                       | Port number for the service                |
| `MAX_CONTENT_LENGTH` | `16777216`                   | Maximum upload size in bytes (16MB)        |
| `MODEL_PATH`         | `models/craft_classifier.h5` | Path to ML model file                      |

### Flask Configuration

Edit `app.py` to modify Flask settings:

```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['UPLOAD_FOLDER'] = 'uploads'
```

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development  # macOS/Linux
set FLASK_ENV=development     # Windows

python app.py
```

Development mode enables:

- Auto-reload on code changes
- Detailed error messages
- Debug logging

### Adding Dependencies

```bash
pip install package-name
pip freeze > requirements.txt
```

### Logging

The service logs to console by default. Key log outputs:

- Service initialization
- Model loading status
- Incoming prediction requests
- Processing time for each step
- Errors and stack traces

## Troubleshooting

### Port Already in Use

If port 5001 is occupied:

```bash
# Check what's using the port (macOS/Linux)
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5002 python app.py
```

### Module Import Errors

Ensure virtual environment is activated and dependencies are installed:

```bash
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Image Processing Errors

Common issues:

- **"Invalid image file"** - Corrupted or unsupported format
- **"File too large"** - Exceeds 16MB limit
- **PIL errors** - Install/reinstall Pillow: `pip install --upgrade Pillow`

### Connection Refused from Backend

Ensure:

1. AI service is running on correct port
2. Backend `AI_SERVICE_URL` environment variable is correct
3. CORS is properly configured
4. Firewall/network allows the connection

## Integration with Backend

The Node.js backend connects to this service via:

```javascript
// Backend configuration (.env)
AI_SERVICE_URL=http://localhost:5001

// API call
POST http://localhost:5001/predict
```

Ensure both services are running:

- AI Service: `http://localhost:5001`
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5001
CMD ["python", "app.py"]
```

Build and run:

```bash
docker build -t ai-craft-service .
docker run -p 5001:5001 ai-craft-service
```

### Environment Variables for Production

```bash
FLASK_ENV=production
PORT=5001
MODEL_PATH=/path/to/production/model.h5
```

## Replacing the Placeholder Model

To integrate a real ML model:

1. **Update `models/craft_classifier.py`:**
   - Replace `CraftClassifierModel` with real model loading
   - Use TensorFlow, PyTorch, or other ML framework
   - Implement actual prediction logic

2. **Install ML dependencies:**

   ```bash
   pip install tensorflow  # or pytorch
   pip freeze > requirements.txt
   ```

3. **Update prediction logic:**

   ```python
   def predict(self, image_data):
       # Preprocess image to numpy array
       img_array = preprocess_for_model(image_data)

       # Run inference
       predictions = self.model.predict(img_array)

       # Return formatted results
       return format_predictions(predictions)
   ```

## Performance Optimization

Current optimizations:

- Image size limiting (max 1024px dimension)
- Connection pooling (backend)
- Response compression
- Memory-efficient image processing

For better performance:

- Use GPU for inference
- Implement model caching
- Add request queuing
- Use async/await for concurrent requests
- Deploy on cloud services (AWS Lambda, Google Cloud Run)

## Support

For issues or questions:

1. Check this documentation
2. Review error logs
3. Verify all dependencies are installed
4. Ensure correct Python version (3.8+)
5. Test with health check endpoint first

## Next Steps

- [ ] Replace placeholder model with actual trained model
- [ ] Add model versioning
- [ ] Implement batch prediction
- [ ] Add authentication
- [ ] Set up monitoring and logging
- [ ] Deploy to production environment
