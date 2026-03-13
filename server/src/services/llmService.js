const OpenAI = require('openai');
const cacheService = require('./cacheService');

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'had',
  'has', 'have', 'i', 'in', 'is', 'it', 'its', 'my', 'of', 'on', 'or', 'that',
  'the', 'their', 'there', 'this', 'to', 'was', 'were', 'with', 'you', 'your'
]);

class LLMService {
  constructor() {
    this.openai = null;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.cacheTTL = 3600; // 1 hour
  }

  /**
   * Initialize OpenAI client lazily
   */
  getClient() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  hasWorkingApiKey() {
    const apiKey = process.env.OPENAI_API_KEY;
    return Boolean(apiKey && apiKey !== 'your-openai-api-key-here');
  }

  buildFallbackAnalysis(text) {
    const normalizedText = text.toLowerCase();
    const emotionLexicon = [
      { emotion: 'calm', words: ['calm', 'peace', 'quiet', 'rest', 'breathe', 'gentle', 'relaxed'] },
      { emotion: 'happy', words: ['happy', 'joy', 'grateful', 'excited', 'good', 'great', 'smile'] },
      { emotion: 'anxious', words: ['anxious', 'worried', 'stress', 'overwhelmed', 'nervous', 'afraid'] },
      { emotion: 'sad', words: ['sad', 'down', 'lonely', 'hurt', 'cry', 'empty'] },
      { emotion: 'frustrated', words: ['frustrated', 'angry', 'upset', 'irritated', 'annoyed'] },
    ];

    const detectedEmotion = emotionLexicon.find(({ words }) =>
      words.some((word) => normalizedText.includes(word))
    )?.emotion || 'reflective';

    const keywords = Array.from(
      new Set(
        normalizedText
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((word) => word.length > 3 && !STOPWORDS.has(word))
          .slice(0, 5)
      )
    );

    return {
      emotion: detectedEmotion,
      keywords,
      summary: `Local fallback analysis suggests a ${detectedEmotion} tone in this entry.`,
    };
  }

  /**
   * Analyze text and return emotion, keywords, and summary
   * Required format:
   * {
   *   "emotion": "calm",
   *   "keywords": ["rain", "nature", "peace"],
   *   "summary": "User experienced relaxation during the forest session"
   * }
   */
  async analyzeText(text) {
    // Create cache key from text hash
    const textHash = Buffer.from(text).toString('base64').slice(0, 50);
    const cacheKey = `analysis:${textHash}`;
    
    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('Returning cached analysis');
      return JSON.parse(cached);
    }

    try {
      if (!this.hasWorkingApiKey()) {
        const fallback = this.buildFallbackAnalysis(text);
        await cacheService.set(cacheKey, JSON.stringify(fallback), this.cacheTTL);
        return fallback;
      }

      const client = this.getClient();
      
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an empathetic emotion analyzer for a journaling app. 
Analyze the journal entry and identify the primary emotion, relevant keywords, and provide a brief summary.
Respond ONLY with valid JSON in this exact format:
{
  "emotion": "the primary emotion (e.g., calm, happy, anxious, sad, peaceful, excited, frustrated)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "A brief one-sentence summary of the user's emotional state"
}`
          },
          {
            role: 'user',
            content: `Analyze this journal entry:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Ensure correct structure
      const result = {
        emotion: analysis.emotion || 'neutral',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        summary: analysis.summary || 'Analysis completed'
      };

      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

      return result;
    } catch (error) {
      console.error('LLM Analysis Error:', error);
      const fallback = this.buildFallbackAnalysis(text);
      return fallback;
    }
  }

  /**
   * Health check for LLM service
   */
  async healthCheck() {
    try {
      if (!this.hasWorkingApiKey()) {
        return { status: 'unconfigured', message: 'OPENAI_API_KEY not set' };
      }
      return { status: 'healthy', model: this.model };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = new LLMService();
