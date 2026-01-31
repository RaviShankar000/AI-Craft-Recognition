"""
Image preprocessing utilities for ML model inference
"""

from PIL import Image
import io


class ImagePreprocessor:
    """Handles image preprocessing for model inference"""
    
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size
    
    def validate_image(self, file):
        """
        Validate that the uploaded file is a valid image
        
        Args:
            file: Uploaded file object
            
        Returns:
            bool: True if valid, raises exception otherwise
        """
        try:
            image = Image.open(file.stream)
            image.verify()
            # Reset file pointer after verification
            file.stream.seek(0)
            return True
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
    
    def preprocess(self, file):
        """
        Preprocess image for model inference
        
        Args:
            file: Uploaded file object
            
        Returns:
            PIL.Image: Preprocessed image
        """
        # Open image
        image = Image.open(file.stream)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to target size
        image = image.resize(self.target_size, Image.LANCZOS)
        
        # In production, you would also:
        # - Normalize pixel values
        # - Convert to numpy array
        # - Apply model-specific preprocessing
        # Example:
        # img_array = np.array(image) / 255.0
        # img_array = np.expand_dims(img_array, axis=0)
        
        return image
    
    def get_image_info(self, file):
        """
        Extract metadata from image
        
        Args:
            file: Uploaded file object
            
        Returns:
            dict: Image metadata
        """
        image = Image.open(file.stream)
        
        info = {
            'format': image.format,
            'mode': image.mode,
            'size': image.size,
            'width': image.width,
            'height': image.height
        }
        
        # Reset file pointer
        file.stream.seek(0)
        
        return info
