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

    // Performance optimization: Response cache for frequently asked questions
    this.responseCache = new Map();
    this.maxCacheSize = 100;

    // Performance optimization: Cache for static responses
    this.staticResponseCache = new Map();

    // Response cache for frequently asked questions (LRU cache with max 100 entries)
    this.responseCache = new Map();
    this.maxCacheSize = 100;

    // Pre-compile intent patterns for faster matching
    this.compiledIntentPatterns = null;

    // Cache for formatted responses (avoid regenerating static responses)
    this.staticResponseCache = new Map();
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

    // Performance optimization: Priority order for intent checking (most common first)
    this.intentPriority = [
      'greeting',
      'help',
      'thanks',
      'goodbye',
      'features',
      'upload',
      'indianCraft',
      'craftInfo',
      'cultural',
      'search',
      'voiceSearch',
      'materials',
      'techniques',
      'categories',
    ];
  }

  /**
   * Add response to cache with LRU eviction
   * @param {String} key - Cache key
   * @param {Object} value - Response to cache
   */
  addToCache(key, value) {
    // Remove oldest entry if cache is full
    if (this.responseCache.size >= this.maxCacheSize) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    // Add to cache (most recent)
    this.responseCache.set(key, {
      response: value,
      timestamp: Date.now(),
    });
  }

  /**
   * Get response from cache
   * @param {String} key - Cache key
   * @returns {Object|null} Cached response or null
   */
  getFromCache(key) {
    const cached = this.responseCache.get(key);
    if (cached) {
      // Move to end (most recently used)
      this.responseCache.delete(key);
      this.responseCache.set(key, cached);
      return cached.response;
    }
    return null;
  }

  /**
   * Generate cache key for message
   * @param {String} message - User message
   * @param {String} intent - Detected intent
   * @returns {String} Cache key
   */
  generateCacheKey(message, intent) {
    return `${intent}:${message.toLowerCase().trim().substring(0, 100)}`;
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
        return this.createFormattedResponse(
          "🔐 **AI Feature Not Configured**\n\n⚠️ The OpenAI API key is not set up. To enable AI-powered cultural insights, please configure the OPENAI_API_KEY in your environment variables.\n\n---\n\n**Available Features:**\n\n✅ Craft recognition\n✅ Voice search\n✅ Upload and manage crafts\n✅ Browse craft types and techniques\n✅ Basic craft information\n\n---\n\n💡 Once configured, you'll get detailed AI-powered answers about cultural significance, history, and traditions!",
          ['Show features', 'Upload craft', 'Voice search'],
          {
            usedLLM: false,
            requiresConfiguration: true,
            category: 'config-error',
          }
        );
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

      // Format the LLM response
      const formattedAnswer = `🤖 **AI Cultural Expert**\n\n${answer}\n\n---\n\n✨ *Response generated by advanced AI with cultural expertise*`;

      return this.createFormattedResponse(
        formattedAnswer,
        [
          'Tell me more',
          'Other cultural crafts',
          'Traditional techniques',
          'Back to main features',
        ],
        {
          usedLLM: true,
          model: 'gpt-3.5-turbo',
          category: 'cultural-llm',
          aiGenerated: true,
        }
      );
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);

      // Fallback response
      return this.createFormattedResponse(
        `⚠️ **Unable to Access AI Cultural Expert**\n\n${error.message}\n\n---\n\n**I Can Still Help With:**\n\n• Craft recognition and identification\n• Voice and text search\n• Craft management\n• Basic craft information\n\nWould you like to explore these features?`,
        ['Show features', 'Upload craft', 'How to use app'],
        {
          usedLLM: false,
          error: true,
          category: 'error',
        }
      );
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
   * Validate message input
   * @param {String} message - Message to validate
   * @returns {Object} Validation result with isValid and error message
   */
  validateMessage(message) {
    // Check if message exists
    if (!message) {
      return {
        isValid: false,
        error: 'empty',
        reason: 'No message provided',
      };
    }

    // Check if message is a string
    if (typeof message !== 'string') {
      return {
        isValid: false,
        error: 'invalid_type',
        reason: 'Message must be a string',
      };
    }

    // Check if message is only whitespace
    if (message.trim() === '') {
      return {
        isValid: false,
        error: 'whitespace_only',
        reason: 'Message contains only whitespace',
      };
    }

    // Check minimum length (at least 1 character after sanitization)
    const sanitized = sanitizeText(message);
    if (!sanitized || sanitized.trim().length === 0) {
      return {
        isValid: false,
        error: 'no_content',
        reason: 'Message has no valid content after sanitization',
      };
    }

    // Check if message is too short to be meaningful
    if (sanitized.trim().length < 2) {
      return {
        isValid: false,
        error: 'too_short',
        reason: 'Message is too short (minimum 2 characters)',
      };
    }

    // Check maximum length
    if (message.length > 1000) {
      return {
        isValid: false,
        error: 'too_long',
        reason: 'Message exceeds 1000 characters',
      };
    }

    // Check for repeated characters (potential spam)
    const repeatedPattern = /(.)\1{10,}/;
    if (repeatedPattern.test(message)) {
      return {
        isValid: false,
        error: 'spam_detected',
        reason: 'Message contains excessive repeated characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  /**
   * Format response text with consistent styling
   * @param {String} text - Raw text to format
   * @param {Object} options - Formatting options
   * @returns {String} Formatted text
   */
  formatResponseText(text, options = {}) {
    const { addDivider = false, addSpacing = true } = options;

    let formatted = text;

    // Add consistent spacing
    if (addSpacing) {
      formatted = formatted.replace(/\n\n\n+/g, '\n\n'); // Remove excessive line breaks
    }

    // Add divider at the end if requested
    if (addDivider) {
      formatted += '\n\n---';
    }

    return formatted.trim();
  }

  /**
   * Create a formatted response object
   * @param {String} text - Response text
   * @param {Array} suggestions - Suggestion chips
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted response object
   */
  createFormattedResponse(text, suggestions = [], metadata = {}) {
    return {
      text: this.formatResponseText(text),
      suggestions,
      formatted: true,
      ...metadata,
    };
  }

  /**
   * Generate error response for invalid input
   * @param {String} errorType - Type of error
   * @returns {Object} Error response object
   */
  createErrorResponse(errorType) {
    const errorResponses = {
      empty: this.createFormattedResponse(
        '💬 **No Message Received**\n\n⚠️ Please type a message to start our conversation.\n\n**What would you like to know?**\n\n• Craft recognition features\n• How to upload images\n• Indian handicrafts\n• Voice search capabilities\n• Cultural insights',
        ['Hi', 'Help me', 'Show features', 'Indian crafts'],
        { error: true, errorType: 'empty', intent: 'error' }
      ),

      whitespace_only: this.createFormattedResponse(
        '✍️ **Empty Message**\n\n⚠️ Your message appears to be empty (only whitespace detected).\n\n**Please type a valid question or command.**\n\n💡 **Try asking:**\n• "What features do you have?"\n• "How do I upload a craft?"\n• "Tell me about Indian crafts"',
        ['Show features', 'Upload guide', 'Indian crafts', 'Help'],
        { error: true, errorType: 'whitespace_only', intent: 'error' }
      ),

      no_content: this.createFormattedResponse(
        '🔍 **No Valid Content**\n\n⚠️ Your message has no valid content after processing.\n\n**Please try again with a clear question.**\n\n📝 **Examples:**\n• Ask about craft types\n• Request help with features\n• Inquire about cultural significance',
        ['Craft types', 'Features', 'Help', 'Cultural info'],
        { error: true, errorType: 'no_content', intent: 'error' }
      ),

      too_short: this.createFormattedResponse(
        '📏 **Message Too Short**\n\n⚠️ Your message is too short to understand.\n\n**Please provide at least 2 characters.**\n\n💡 **Quick starts:**\n• Type "hi" to begin\n• Ask "help" for assistance\n• Say "features" to explore',
        ['Hi', 'Help', 'Features', 'Start'],
        { error: true, errorType: 'too_short', intent: 'error' }
      ),

      too_long: this.createFormattedResponse(
        '📝 **Message Too Long**\n\n⚠️ Your message exceeds the 1000 character limit.\n\n**Please:**\n• Break it into smaller questions\n• Focus on one topic at a time\n• Keep messages concise\n\n💡 I work best with clear, focused questions!',
        ['Ask shorter question', 'Get help', 'Show features'],
        { error: true, errorType: 'too_long', intent: 'error' }
      ),

      spam_detected: this.createFormattedResponse(
        "🚫 **Invalid Input Detected**\n\n⚠️ Your message contains unusual patterns.\n\n**Please send a normal message.**\n\n📱 **I'm here to help with:**\n• Craft information\n• Upload assistance\n• Search features\n• Cultural insights",
        ['Start fresh', 'Show features', 'Help'],
        { error: true, errorType: 'spam_detected', intent: 'error' }
      ),

      invalid_type: this.createFormattedResponse(
        '⚠️ **Invalid Message Format**\n\n❌ Message must be text.\n\n**Please send a text message.**\n\n💬 **You can ask about:**\n• Craft recognition\n• Voice search\n• Indian handicrafts\n• Upload features',
        ['Help', 'Features', 'Start'],
        { error: true, errorType: 'invalid_type', intent: 'error' }
      ),
    };

    return (
      errorResponses[errorType] ||
      this.createFormattedResponse(
        '❌ **Something Went Wrong**\n\nPlease try again with a valid message.',
        ['Help', 'Start over'],
        { error: true, errorType: 'unknown', intent: 'error' }
      )
    );
  }

  /**
   * Detect intent from user message (optimized with priority ordering)
   * @param {String} message - User message
   * @returns {String} Detected intent
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Check intents in priority order (most common first) for faster matching
    for (const intent of this.intentPriority) {
      const pattern = this.intentPatterns[intent];
      if (pattern && pattern.test(lowerMessage)) {
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
    // Check if response is already cached (for static responses)
    const cacheKey = `static_${intent}`;
    if (this.staticResponseCache.has(cacheKey)) {
      return this.staticResponseCache.get(cacheKey);
    }

    // Generate response lazily - only create what's needed
    let response;

    switch (intent) {
      case 'greeting':
        response = this.createFormattedResponse(
          "🙏 **Hello! Welcome to AI Craft Assistant**\n\nI'm here to help you with:\n\n✨ **Craft Recognition** - Identify crafts from images\n🎤 **Voice Search** - Find crafts using your voice\n📚 **Cultural Knowledge** - Learn about craft traditions\n📝 **Craft Management** - Organize your projects\n\nHow can I assist you today?",
          ['Show me features', 'How to upload a craft?', 'What crafts do you support?'],
          { category: 'greeting', priority: 'high' }
        );
        break;

      case 'help':
        response = this.createFormattedResponse(
          '📖 **Help Center**\n\n**What I Can Do:**\n\n🎨 **Craft Recognition**\n   Upload images for AI-powered identification\n\n🎤 **Voice Search**\n   Search using 25+ languages\n\n📝 **Craft Management**\n   Create, edit, and organize projects\n\n🔍 **Smart Search**\n   Find crafts by name, category, or description\n\n🌍 **Cultural Insights**\n   Learn about craft traditions and history\n\n---\n\n💡 What would you like to explore?',
          ['Upload image', 'Voice search', 'Indian crafts', 'All features'],
          { category: 'help', hasMultipleSections: true }
        );
        break;

      case 'features':
        response = this.createFormattedResponse(
          `⚡ **Platform Features**\n\n${this.knowledgeBase.app.features.map((f, i) => `**${i + 1}.** ${f}`).join('\n')}\n\n---\n\n🎯 **Ready to get started?**\nChoose a feature below to learn more!`,
          ['How to upload?', 'How to voice search?', 'Tell me about AI recognition'],
          { category: 'features', totalFeatures: this.knowledgeBase.app.features.length }
        );
        break;

      case 'craftInfo':
        response = this.createFormattedResponse(
          `🎨 **Supported Craft Types**\n\n${this.knowledgeBase.crafts.types.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}\n\n---\n\n💡 **Each craft has unique characteristics and techniques.**\n\nWould you like to explore a specific craft in detail?`,
          ['Pottery techniques', 'Weaving materials', 'Indian traditional crafts'],
          { category: 'craftInfo', totalCrafts: this.knowledgeBase.crafts.types.length }
        );
        break;

      case 'indianCraft':
        response = this.createFormattedResponse(
          `🇮🇳 **Indian Handicrafts - A Rich Cultural Heritage**\n\n**Traditional Art Forms:**\n${this.knowledgeBase.indianCrafts.types
            .slice(0, 10)
            .map(c => `• ${c}`)
            .join(
              '\n'
            )}\n\n...and many more!\n\n---\n\n📜 **Why Indian Crafts Matter:**\n\n✨ Centuries of tradition and artisan excellence\n🗺️ Unique regional identities across 12+ states\n🏆 UNESCO recognition and GI tags\n👐 Hereditary knowledge passed through generations\n\n---\n\n💬 Ask me about any craft's cultural significance, history, or techniques!`,
          [
            'Tell me about Madhubani art',
            'History of Pashmina',
            'Rajasthani crafts',
            'Bengali artisan traditions',
          ],
          {
            category: 'indianCraft',
            region: 'India',
            totalCrafts: this.knowledgeBase.indianCrafts.types.length,
          }
        );
        break;

      case 'cultural':
        response = this.createFormattedResponse(
          "🌍 **Cultural Insights Powered by AI**\n\n**What I Can Tell You:**\n\n📜 Historical context and origins\n🎭 Cultural significance and symbolism\n🗺️ Regional variations and traditions\n👥 Artisan communities and heritage\n🏛️ Museum collections and preservation\n\n---\n\n💡 Ask me your cultural question, and I'll provide a comprehensive answer using advanced AI!",
          [
            'Cultural significance of pottery',
            'History of weaving traditions',
            'Traditional jewelry symbolism',
          ],
          { category: 'cultural', usesAI: true }
        );
        break;

      default:
        // For other intents, generate responses on-demand without caching
        return this.generateDynamicResponse(intent);
    }

    // Cache static responses for future use
    this.staticResponseCache.set(cacheKey, response);
    return response;
  }

  /**
   * Generate dynamic responses that shouldn't be cached
   * @param {String} intent - Detected intent
   * @returns {Object} Response object
   */
  generateDynamicResponse(intent) {
    const responses = {
      upload: this.createFormattedResponse(
        "📄 **Upload Your Craft Image**\n\n**Steps to Upload:**\n\n➡️ **Step 1:** Click the upload button or drag & drop\n➡️ **Step 2:** Select a clear craft image (PNG, JPG, WEBP)\n➡️ **Step 3:** Wait for AI analysis (takes 2-5 seconds)\n➡️ **Step 4:** Get instant recognition with confidence scores\n\n---\n\n✅ **What You'll Get:**\n\n• Craft type identification\n• Category suggestions\n• Detailed analysis\n• Confidence scores\n\n💡 **Tip:** Use well-lit, clear images for best results!",
        ['Supported formats', 'Best image quality', 'View examples'],
        { category: 'upload', hasSteps: true, stepCount: 4 }
      ),

      search: this.createFormattedResponse(
        '🔍 **Search for Crafts**\n\n**Multiple Search Options:**\n\n📝 **Text Search**\n   Type your query in the search box\n   Supports natural language\n\n🎤 **Voice Search**\n   Click microphone and speak\n   25+ languages supported\n\n🏷️ **Filter by Category**\n   Browse by craft type or state\n   Quick category navigation\n\n---\n\n🤖 **AI-Powered:**\nOur search uses artificial intelligence to understand your intent and find the most relevant crafts!',
        ['Try voice search', 'Search by category', 'Advanced filters'],
        { category: 'search', hasMultipleOptions: true }
      ),

      voiceSearch: this.createFormattedResponse(
        '🎤 **Voice Search Made Easy**\n\n**Quick Start Guide:**\n\n1️⃣ Click the microphone icon\n2️⃣ Allow microphone access (if prompted)\n3️⃣ Speak your search query clearly\n4️⃣ Get instant results!\n\n---\n\n🌐 **Language Support:**\n\n✅ English, Spanish, French, German\n✅ Hindi, Tamil, Telugu, Bengali\n✅ Japanese, Chinese, Korean\n✅ And 20+ more languages!\n\n---\n\n💡 **Pro Tips:**\n\n• Speak at a normal pace\n• Minimize background noise\n• Hold device 6-8 inches from mouth',
        ['Supported languages', 'Voice tips', 'Try it now'],
        { category: 'voiceSearch', totalLanguages: 25, hasSteps: true }
      ),

      materials: this.createFormattedResponse(
        `🪨 **Common Craft Materials**\n\n${this.knowledgeBase.crafts.materials.map(m => `• ${m.charAt(0).toUpperCase() + m.slice(1)}`).join('\n')}\n\n---\n\n📚 **Material Information:**\n\nDifferent crafts require specific materials and tools. Each material has unique properties that influence the final artwork.\n\n🔍 Want to know what materials are used for a specific craft type?`,
        ['Pottery materials', 'Weaving materials', 'Woodworking tools'],
        { category: 'materials', totalMaterials: this.knowledgeBase.crafts.materials.length }
      ),

      techniques: this.createFormattedResponse(
        '🎯 **Craft Techniques**\n\nEvery craft has unique techniques passed down through generations!\n\n---\n\n🏺 **Pottery**\n   Throwing, Hand-building, Glazing, Firing\n\n🧵 **Weaving**\n   Plain Weave, Twill, Tapestry, Jacquard\n\n🪨 **Woodworking**\n   Carving, Joinery, Turning, Finishing\n\n💍 **Jewelry**\n   Metalsmithing, Beading, Wire Wrapping, Stone Setting\n\n---\n\n📚 Which craft technique would you like to explore in detail?',
        ['Pottery techniques', 'Weaving techniques', 'All techniques'],
        { category: 'techniques', hasCraftExamples: true }
      ),

      categories: this.createFormattedResponse(
        `🏷️ **Craft Categories**\n\n**Browse by Type:**\n\n${this.knowledgeBase.crafts.types.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}\n\n---\n\n🤖 **Two Ways to Explore:**\n\n1️⃣ **Browse by Category** - Click any category above\n2️⃣ **AI Recognition** - Upload an image for automatic identification\n\n💡 Our AI can identify crafts even if you're not sure of the category!`,
        ['Browse pottery', 'Browse weaving', 'Upload for AI recognition'],
        { category: 'categories', totalCategories: this.knowledgeBase.crafts.types.length }
      ),

      thanks: this.createFormattedResponse(
        "🙏 **You're Very Welcome!**\n\nI'm always here to help with:\n\n• Craft recognition & identification\n• Cultural insights & history\n• Voice & text search\n• Managing your craft projects\n\n---\n\n💬 Is there anything else you'd like to know?",
        ['Learn more features', 'Ask another question', 'Start crafting'],
        { category: 'thanks', sentiment: 'positive' }
      ),

      goodbye: this.createFormattedResponse(
        "👋 **Goodbye & Happy Crafting!**\n\n✨ Thank you for using AI Craft Assistant\n🌿 May your creative journey be fulfilling\n🖙️ Feel free to return anytime\n\n---\n\n💬 **Remember:** I'm here 24/7 whenever you need assistance with crafts!",
        [],
        { category: 'goodbye', sentiment: 'positive' }
      ),

      unknown: this.createFormattedResponse(
        "🤔 **I'm Not Sure I Understood That**\n\n**Here's What I Can Help With:**\n\n✅ Craft recognition and identification\n✅ Voice search and text search\n✅ Uploading and managing crafts\n✅ Learning about craft types and techniques\n✅ Cultural history and traditions\n✅ Indian handicrafts expertise\n\n---\n\n💡 Could you rephrase your question or choose from the suggestions below?",
        ['Show features', 'How to upload?', 'What crafts are supported?'],
        { category: 'unknown', needsClarification: true }
      ),
    };

    return responses[intent] || responses.unknown;
  }

  /**
   * Process user message and generate response (optimized with caching)
   * @param {String} message - User message
   * @param {Object} _context - Conversation context (unused but kept for future enhancements)
   * @returns {Object} Response with text and suggestions
   */
  async processMessage(message, _context = {}) {
    // Validate message
    const validation = this.validateMessage(message);

    if (!validation.isValid) {
      const errorResponse = this.createErrorResponse(validation.error);
      return {
        ...errorResponse,
        timestamp: new Date().toISOString(),
        validationError: validation.reason,
      };
    }

    // Use sanitized message from validation
    const sanitizedMessage = validation.sanitized;

    // Detect intent
    const intent = this.detectIntent(sanitizedMessage);

    // Check cache for non-LLM intents (LLM responses are unique and shouldn't be cached heavily)
    if (intent !== 'cultural' && intent !== 'indianCraft') {
      const cacheKey = this.generateCacheKey(sanitizedMessage, intent);
      const cachedResponse = this.getFromCache(cacheKey);

      if (cachedResponse) {
        // Return cached response with updated timestamp
        return {
          ...cachedResponse,
          timestamp: new Date().toISOString(),
          cached: true,
        };
      }
    }

    // If cultural or Indian craft question detected, use LLM
    if (intent === 'cultural' || intent === 'indianCraft') {
      const llmResponse = await this.answerCulturalQuestion(sanitizedMessage);
      const responseWithMeta = {
        ...llmResponse,
        intent,
        timestamp: new Date().toISOString(),
      };

      // Cache LLM responses for common questions only
      if (sanitizedMessage.length < 100) {
        const cacheKey = this.generateCacheKey(sanitizedMessage, intent);
        this.addToCache(cacheKey, responseWithMeta);
      }

      return responseWithMeta;
    }

    // Generate response using pattern matching for other intents
    const response = this.generateResponse(intent, sanitizedMessage);

    // Add metadata
    const responseWithMeta = {
      ...response,
      intent,
      timestamp: new Date().toISOString(),
    };

    // Cache the response for future use
    const cacheKey = this.generateCacheKey(sanitizedMessage, intent);
    this.addToCache(cacheKey, responseWithMeta);

    return responseWithMeta;
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
