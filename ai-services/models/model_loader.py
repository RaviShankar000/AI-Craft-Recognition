"""
Model Loader Module

Handles loading and initialization of ML models
"""

from models.craft_classifier import CraftClassifierModel


class ModelLoader:
    """Manages ML model loading and caching"""
    
    def __init__(self):
        self._model = None
    
    def load_model(self):
        """Load the craft classifier model"""
        if self._model is None:
            self._model = CraftClassifierModel()
            self._model.load()
        return self._model
    
    def get_model(self):
        """Get the loaded model instance"""
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        return self._model
    
    def reload_model(self):
        """Reload the model (useful for model updates)"""
        self._model = None
        return self.load_model()


# Global model loader instance
model_loader = ModelLoader()
