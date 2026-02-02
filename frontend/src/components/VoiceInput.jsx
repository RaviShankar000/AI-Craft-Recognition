import { useState, useRef, useEffect } from 'react';
import SpeechService from '../services/speechService';
import { createSafeText } from '../utils/sanitizer';
import { useSocket } from '../hooks/useSocket';
import './VoiceInput.css';

function VoiceInput({ onTranscript, language = 'en-US', onStateChange }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported] = useState(() => SpeechService.isBrowserSpeechSupported());
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState(null); // 'started', 'processing', 'completed', 'failed'
  const recognitionRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const { socket } = useSocket();

  // Listen for voice recording socket events
  useEffect(() => {
    if (!socket) return;

    const handleRecordingStarted = (data) => {
      console.log('[VOICE] Recording started:', data);
      setRecordingStatus('started');
    };

    const handleRecordingCompleted = (data) => {
      console.log('[VOICE] Recording completed:', data);
      setRecordingStatus('completed');
      
      // Update transcript with results from backend
      if (data.text) {
        const sanitizedText = createSafeText(data.text);
        setTranscript(sanitizedText);
        if (onTranscript) {
          onTranscript(sanitizedText);
        }
      }
    };

    const handleRecordingFailed = (data) => {
      console.error('[VOICE] Recording failed:', data);
      setRecordingStatus('failed');
      setError(data.message || data.error || 'Voice recording failed');
    };

    socket.on('voice_recording_started', handleRecordingStarted);
    socket.on('voice_recording_completed', handleRecordingCompleted);
    socket.on('voice_recording_failed', handleRecordingFailed);

    return () => {
      socket.off('voice_recording_started', handleRecordingStarted);
      socket.off('voice_recording_completed', handleRecordingCompleted);
      socket.off('voice_recording_failed', handleRecordingFailed);
    };
  }, [socket, onTranscript]);

  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);

  const simulateAudioLevel = () => {
    // Simulate audio level animation while listening
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    
    audioLevelIntervalRef.current = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);
  };

  const startListening = () => {
    setError(null);
    setTranscript('');

    // Start voice recognition using service layer
    const result = SpeechService.startVoiceRecognition({
      language,
      onStart: () => {
        setIsListening(true);
        simulateAudioLevel();
        if (onStateChange) {
          onStateChange(true); // Notify parent that listening started
        }
      },
      onResult: (sanitizedTranscript) => {
        setTranscript(sanitizedTranscript);
        if (onTranscript) {
          onTranscript(sanitizedTranscript);
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsListening(false);
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
        setAudioLevel(0);
        if (onStateChange) {
          onStateChange(false); // Notify parent that listening stopped
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
        setAudioLevel(0);
        if (onStateChange) {
          onStateChange(false); // Notify parent that listening stopped
        }
      },
    });

    if (result.success) {
      recognitionRef.current = result.recognition;
    } else {
      setError(result.error);
    }
  };

  const stopListening = () => {
    SpeechService.stopVoiceRecognition(recognitionRef.current);
    recognitionRef.current = null;
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    setAudioLevel(0);
    if (onStateChange) {
      onStateChange(false); // Notify parent that listening stopped
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return (
    <div className="voice-input">
      <div className="voice-input-container">
        {/* Main Recording Button */}
        <div className="recording-section">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!browserSupported}
            className={`recording-button ${isListening ? 'recording' : ''}`}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
          >
            <div className="button-content">
              {/* Animated Circle Waves */}
              {isListening && (
                <>
                  <div className="sound-wave wave-1"></div>
                  <div className="sound-wave wave-2"></div>
                  <div className="sound-wave wave-3"></div>
                </>
              )}
              
              {/* Microphone Icon */}
              <div className="mic-icon-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mic-icon"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
            </div>
          </button>

          {/* Status Text */}
          <div className="recording-status">
            {isListening ? (
              <div className="status-listening">
                <span className="pulse-dot"></span>
                <span className="status-text">Listening...</span>
              </div>
            ) : (
              <span className="status-text">
                {browserSupported ? 'Tap to speak' : 'Voice not supported'}
              </span>
            )}
          </div>

          {/* Live Recording Status */}
          {recordingStatus && (
            <div className={`voice-status ${recordingStatus}`}>
              {recordingStatus === 'started' && (
                <>
                  <span className="status-dot pulsing"></span>
                  <span className="status-text">Processing audio...</span>
                </>
              )}
              {recordingStatus === 'completed' && (
                <>
                  <span className="status-dot"></span>
                  <span className="status-text">✓ Transcription complete</span>
                </>
              )}
              {recordingStatus === 'failed' && (
                <>
                  <span className="status-dot"></span>
                  <span className="status-text">✗ Transcription failed</span>
                </>
              )}
            </div>
          )}

          {/* Audio Level Indicator */}
          {isListening && (
            <div className="audio-visualizer">
              <div className="visualizer-bars">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="visualizer-bar"
                    style={{
                      height: `${20 + Math.sin((audioLevel / 100) * Math.PI + i * 0.5) * 30}px`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="transcript-section">
            <div className="transcript-header">
              <div className="transcript-label">
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
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Transcript</span>
              </div>
              <button onClick={clearTranscript} className="btn-clear-transcript" aria-label="Clear transcript">
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
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="transcript-text">{createSafeText(transcript)}</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="voice-error-card">
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
              className="error-icon"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Browser Not Supported Message */}
        {!browserSupported && (
          <div className="voice-warning-card">
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
              className="warning-icon"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Voice recognition not available</strong>
              <p>Please use Chrome, Edge, or Safari for voice search functionality.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceInput;
