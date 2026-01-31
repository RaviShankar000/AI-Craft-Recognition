import { useState, useRef } from 'react';
import AIService from '../services/aiService';
import './CraftPredictor.css';

function CraftPredictor() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const abortControllerRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (16MB limit)
      const MAX_SIZE = 16 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError(`Image size must be less than ${MAX_SIZE / 1024 / 1024}MB`);
        return;
      }

      setSelectedImage(file);
      setError(null);
      setPrediction(null);
      setProcessingTime(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePredict = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const result = await AIService.predictCraft(selectedImage);

      if (result.success) {
        const endTime = performance.now();
        const clientTime = ((endTime - startTime) / 1000).toFixed(2);
        
        setPrediction(result.data);
        setProcessingTime({
          client: clientTime,
          server: result.data.processingTime,
          total: result.data.totalTime,
        });
      } else {
        setError(result.error || 'Failed to predict craft type');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
    setError(null);
    setProcessingTime(null);
    setLoading(false);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return '#4caf50';
    if (confidence >= 0.4) return '#ff9800';
    return '#f44336';
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(2)}%`;
  };

  return (
    <div className="craft-predictor">
      <div className="predictor-header">
        <h2>AI Craft Recognition</h2>
        <p>Upload an image to identify the craft type</p>
      </div>

      <div className="predictor-content">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-area">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Selected craft" />
                <button onClick={handleReset} className="btn-reset">
                  Choose Different Image
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="upload-input"
                />
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">Click to upload image</span>
                  <span className="upload-hint">
                    PNG, JPG, JPEG, GIF, WEBP (max 16MB)
                  </span>
                </div>
              </label>
            )}
          </div>

          {selectedImage && !prediction && (
            <button
              onClick={handlePredict}
              disabled={loading}
              className="btn-predict"
            >
              {loading ? 'Analyzing...' : 'Predict Craft Type'}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="prediction-results">
            <div className="result-header">
              <h3>Prediction Results</h3>
            </div>

            {/* Top Prediction */}
            <div className="top-prediction">
              <div className="prediction-label">Identified Craft:</div>
              <div className="prediction-value">
                <span className="craft-name">{prediction.craftName}</span>
                <span
                  className="confidence-badge"
                  style={{ backgroundColor: getConfidenceColor(prediction.confidence) }}
                >
                  {formatConfidence(prediction.confidence)}
                </span>
              </div>
            </div>

            {/* All Predictions */}
            <div className="all-predictions">
              <h4>All Predictions:</h4>
              <div className="predictions-list">
                {prediction.allPredictions.map((pred, index) => (
                  <div key={index} className="prediction-item">
                    <div className="prediction-info">
                      <span className="prediction-rank">#{index + 1}</span>
                      <span className="prediction-class">{pred.class}</span>
                    </div>
                    <div className="prediction-confidence">
                      <div className="confidence-bar-container">
                        <div
                          className="confidence-bar"
                          style={{
                            width: `${pred.confidence * 100}%`,
                            backgroundColor: getConfidenceColor(pred.confidence),
                          }}
                        ></div>
                      </div>
                      <span className="confidence-text">
                        {formatConfidence(pred.confidence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Info */}
            {prediction.imageInfo && (
              <div className="image-info">
                <h4>Image Details:</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Filename:</span>
                    <span className="info-value">{prediction.imageInfo.filename}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dimensions:</span>
                    <span className="info-value">{prediction.imageInfo.dimensions}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Format:</span>
                    <span className="info-value">{prediction.imageInfo.format}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Model Version:</span>
                    <span className="info-value">{prediction.modelVersion}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Time */}
            {processingTime && (
              <div className="processing-time">
                <h4>Performance Metrics:</h4>
                <div className="time-grid">
                  <div className="time-item">
                    <span className="time-label">Server Processing:</span>
                    <span className="time-value">{processingTime.server}s</span>
                  </div>
                  <div className="time-item">
                    <span className="time-label">Total Time:</span>
                    <span className="time-value">{processingTime.total?.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleReset} className="btn-analyze-another">
              Analyze Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CraftPredictor;
