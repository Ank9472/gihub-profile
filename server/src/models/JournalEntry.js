const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  ambience: {
    type: String,
    enum: ['forest', 'ocean', 'mountain'],
    required: [true, 'Ambience is required']
  },
  text: {
    type: String,
    required: [true, 'Text content is required'],
    trim: true,
    maxlength: [10000, 'Text cannot exceed 10000 characters']
  },
  analysis: {
    emotion: {
      type: String,
      default: null
    },
    keywords: [{
      type: String
    }],
    summary: {
      type: String,
      default: null
    },
    analyzedAt: {
      type: Date,
      default: null
    }
  },
  isAnalyzed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
journalEntrySchema.index({ userId: 1, createdAt: -1 });
journalEntrySchema.index({ userId: 1, ambience: 1 });

// Static method to get insights for a user
journalEntrySchema.statics.getInsights = async function(userId) {
  const entries = await this.find({ userId });
  
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      topEmotion: null,
      mostUsedAmbience: null,
      recentKeywords: []
    };
  }

  // Count emotions
  const emotionCounts = {};
  entries.forEach(entry => {
    if (entry.analysis?.emotion) {
      emotionCounts[entry.analysis.emotion] = (emotionCounts[entry.analysis.emotion] || 0) + 1;
    }
  });

  // Count ambiences
  const ambienceCounts = {};
  entries.forEach(entry => {
    ambienceCounts[entry.ambience] = (ambienceCounts[entry.ambience] || 0) + 1;
  });

  // Get recent keywords from last 5 analyzed entries
  const recentAnalyzed = entries
    .filter(e => e.isAnalyzed && e.analysis?.keywords?.length > 0)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  const keywordSet = new Set();
  recentAnalyzed.forEach(entry => {
    entry.analysis.keywords.forEach(kw => keywordSet.add(kw));
  });

  // Find top emotion and ambience
  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const mostUsedAmbience = Object.entries(ambienceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalEntries: entries.length,
    topEmotion,
    mostUsedAmbience,
    recentKeywords: Array.from(keywordSet).slice(0, 10)
  };
};

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

module.exports = JournalEntry;
