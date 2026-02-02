import { useState, useRef, useEffect } from 'react';
import AIService from '../services/aiService';
import { useSocket } from '../hooks/useSocket';
import './CraftPredictor.css';

function CraftPredictor() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [recognitionStatus, setRecognitionStatus] = useState(null); // 'started', 'processing', 'completed'
  const abortControllerRef = useRef(null);
  const { socket } = useSocket();

  // Listen for real-time recognition events
  useEffect(() => {
    if (!socket) return;

    const handleRecognitionStarted = (data) => {
      console.log('[RECOGNITION] Started:', data);
      setRecognitionStatus('started');
      setLoading(true);
      setError(null);
    };

    const handleRecognitionCompleted = (data) => {
      console.log('[RECOGNITION] Completed:', data);
      setRecognitionStatus('completed');
      setLoading(false);
      
      // Update UI with live results from socket
      setPrediction({
        craftName: data.craftName,
        confidence: data.confidence,
        allPredictions: data.allPredictions || [],
      });
      
      setProcessingTime({
        server: data.processingTime,
        total: data.totalTime,
      });
    };

    socket.on('recognition_started', handleRecognitionStarted);
    socket.on('recognition_completed', handleRecognitionCompleted);

    return () => {
      socket.off('recognition_started', handleRecognitionStarted);
      socket.off('recognition_completed', handleRecognitionCompleted);
    };
  }, [socket]);

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
    setRecognitionStatus('processing');
    const startTime = performance.now();

    try {
      const result = await AIService.predictCraft(selectedImage);

      if (result.success) {
        const endTime = performance.now();
        const clientTime = ((endTime - startTime) / 1000).toFixed(2);
        
        // Only update if socket didn't already update
        if (recognitionStatus !== 'completed') {
          setPrediction(result.data);
          setProcessingTime({
            client: clientTime,
            server: result.data.processingTime,
            total: result.data.totalTime,
          });
        }
      } else {
        setError(result.error || 'Failed to predict craft type');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      if (recognitionStatus !== 'completed') {
        setLoading(false);
      }
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
    setRecognitionStatus(null);
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
        
        {/* Live Status Indicator */}
        {recognitionStatus === 'started' && (
          <div className="live-status">
            <span className="status-dot pulsing"></span>
            <span className="status-text">Recognition starting...</span>
          </div>
        )}
        {recognitionStatus === 'processing' && (
          <div className="live-status">
            <span className="status-dot pulsing"></span>
            <span className="status-text">Processing image...</span>
          </div>
        )}
        {recognitionStatus === 'completed' && (
          <div className="live-status completed">
            <span className="status-dot"></span>
            <span className="status-text">✓ Results updated live</span>
          </div>
        )}
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
              <div className="success-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Recognition Complete!</h3>
              <p className="result-subtitle">Here's what we found</p>
            </div>

            {/* Top Prediction */}
            <div className="top-prediction">
              <div className="prediction-header">
                <span className="prediction-badge">Top Match</span>
              </div>
              <div className="prediction-main">
                <h4 className="craft-name">{prediction.craftName}</h4>
                <div className="confidence-display">
                  <div className="confidence-circle" style={{ '--confidence': prediction.confidence }}>
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle"
                        strokeDasharray={`${prediction.confidence * 100}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ stroke: getConfidenceColor(prediction.confidence) }}
                      />
                      <text x="18" y="20.35" className="percentage">
                        {Math.round(prediction.confidence * 100)}%
                      </text>
                    </svg>
                  </div>
                  <div className="confidence-info">
                    <span className="confidence-label">Confidence Score</span>
                    <span className="confidence-value">
                      {formatConfidence(prediction.confidence)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* All Predictions */}
            <div className="all-predictions">
              <div className="section-header">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                <h4>Alternative Predictions</h4>
              </div>
              <div className="predictions-grid">
                {prediction.allPredictions.slice(0, 5).map((pred, index) => (
                  <div key={index} className="prediction-card">
                    <div className="card-header">
                      <span className="rank-badge" style={{
                        background: index === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                                   index === 1 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                                   'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                      }}>#{index + 1}</span>
                      <span className="confidence-badge-small" style={{
                        backgroundColor: getConfidenceColor(pred.confidence)
                      }}>
                        {formatConfidence(pred.confidence)}
                      </span>
                    </div>
                    <h5 className="craft-class">{pred.class}</h5>
                    <div className="confidence-bar-wrapper">
                      <div className="confidence-bar-bg">
                        <div
                          className="confidence-bar-fill"
                          style={{
                            width: `${pred.confidence * 100}%`,
                            backgroundColor: getConfidenceColor(pred.confidence),
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Section */}
            <div className="details-section">
              {/* Image Info */}
              {prediction.imageInfo && (
                <div className="details-card">
                  <div className="section-header">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <h4>Image Information</h4>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="info-icon"
                      >
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <div>
                        <span className="info-label">Filename</span>
                        <span className="info-value">{prediction.imageInfo.filename}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="info-icon"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                      <div>
                        <span className="info-label">Dimensions</span>
                        <span className="info-value">{prediction.imageInfo.dimensions}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="info-icon"
                      >
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                      <div>
                        <span className="info-label">Format</span>
                        <span className="info-value">{prediction.imageInfo.format}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="info-icon"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <div>
                        <span className="info-label">Model Version</span>
                        <span className="info-value">{prediction.modelVersion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Time */}
              {processingTime && (
                <div className="details-card">
                  <div className="section-header">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <h4>Performance</h4>
                  </div>
                  <div className="performance-metrics">
                    <div className="metric-card">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="metric-icon"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      <div>
                        <span className="metric-label">Server Processing</span>
                        <span className="metric-value">{processingTime.server}s</span>
                      </div>
                    </div>
                    <div className="metric-card">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="metric-icon"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <div>
                        <span className="metric-label">Total Time</span>
                        <span className="metric-value">{processingTime.total?.toFixed(2)}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
