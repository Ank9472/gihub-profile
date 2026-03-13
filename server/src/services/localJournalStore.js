const { randomUUID } = require('crypto');

class LocalJournalStore {
  constructor() {
    this.entries = [];
  }

  createEntry({ userId, ambience, text }) {
    const now = new Date();
    const entry = {
      _id: randomUUID(),
      userId,
      ambience,
      text,
      analysis: null,
      isAnalyzed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.unshift(entry);
    return { ...entry };
  }

  getEntriesByUser(userId) {
    return this.entries
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .map((entry) => ({ ...entry }));
  }

  getEntryById(entryId) {
    const entry = this.entries.find((item) => item._id === entryId);
    return entry ? { ...entry } : null;
  }

  saveAnalysis(entryId, analysis) {
    const entry = this.entries.find((item) => item._id === entryId);
    if (!entry) {
      return null;
    }

    entry.analysis = {
      emotion: analysis.emotion,
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
      summary: analysis.summary,
      analyzedAt: new Date(),
    };
    entry.isAnalyzed = true;
    entry.updatedAt = new Date();

    return { ...entry };
  }

  getInsights(userId) {
    const entries = this.getEntriesByUser(userId);

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        topEmotion: null,
        mostUsedAmbience: null,
        recentKeywords: [],
      };
    }

    const emotionCounts = {};
    const ambienceCounts = {};
    const keywords = new Set();

    entries.forEach((entry) => {
      ambienceCounts[entry.ambience] = (ambienceCounts[entry.ambience] || 0) + 1;

      if (entry.analysis?.emotion) {
        emotionCounts[entry.analysis.emotion] = (emotionCounts[entry.analysis.emotion] || 0) + 1;
      }

      if (entry.analysis?.keywords) {
        entry.analysis.keywords.forEach((keyword) => keywords.add(keyword));
      }
    });

    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const mostUsedAmbience = Object.entries(ambienceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalEntries: entries.length,
      topEmotion,
      mostUsedAmbience,
      recentKeywords: Array.from(keywords).slice(0, 10),
    };
  }
}

module.exports = new LocalJournalStore();