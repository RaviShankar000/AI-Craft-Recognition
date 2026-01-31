from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from models.model_loader import model_loader
from utils.image_preprocessor import ImagePreprocessor

app = Flask(__name__)
CORS(app)

# Initialize image preprocessor
image_preprocessor = ImagePreprocessor(target_size=(224, 224))

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load ML model at startup
print("Initializing AI Craft Recognition Service...")
model = model_loader.load_model()
print("Service ready!")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_info = model.get_info()
    return jsonify({
        'status': 'healthy',
        'service': 'AI Craft Recognition Service',
        'model': model_info
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict craft type from uploaded image
    
    Expected request format:
    - Content-Type: multipart/form-data
    - Field: image (file)
    
    Returns:
    - JSON with craft name, confidence, and full predictions list
    """
    try:
        # Check if image file is present in request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Log incoming request for debugging
        print(f"Received prediction request for: {file.filename}")
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Only images are allowed.'
            }), 400
        
        # Validate image integrity
        try:
            image_preprocessor.validate_image(file)
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
        
        # Get image metadata before preprocessing
        image_info = image_preprocessor.get_image_info(file)
        
        # Preprocess image
        preprocessed_image = image_preprocessor.preprocess(file)
        
        # Perform ML prediction
        prediction = model.predict(preprocessed_image)
        
        print(f"Prediction completed: {prediction['top_prediction']['class']} ({prediction['top_prediction']['confidence']:.2f})")
        
        # Format response with craft name and confidence
        response = {
            'success': True,
            'craft_name': prediction['top_prediction']['class'],
            'confidence': prediction['top_prediction']['confidence'],
            'all_predictions': prediction['predictions'],
            'image_info': {
                'filename': file.filename,
                'dimensions': f"{image_info['width']}x{image_info['height']}",
                'format': image_info['format']
            },
            'model_version': prediction['model_version']
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'An error occurred during prediction',
            'message': str(e)
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'error': 'File too large. Maximum size is 16MB.'
    }), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting Flask AI Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
