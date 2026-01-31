import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = () => {
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/chatbot/ask', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ question: inputMessage }),
      // });
      // const data = await response.json();

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const botMessage = {
        id: Date.now() + 1,
        text: `This is a simulated response. In production, this will connect to the OpenAI API to answer: "${inputMessage}"`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
                <span className="status-dot"></span>
                Online
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
