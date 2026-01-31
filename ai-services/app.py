from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Craft Recognition Service'
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict craft type from uploaded image
    
    Expected request format:
    - Content-Type: multipart/form-data
    - Field: image (file)
    
    Returns:
    - JSON with prediction results
    """
    try:
        # Check if image file is present in request
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected'
            }), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                'error': 'Invalid file type. Only images are allowed.'
            }), 400
        
        # TODO: Implement actual AI prediction logic here
        # For now, return a mock response
        
        prediction_result = {
            'success': True,
            'predictions': [
                {
                    'class': 'pottery',
                    'confidence': 0.85
                },
                {
                    'class': 'sculpture',
                    'confidence': 0.12
                },
                {
                    'class': 'textile',
                    'confidence': 0.03
                }
            ],
            'top_prediction': {
                'class': 'pottery',
                'confidence': 0.85
            },
            'metadata': {
                'filename': file.filename,
                'model_version': '1.0.0'
            }
        }
        
        return jsonify(prediction_result), 200
        
    except Exception as e:
        return jsonify({
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
