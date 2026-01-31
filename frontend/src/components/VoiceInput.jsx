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

  // Common supported languages for Web Speech API
  const supportedLanguages = [
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
    'es-ES', 'es-MX', 'es-AR', 'es-CO',
    'fr-FR', 'fr-CA',
    'de-DE',
    'it-IT',
    'pt-BR', 'pt-PT',
    'ru-RU',
    'ja-JP',
    'zh-CN', 'zh-TW',
    'ko-KR',
    'ar-SA',
    'hi-IN',
    'nl-NL',
    'pl-PL',
    'tr-TR',
  ];

  const validateLanguage = (lang) => {
    if (!lang) return true;
    return supportedLanguages.includes(lang);
  };

  const startListening = () => {
    if (!browserSupported) {
      setError('Browser speech recognition not supported');
      return;
    }

    // Validate language
    if (!validateLanguage(language)) {
      setError(
        `Language '${language}' is not supported. Please use a supported language code like 'en-US', 'es-ES', 'fr-FR'.`
      );
      return;
    }

    setError(null);
    setTranscript('');

    try {
      // Create recognition instance
      const recognition = SpeechService.createBrowserRecognition(language);

      if (!recognition) {
        setError('Failed to initialize speech recognition');
        return;
      }

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
      
      let errorMessage = 'Recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or not accessible.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        case 'language-not-supported':
          errorMessage = `Language '${language}' is not supported by your browser.`;
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech service is not allowed in this context.';
          break;
        default:
          errorMessage = `Recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  } catch (err) {
    console.error('Speech recognition initialization error:', err);
    setError('Failed to initialize speech recognition');
    setIsListening(false);
  }
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
