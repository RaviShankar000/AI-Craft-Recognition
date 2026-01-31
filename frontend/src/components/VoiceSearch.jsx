import { useState } from 'react';
import VoiceInput from './VoiceInput';
import craftService from '../services/craftService';
import { sanitizeTranscript } from '../utils/sanitizer';
import './VoiceSearch.css';

function VoiceSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVoiceTranscript = async (transcript) => {
    if (!transcript || transcript.trim() === '') {
      return;
    }

    // Sanitize the transcript
    const sanitizedQuery = sanitizeTranscript(transcript, {
      maxLength: 200,
      removeScripts: true,
      normalizeWhitespace: true,
    });

    setSearchQuery(sanitizedQuery);
    await performSearch(sanitizedQuery);
  };

  const performSearch = async (query) => {
    setLoading(true);
    setError(null);

    try {
      // Use voice search endpoint for better analytics and sanitization
      const results = await craftService.voiceSearchCrafts(query);

      if (results.success) {
        setSearchResults(results.data);
        console.log(`Found ${results.count} crafts matching: "${results.query || query}"`);
      } else {
        setError(results.error || 'Failed to search crafts');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setSearchResults([]);
    } finally {
      setLoading(false);
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
  };

  return (
    <div className="voice-search">
      <div className="search-header">
        <h2>🔍 Voice Craft Search</h2>
        <p>Search crafts using your voice or text</p>
      </div>

      {/* Voice Input */}
      <VoiceInput onTranscript={handleVoiceTranscript} language="en-US" />

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

      {/* Loading State */}
      {loading && (
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
