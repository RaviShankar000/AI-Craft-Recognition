import { useState, useRef, useEffect, useContext } from 'react';
import { SocketContext } from '../context/socketContext';
import ChatbotService from '../services/chatbotService';
import './Chatbot.css';

const Chatbot = () => {
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for Indian crafts. Ask me anything about traditional crafts, their history, techniques, or cultural significance!",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Socket.IO listeners for streaming
  useEffect(() => {
    if (!socket) return;

    const cleanup = ChatbotService.setupStreamingListeners(socket, {
      onStarted: (data) => {
        console.log('Chatbot started processing:', data);
        setIsTyping(true);
        
        // Create placeholder message for streaming
        const placeholderMessage = {
          id: Date.now(),
          text: '',
          sender: 'bot',
          timestamp: new Date(),
          isStreaming: true,
        };
        
        setStreamingMessageId(placeholderMessage.id);
        setMessages(prev => [...prev, placeholderMessage]);
      },
      
      onToken: (data) => {
        const { token, messageId } = data;
        
        // Append token to the streaming message
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingMessageId || msg.id === messageId) {
            return {
              ...msg,
              text: msg.text + token,
            };
          }
          return msg;
        }));
      },
      
      onCompleted: (data) => {
        console.log('Chatbot completed:', data);
        setIsTyping(false);
        
        // Mark streaming as complete
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingMessageId) {
            return {
              ...msg,
              isStreaming: false,
              response: data.response,
            };
          }
          return msg;
        }));
        
        setStreamingMessageId(null);
      },
      
      onError: (data) => {
        console.error('Chatbot error:', data);
        setIsTyping(false);
        
        const errorMessage = {
          id: Date.now(),
          text: data.error || 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          isError: true,
        };
        
        // Remove streaming message if exists
        if (streamingMessageId) {
          setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
          setStreamingMessageId(null);
        }
        
        setMessages(prev => [...prev, errorMessage]);
      },
    });

    return cleanup;
  }, [socket, streamingMessageId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      if (socket && socket.connected) {
        // Send via streaming (Socket.IO)
        await ChatbotService.sendStreamingMessage(socket, inputMessage.trim());
      } else {
        // Fallback to HTTP-only (no streaming)
        console.warn('Socket not connected, using HTTP fallback');
        const response = await ChatbotService.sendMessage(inputMessage.trim());
        
        setIsTyping(false);
        
        if (response.success) {
          const botMessage = {
            id: Date.now() + 1,
            text: response.data.text || response.data.message || 'Received response',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          const errorMessage = {
            id: Date.now() + 1,
            text: response.error || 'Failed to get response',
            sender: 'bot',
            timestamp: new Date(),
            isError: true,
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const quickQuestions = [
    'What is Madhubani painting?',
    'Tell me about Pashmina shawls',
    'History of Warli art',
    'How is Blue Pottery made?',
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Chat cleared! How can I help you with Indian crafts?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setStreamingMessageId(null);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-card">
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <div className="bot-avatar">
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
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="header-info">
              <h2>Craft Assistant</h2>
              <p className="status">
                <span className="status-dot" style={{ backgroundColor: socket?.connected ? '#10b981' : '#f59e0b' }}></span>
                {socket?.connected ? 'Online (Streaming)' : 'Online (Standard)'}
              </p>
            </div>
          </div>
          <button 
            className="btn-clear-chat" 
            onClick={clearChat}
            aria-label="Clear chat"
          >
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
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${message.sender}`}
            >
              {message.sender === 'bot' && (
                <div className="message-avatar bot-avatar-small">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              )}
              <div className={`message-bubble ${message.sender} ${message.isError ? 'error' : ''} ${message.isStreaming ? 'streaming' : ''}`}>
                <p className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                  {message.isStreaming && <span className="cursor-blink">▋</span>}
                </p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              {message.sender === 'user' && (
                <div className="message-avatar user-avatar-small">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isTyping && !streamingMessageId && (
            <div className="message-wrapper bot">
              <div className="message-avatar bot-avatar-small">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="message-bubble bot typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="quick-questions">
            <p className="quick-questions-label">Quick questions:</p>
            <div className="quick-questions-grid">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chatbot-input-area">
          <form onSubmit={handleSendMessage} className="input-form">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Indian crafts..."
              className="chat-input"
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="btn-send"
              aria-label="Send message"
            >
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
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p className="input-hint">
            Press Enter to send, Shift+Enter for new line
            {socket?.connected && <span style={{ color: '#10b981', marginLeft: '8px' }}>• Streaming enabled</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${message.sender}`}
            >
              {message.sender === 'bot' && (
                <div className="message-avatar bot-avatar-small">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              )}
              <div className={`message-bubble ${message.sender} ${message.isError ? 'error' : ''}`}>
                <p className="message-text">{message.text}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              {message.sender === 'user' && (
                <div className="message-avatar user-avatar-small">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-avatar bot-avatar-small">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="message-bubble bot typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="quick-questions">
            <p className="quick-questions-label">Quick questions:</p>
            <div className="quick-questions-grid">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chatbot-input-area">
          <form onSubmit={handleSendMessage} className="input-form">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Indian crafts..."
              className="chat-input"
              rows="1"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="btn-send"
              aria-label="Send message"
            >
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
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
