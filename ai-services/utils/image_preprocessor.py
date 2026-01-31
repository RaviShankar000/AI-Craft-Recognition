"""
Image preprocessing utilities for ML model inference
"""

from PIL import Image
import io


class ImagePreprocessor:
    """Handles image preprocessing for model inference"""
    
    def __init__(self, target_size=(224, 224), max_dimension=1024):
        self.target_size = target_size
        self.max_dimension = max_dimension  # Maximum dimension before resizing
    
    def _optimize_image_size(self, image):
        """
        Reduce image dimensions if too large to speed up processing
        
        Args:
            image: PIL Image object
            
        Returns:
            PIL.Image: Optimized image
        """
        width, height = image.size
        max_dim = max(width, height)
        
        # Only resize if image is larger than max_dimension
        if max_dim > self.max_dimension:
            scale = self.max_dimension / max_dim
            new_width = int(width * scale)
            new_height = int(height * scale)
            return image.resize((new_width, new_height), Image.LANCZOS)
        
        return image
    
    def validate_image(self, file):
        """
        Validate that the uploaded file is a valid image
        
        Args:
            file: Uploaded file object (Flask FileStorage)
            
        Returns:
            bool: True if valid, raises exception otherwise
        """
        try:
            # Read file content into memory
            file_content = file.read()
            
            # Try to open image from bytes
            image = Image.open(io.BytesIO(file_content))
            image.verify()
            
            # Reset file pointer to beginning
            file.seek(0)
            return True
        except Exception as e:
            # Reset file pointer even on error
            try:
                file.seek(0)
            except:
                pass
            raise ValueError(f"Invalid image file: {str(e)}")
    
    def preprocess(self, file):
        """
        Preprocess image for model inference
        
        Args:
            file: Uploaded file object (Flask FileStorage)
            
        Returns:
            PIL.Image: Preprocessed image
        """
        # Read file content into memory
        file_content = file.read()
        
        # Open image from bytes
        image = Image.open(io.BytesIO(file_content))
        
        # Optimize image size for faster processing
        image = self._optimize_image_size(image)
        
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
            file: Uploaded file object (Flask FileStorage)
            
        Returns:
            dict: Image metadata
        """
        # Read file content
        file_content = file.read()
        
        # Open image from bytes
        image = Image.open(io.BytesIO(file_content))
        
        info = {
            'format': image.format,
            'mode': image.mode,
            'size': image.size,
            'width': image.width,
            'height': image.height
        }
        
        # Reset file pointer for potential reuse
        file.seek(0)
        
        return info
