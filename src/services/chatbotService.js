const { sanitizeText } = require('../utils/sanitizer');
const OpenAI = require('openai');

/**
 * Chatbot Service - Handles AI-powered conversations about crafts
 */
class ChatbotService {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // Knowledge base about crafts
    this.knowledgeBase = {
      crafts: {
        types: [
          'pottery',
          'weaving',
          'woodworking',
          'jewelry',
          'embroidery',
          'painting',
          'sculpture',
          'knitting',
          'crochet',
          'quilting',
          'origami',
          'calligraphy',
        ],
        materials: [
          'clay',
          'fabric',
          'wood',
          'metal',
          'yarn',
          'paper',
          'beads',
          'leather',
          'glass',
          'stone',
        ],
        techniques: {
          pottery: ['throwing', 'hand-building', 'glazing', 'firing'],
          weaving: ['plain weave', 'twill', 'satin', 'tapestry'],
          woodworking: ['carving', 'joinery', 'turning', 'finishing'],
          jewelry: ['metalsmithing', 'beading', 'wire wrapping', 'stone setting'],
        },
      },
      indianCrafts: {
        types: [
          'Madhubani Painting',
          'Warli Art',
          'Pattachitra',
          'Tanjore Painting',
          'Blue Pottery',
          'Terracotta',
          'Bandhani (Tie-Dye)',
          'Kalamkari',
          'Ikat Weaving',
          'Pashmina Weaving',
          'Zardozi Embroidery',
          'Chikankari',
          'Kantha Stitch',
          'Phulkari',
          'Dhokra Metal Casting',
          'Bidriware',
          'Meenakari',
          'Kundan Jewelry',
          'Sandalwood Carving',
          'Rosewood Inlay',
        ],
        regions: {
          Bihar: ['Madhubani Painting', 'Sikki Grass Work'],
          Maharashtra: ['Warli Art', 'Paithani Sarees'],
          Odisha: ['Pattachitra', 'Silver Filigree', 'Sambalpuri Ikat'],
          'Tamil Nadu': ['Tanjore Painting', 'Kanchipuram Silk', 'Bronze Casting'],
          Rajasthan: ['Blue Pottery', 'Bandhani', 'Meenakari', 'Block Printing'],
          'West Bengal': ['Kantha Stitch', 'Baluchari Weaving', 'Terracotta'],
          Gujarat: ['Bandhani', 'Patola Silk', 'Rogan Art'],
          Kashmir: ['Pashmina Weaving', 'Paper Mache', 'Walnut Wood Carving'],
          'Uttar Pradesh': ['Chikankari', 'Zardozi', 'Brassware'],
          Punjab: ['Phulkari', 'Punjabi Jutti'],
          Karnataka: ['Mysore Silk', 'Sandalwood Carving', 'Bidriware'],
          Telangana: ['Bidriware', 'Pochampally Ikat'],
        },
        culturalSignificance: {
          'Madhubani Painting':
            'Ancient art form from Bihar, traditionally created by women depicting Hindu deities and nature. Each painting tells a story from mythology or daily life.',
          'Warli Art':
            'Tribal art from Maharashtra using geometric patterns to depict daily life, harvest, and celebrations. Dates back to 10th century AD.',
          Pattachitra:
            'Classical art from Odisha depicting Hindu mythology, especially Lord Jagannath. Uses natural colors and follows strict iconographic traditions.',
          'Blue Pottery':
            'Persian-influenced craft from Rajasthan using Egyptian blue dye. Known for its distinctive turquoise color and floral patterns.',
          Bandhani:
            'Ancient tie-dye technique from Gujarat and Rajasthan. Worn during festivals and weddings, symbolizing joy and celebration.',
          Kalamkari:
            'Hand-painted cotton textiles from Andhra Pradesh depicting mythological stories. Name means "pen work" in Persian.',
          Chikankari:
            'Delicate white thread embroidery from Lucknow, Uttar Pradesh. Originated during Mughal era, symbolizing elegance and royalty.',
          'Dhokra Metal Casting':
            'Ancient lost-wax casting technique used by tribal artisans. Creates unique brass and bronze figurines and jewelry.',
          Pashmina:
            'Luxurious wool from Kashmir, woven from fine cashmere. Represents warmth, luxury, and Kashmiri heritage.',
          Zardozi:
            'Royal embroidery using gold and silver threads. Adorned Mughal royal garments and symbolizes opulence.',
        },
      },
      app: {
        features: [
          'AI craft recognition',
          'Voice search',
          'Craft management',
          'Image upload and analysis',
          'Speech-to-text',
          'Craft categorization',
        ],
        howTo: {
          upload:
            'Click the upload button and select an image of your craft to get AI-powered recognition.',
          search: 'Use the voice search feature to find crafts by speaking your query.',
          manage: 'Create, view, edit, and delete your crafts from the dashboard.',
        },
      },
    };

    // Intent patterns
    this.intentPatterns = {
      greeting: /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/i,
      help: /\b(help|assist|support|guide|how\s*to)\b/i,
      craftInfo: /\b(what|tell|about|explain|describe)\b.*\b(craft|pottery|weaving|woodwork)/i,
      indianCraft:
        /\b(indian|india|madhubani|warli|pattachitra|bandhani|kalamkari|chikankari|zardozi|pashmina|dhokra|bidriware|meenakari|kundan|rajasthan|kashmir|bihar|odisha|gujarat)\b/i,
      cultural:
        /\b(culture|cultural|tradition|traditional|history|historical|origin|heritage|significance|meaning|symbol|ritual|ceremony|art\s*form)\b/i,
      features: /\b(feature|capability|can\s*you|what\s*can|functionality)\b/i,
      upload: /\b(upload|add|submit|post)\b.*\b(image|photo|picture|craft)/i,
      search: /\b(search|find|look\s*for|locate)\b.*\b(craft|item)/i,
      voiceSearch: /\b(voice|speak|talk|say)\b.*\b(search|find)/i,
      materials: /\b(material|supply|tool|equipment|need)\b/i,
      techniques: /\b(technique|method|process|how\s*to\s*make|create)/i,
      categories: /\b(type|kind|category|categories)\b.*\b(craft)/i,
      thanks: /^(thank|thanks|appreciate|grateful)/i,
      goodbye: /^(bye|goodbye|see\s*you|farewell|exit|quit)/i,
    };
  }

  /**
   * Use LLM to answer cultural questions about crafts
   * @param {String} question - User's cultural question
   * @returns {Object} Response object with LLM-generated answer
   */
  async answerCulturalQuestion(question) {
    try {
      // Check if API key is configured
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === 'your-openai-api-key-here'
      ) {
        return {
          text: "I'd love to answer cultural questions about crafts, but the OpenAI API key is not configured. Please set up the OPENAI_API_KEY in your environment variables to enable this feature.\n\nIn the meantime, I can still help you with:\n• Craft recognition\n• Voice search\n• Uploading and managing crafts\n• Learning about craft types and techniques",
          suggestions: ['Show features', 'Upload craft', 'Voice search'],
          usedLLM: false,
        };
      }

      const systemPrompt = `You are a knowledgeable expert on traditional crafts from around the world, with specialized expertise in Indian handicrafts and artisan traditions.

You provide detailed, accurate information about the cultural significance, history, and traditions of various crafts, especially Indian crafts.

Focus on:
- Cultural and historical context, especially for Indian crafts
- Traditional techniques and their origins
- Symbolism and meaning in different cultures
- Regional variations and heritage across Indian states
- Modern preservation efforts and government initiatives (like GI tags)
- The role of artisan communities and their hereditary knowledge
- Connection to festivals, rituals, and daily life
- Materials used and their significance

For Indian crafts specifically, emphasize:
- State/region of origin and distinctive characteristics
- Historical patronage (Mughal, royal courts, temple traditions)
- UNESCO recognition and Geographical Indication status
- Contemporary relevance and market presence
- Master artisans and their contributions
- Revival and sustainability efforts

Indian Craft Context:
${this.getIndianCraftContext()}

Keep responses informative but concise (2-3 paragraphs max). Be respectful of all cultures and traditions.
Use engaging language that celebrates the artistry and cultural heritage.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const answer = completion.choices[0].message.content;

      return {
        text: answer,
        suggestions: [
          'Tell me more',
          'Other cultural crafts',
          'Traditional techniques',
          'Back to main features',
        ],
        usedLLM: true,
        model: 'gpt-3.5-turbo',
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);

      // Fallback response
      return {
        text: `I encountered an issue accessing cultural information: ${error.message}\n\nI can still help you with other features like craft recognition, voice search, and craft management. Would you like to explore those?`,
        suggestions: ['Show features', 'Upload craft', 'How to use app'],
        usedLLM: false,
        error: true,
      };
    }
  }

  /**
   * Get Indian craft context for LLM prompt
   * @returns {String} Formatted Indian craft information
   */
  getIndianCraftContext() {
    const indianCrafts = this.knowledgeBase.indianCrafts;
    let context = 'Notable Indian Crafts:\n';

    // Add craft types
    context += indianCrafts.types.slice(0, 10).join(', ') + '\n\n';

    // Add key regional information
    context += 'Key Regions:\n';
    const regionExamples = [
      'Bihar: Madhubani Painting',
      'Rajasthan: Blue Pottery, Bandhani',
      'Odisha: Pattachitra',
      'Kashmir: Pashmina Weaving',
      'Uttar Pradesh: Chikankari, Zardozi',
    ];
    context += regionExamples.join('\n');

    return context;
  }

  /**
   * Detect intent from user message
   * @param {String} message - User message
   * @returns {String} Detected intent
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();

    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(lowerMessage)) {
        return intent;
      }
    }

    return 'unknown';
  }

  /**
   * Generate response based on intent
   * @param {String} intent - Detected intent
   * @param {String} _message - Original message (unused but kept for future enhancements)
   * @returns {Object} Response object
   */
  generateResponse(intent, _message) {
    const responses = {
      greeting: {
        text: "Hello! 👋 I'm your AI Craft Assistant. I can help you with craft recognition, voice search, and managing your craft projects. How can I assist you today?",
        suggestions: ['Show me features', 'How to upload a craft?', 'What crafts do you support?'],
      },

      help: {
        text: "I'm here to help! Here's what I can do:\n\n🎨 **Craft Recognition**: Upload an image and I'll identify the craft type\n🎤 **Voice Search**: Search for crafts using your voice\n📝 **Craft Management**: Create, edit, and organize your craft projects\n🔍 **Smart Search**: Find crafts by name, category, or description\n\nWhat would you like to know more about?",
        suggestions: ['Upload image', 'Voice search', 'Craft types'],
      },

      features: {
        text: `Here are my main features:\n\n${this.knowledgeBase.app.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nWould you like to learn how to use any of these features?`,
        suggestions: ['How to upload?', 'How to voice search?', 'Tell me about AI recognition'],
      },

      craftInfo: {
        text: `I can recognize and help you with these craft types:\n\n${this.knowledgeBase.crafts.types.join(', ')}\n\nEach craft has unique characteristics and techniques. Would you like to know more about a specific craft?`,
        suggestions: ['Pottery techniques', 'Weaving materials', 'Woodworking tools'],
      },

      indianCraft: {
        text: `🇮🇳 **Indian Handicrafts** - A Rich Cultural Heritage!\n\nI have extensive knowledge about traditional Indian crafts:\n\n${this.knowledgeBase.indianCrafts.types.slice(0, 8).join(', ')}, and many more!\n\nEach craft represents centuries of tradition, regional identity, and artisan excellence. Ask me about any Indian craft's cultural significance, history, or techniques!`,
        suggestions: [
          'Tell me about Madhubani art',
          'History of Pashmina',
          'Rajasthani crafts',
          'Bengali artisan traditions',
        ],
      },

      cultural: {
        text: "I can provide detailed information about the cultural significance and history of various crafts using AI. Please ask your specific cultural question, and I'll give you a comprehensive answer!",
        suggestions: [
          'Cultural significance of pottery',
          'History of weaving traditions',
          'Traditional jewelry symbolism',
        ],
      },

      upload: {
        text: `To upload a craft image:\n\n1. Click the upload button or image area\n2. Select a clear image of your craft (PNG, JPG, or WEBP)\n3. Wait for AI analysis\n4. Get instant craft recognition with confidence scores\n\nThe AI will identify the craft type, suggest categories, and provide detailed analysis!`,
        suggestions: ['Supported formats', 'Best image quality', 'View examples'],
      },

      search: {
        text: 'You can search for crafts in multiple ways:\n\n🔍 **Text Search**: Type your query in the search box\n🎤 **Voice Search**: Click the microphone and speak your query\n🏷️ **Filter by Category**: Browse crafts by category or state\n\nThe search uses AI to understand your intent and find the most relevant crafts.',
        suggestions: ['Try voice search', 'Search by category', 'Advanced filters'],
      },

      voiceSearch: {
        text: 'Voice Search is super easy! 🎤\n\n1. Click the microphone icon\n2. Allow microphone access if prompted\n3. Speak your search query clearly\n4. Get instant results!\n\nSupported languages: English, Spanish, French, German, and 20+ more!',
        suggestions: ['Supported languages', 'Voice tips', 'Try it now'],
      },

      materials: {
        text: `Common materials used in crafts:\n\n${this.knowledgeBase.crafts.materials.join(', ')}\n\nDifferent crafts require different materials. Would you like to know what materials are used for a specific craft type?`,
        suggestions: ['Pottery materials', 'Weaving materials', 'Woodworking tools'],
      },

      techniques: {
        text: 'Every craft has unique techniques! Here are some examples:\n\n🏺 **Pottery**: throwing, hand-building, glazing\n🧵 **Weaving**: plain weave, twill, tapestry\n🪵 **Woodworking**: carving, joinery, turning\n💍 **Jewelry**: metalsmithing, beading, wire wrapping\n\nWhich craft technique would you like to learn about?',
        suggestions: ['Pottery techniques', 'Weaving techniques', 'All techniques'],
      },

      categories: {
        text: `Available craft categories:\n\n${this.knowledgeBase.crafts.types.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}\n\nYou can browse crafts by category or let our AI identify your craft automatically!`,
        suggestions: ['Browse pottery', 'Browse weaving', 'Upload for AI recognition'],
      },

      thanks: {
        text: "You're welcome! 😊 I'm always here to help with your craft projects. Is there anything else you'd like to know?",
        suggestions: ['Learn more features', 'Ask another question', 'Start crafting'],
      },

      goodbye: {
        text: 'Goodbye! 👋 Happy crafting! Feel free to come back anytime you need assistance.',
        suggestions: [],
      },

      unknown: {
        text: "I'm not sure I understand that question. I can help you with:\n\n• Craft recognition and identification\n• Voice search and text search\n• Uploading and managing crafts\n• Learning about craft types and techniques\n\nCould you rephrase your question or choose from the suggestions below?",
        suggestions: ['Show features', 'How to upload?', 'What crafts are supported?'],
      },
    };

    return responses[intent] || responses.unknown;
  }

  /**
   * Process user message and generate response
   * @param {String} message - User message
   * @param {Object} _context - Conversation context (unused but kept for future enhancements)
   * @returns {Object} Response with text and suggestions
   */
  async processMessage(message, _context = {}) {
    // Sanitize input
    const sanitizedMessage = sanitizeText(message);

    if (!sanitizedMessage || sanitizedMessage.trim() === '') {
      return {
        text: 'Please type a message to get started!',
        suggestions: ['Hi', 'Help me', 'Show features'],
        intent: 'empty',
      };
    }

    // Detect intent
    const intent = this.detectIntent(sanitizedMessage);

    // If cultural or Indian craft question detected, use LLM
    if (intent === 'cultural' || intent === 'indianCraft') {
      const llmResponse = await this.answerCulturalQuestion(sanitizedMessage);
      return {
        ...llmResponse,
        intent,
        timestamp: new Date().toISOString(),
      };
    }

    // Generate response using pattern matching for other intents
    const response = this.generateResponse(intent, sanitizedMessage);

    // Add metadata
    return {
      ...response,
      intent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get quick help responses
   * @returns {Array} List of quick help topics
   */
  getQuickHelp() {
    return [
      {
        title: 'Upload Craft',
        description: 'Learn how to upload and recognize crafts',
        query: 'How to upload a craft?',
      },
      {
        title: 'Voice Search',
        description: 'Search for crafts using your voice',
        query: 'How to use voice search?',
      },
      {
        title: 'Craft Types',
        description: 'See all supported craft categories',
        query: 'What craft types are supported?',
      },
      {
        title: 'Features',
        description: 'Explore all available features',
        query: 'What features do you have?',
      },
    ];
  }

  /**
   * Get FAQs
   * @returns {Array} List of frequently asked questions
   */
  getFAQs() {
    return [
      {
        question: 'How accurate is the AI craft recognition?',
        answer:
          'Our AI model has been trained on thousands of craft images and provides confidence scores for each prediction. Higher confidence scores indicate more accurate results.',
      },
      {
        question: 'What image formats are supported?',
        answer: 'We support PNG, JPG, JPEG, GIF, and WEBP formats up to 16MB in size.',
      },
      {
        question: 'Can I use voice search in different languages?',
        answer:
          'Yes! Voice search supports 25+ languages including English, Spanish, French, German, Japanese, Chinese, and more.',
      },
      {
        question: 'How do I improve recognition accuracy?',
        answer:
          'Use clear, well-lit images with the craft as the main subject. Avoid cluttered backgrounds and ensure the craft is in focus.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes, all uploads are encrypted and your craft data is private by default. You can control the visibility of your crafts.',
      },
    ];
  }
}

module.exports = new ChatbotService();
