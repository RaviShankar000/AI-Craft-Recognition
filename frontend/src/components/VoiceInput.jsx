import { useState, useRef } from 'react';
import SpeechService from '../services/speechService';
import { sanitizeTranscript, createSafeText } from '../utils/sanitizer';
import './VoiceInput.css';

function VoiceInput({ onTranscript, language = 'en-US' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported] = useState(() =>
    SpeechService.isBrowserSpeechSupported()
  );
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!browserSupported) {
      setError('Browser speech recognition not supported');
      return;
    }

    setError(null);
    setTranscript('');

    // Create recognition instance
    const recognition = SpeechService.createBrowserRecognition(language);
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const rawResult = event.results[0][0].transcript;
      console.log('Raw transcript:', rawResult);

      // Sanitize the transcript to prevent XSS
      const sanitizedResult = sanitizeTranscript(rawResult, {
        maxLength: 5000,
        removeScripts: true,
        normalizeWhitespace: true,
        removeUrls: false,
      });

      console.log('Sanitized transcript:', sanitizedResult);
      setTranscript(sanitizedResult);

      if (onTranscript) {
        onTranscript(sanitizedResult);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
