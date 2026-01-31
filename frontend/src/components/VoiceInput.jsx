import { useState, useRef } from 'react';
import SpeechService from '../services/speechService';
import { createSafeText } from '../utils/sanitizer';
import './VoiceInput.css';

function VoiceInput({ onTranscript, language = 'en-US' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported] = useState(() => SpeechService.isBrowserSpeechSupported());
  const recognitionRef = useRef(null);

  const startListening = () => {
    setError(null);
    setTranscript('');

    // Start voice recognition using service layer
    const result = SpeechService.startVoiceRecognition({
      language,
      onStart: () => {
        setIsListening(true);
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
      },
      onEnd: () => {
        setIsListening(false);
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
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return (
    <div className="voice-input">
      <div className="voice-controls">
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={!browserSupported}
            className="btn-voice-start"
            title="Start voice input"
          >
            <span className="mic-icon">🎤</span>
            <span>Start Speaking</span>
          </button>
        ) : (
          <button onClick={stopListening} className="btn-voice-stop">
            <span className="mic-icon recording">🎤</span>
            <span>Stop Recording</span>
          </button>
        )}

        {transcript && (
          <button onClick={clearTranscript} className="btn-voice-clear">
            Clear
          </button>
        )}
      </div>

      {isListening && (
        <div className="listening-indicator">
          <span className="pulse"></span>
          <span className="listening-text">Listening...</span>
        </div>
      )}

      {transcript && (
        <div className="transcript-display">
          <div className="transcript-label">Transcript:</div>
          <div className="transcript-text">{createSafeText(transcript)}</div>
        </div>
      )}

      {error && (
        <div className="voice-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!browserSupported && (
        <div className="voice-warning">
          <span className="warning-icon">ℹ️</span>
          <span>
            Browser speech recognition not available. Use Chrome, Edge, or Safari.
          </span>
        </div>
      )}
    </div>
  );
}

export default VoiceInput;
