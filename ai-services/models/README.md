# Models Directory

This directory contains ML model implementations and utilities.

## Files

- `craft_classifier.py` - Placeholder ML model for craft classification
- `model_loader.py` - Model loading and caching utilities

## Usage

```python
from models.model_loader import model_loader

# Load model at startup
model = model_loader.load_model()

# Use model for predictions
result = model.predict(image_data)
```

## Production Deployment

When deploying with actual ML models:

1. Replace `CraftClassifierModel` with real TensorFlow/PyTorch implementation
2. Add model files to `.gitignore` (already configured)
3. Use model versioning for better tracking
4. Implement model caching and optimization
5. Consider using model serving frameworks (TensorFlow Serving, TorchServe)
