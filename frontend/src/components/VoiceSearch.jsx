import { useState, useEffect } from 'react';
import VoiceInput from './VoiceInput';
import VoiceSearchService from '../services/voiceSearchService';
import { useSocket } from '../hooks/useSocket';
import './VoiceSearch.css';

function VoiceSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState(null); // 'started', 'streaming', 'completed', 'failed'
  const [streamingBatch, setStreamingBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [isListening, setIsListening] = useState(false); // Track voice listening state
  const { socket } = useSocket();

  // Listen for real-time voice search events
  useEffect(() => {
    if (!socket) return;

    const handleSearchStarted = (data) => {
      console.log('[VOICE SEARCH] Started:', data);
      setSearchStatus('started');
      setLoading(true);
      setError(null);
      setSearchResults([]); // Clear previous results
      setStreamingBatch(0);
      setTotalBatches(0);
    };

    const handleSearchResults = (data) => {
      console.log('[VOICE SEARCH] Results batch:', data);
      setSearchStatus('streaming');
      setStreamingBatch(data.batch);
      setTotalBatches(data.totalBatches);
      
      // Append new results to existing ones
      setSearchResults(prevResults => [...prevResults, ...data.results]);
    };

    const handleSearchCompleted = (data) => {
      console.log('[VOICE SEARCH] Completed:', data);
      setSearchStatus('completed');
      setLoading(false);
    };

    const handleSearchFailed = (data) => {
      console.error('[VOICE SEARCH] Failed:', data);
      setSearchStatus('failed');
      setLoading(false);
      setError(data.error || data.message || 'Voice search failed');
      setSearchResults([]);
    };

    socket.on('voice_search_started', handleSearchStarted);
    socket.on('voice_search_results', handleSearchResults);
    socket.on('voice_search_completed', handleSearchCompleted);
    socket.on('voice_search_failed', handleSearchFailed);

    return () => {
      socket.off('voice_search_started', handleSearchStarted);
      socket.off('voice_search_results', handleSearchResults);
      socket.off('voice_search_completed', handleSearchCompleted);
      socket.off('voice_search_failed', handleSearchFailed);
    };
  }, [socket]);

  const handleVoiceTranscript = async (transcript) => {
    // Process and search using voice search service
    const processedQuery = VoiceSearchService.processVoiceQuery(transcript);

    if (!processedQuery) {
      return;
    }

    setSearchQuery(processedQuery);
    setIsListening(false); // Stop listening indicator when transcript received
    await performSearch(processedQuery);
  };

  const performSearch = async (query) => {
    // Validate query
    const validation = VoiceSearchService.validateSearchQuery(query);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchStatus('started');

    try {
      // Use voice search service
      const results = await VoiceSearchService.searchCrafts(query);

      if (results.success) {
        // Only update if socket hasn't already provided results
        if (searchStatus !== 'completed' && searchResults.length === 0) {
          setSearchResults(results.data);
        }
        console.log(`Found ${results.count} crafts matching: "${results.query}"`);
      } else {
        setError(results.error || 'Failed to search crafts');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setSearchResults([]);
    } finally {
      if (searchStatus !== 'completed') {
        setLoading(false);
      }
    }
  };

  const handleTextSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await performSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setSearchStatus(null);
    setStreamingBatch(0);
    setTotalBatches(0);
    setIsListening(false);
  };

  const handleVoiceStateChange = (listening) => {
    setIsListening(listening);
  };

  return (
    <div className="voice-search">
      <div className="search-header">
        <h2>🔍 Voice Craft Search</h2>
        <p>Search crafts using your voice or text</p>
        
        {/* Master Live State Indicator */}
        <div className="master-state-indicator">
          {isListening && (
            <div className="state-badge listening">
              <span className="state-icon pulsing">🎤</span>
              <span className="state-text">Listening to your voice...</span>
              <div className="audio-waves">
                <span className="wave"></span>
                <span className="wave"></span>
                <span className="wave"></span>
              </div>
            </div>
          )}
          {!isListening && (searchStatus === 'started' || searchStatus === 'streaming') && (
            <div className="state-badge searching">
              <span className="state-icon pulsing">🔍</span>
              <span className="state-text">
                {searchStatus === 'started' && 'Starting search...'}
                {searchStatus === 'streaming' && `Searching... (${streamingBatch}/${totalBatches})`}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${totalBatches > 0 ? (streamingBatch / totalBatches) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
          {!isListening && searchStatus === 'completed' && searchResults.length > 0 && (
            <div className="state-badge completed">
              <span className="state-icon">✓</span>
              <span className="state-text">Found {searchResults.length} results</span>
            </div>
          )}
        </div>
      </div>

      {/* Voice Input */}
      <VoiceInput 
        onTranscript={handleVoiceTranscript} 
        language="en-US"
        onStateChange={handleVoiceStateChange}
      />

      {/* Text Search Form */}
      <form onSubmit={handleTextSearch} className="text-search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Or type your search query..."
            className="search-input"
          />
          <button type="submit" disabled={loading || !searchQuery.trim()} className="btn-search">
            Search
          </button>
          {searchQuery && (
            <button type="button" onClick={clearSearch} className="btn-clear-search">
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Streaming Status */}
      {searchStatus && (
        <div className={`search-status ${searchStatus}`}>
          {searchStatus === 'started' && (
            <>
              <span className="status-dot pulsing"></span>
              <span>Starting search...</span>
            </>
          )}
          {searchStatus === 'streaming' && (
            <>
              <span className="status-dot pulsing"></span>
              <span>Loading results ({streamingBatch}/{totalBatches} batches)...</span>
            </>
          )}
          {searchStatus === 'completed' && (
            <>
              <span className="status-dot"></span>
              <span>✓ Search complete - {searchResults.length} results</span>
            </>
          )}
          {searchStatus === 'failed' && (
            <>
              <span className="status-dot"></span>
              <span>✗ Search failed</span>
            </>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !searchStatus && (
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Searching crafts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="search-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>
              Found {searchResults.length} craft{searchResults.length !== 1 ? 's' : ''}
            </h3>
            <p className="search-query">Query: &quot;{searchQuery}&quot;</p>
          </div>

          <div className="results-grid">
            {searchResults.map((craft) => (
              <div key={craft._id} className="craft-card">
                <div className="craft-card-header">
                  <h4>{craft.name}</h4>
                  <span className={`craft-state state-${craft.state}`}>{craft.state}</span>
                </div>

                {craft.images && craft.images.length > 0 && (
                  <div className="craft-image">
                    <img src={craft.images[0].url} alt={craft.images[0].altText || craft.name} />
                  </div>
                )}

                <div className="craft-description">
                  <p>{craft.description}</p>
                </div>

                {craft.category && (
                  <div className="craft-category">
                    <span className="category-badge">{craft.category}</span>
                  </div>
                )}

                {craft.tags && craft.tags.length > 0 && (
                  <div className="craft-tags">
                    {craft.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {craft.aiAnalysis && craft.aiAnalysis.recognized && (
                  <div className="ai-analysis">
                    <span className="ai-badge">
                      🤖 AI: {(craft.aiAnalysis.confidence || 0).toFixed(0)}% confidence
                    </span>
                  </div>
                )}

                <div className="craft-footer">
                  <small>
                    {new Date(craft.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </small>
                  {craft.viewCount > 0 && (
                    <small className="view-count">👁 {craft.viewCount} views</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && searchQuery && searchResults.length === 0 && !error && (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          <h3>No crafts found</h3>
          <p>Try a different search query</p>
        </div>
      )}
    </div>
  );
}

export default VoiceSearch;
