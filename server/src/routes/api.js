const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const llmService = require('../services/llmService');
const localJournalStore = require('../services/localJournalStore');
const { isDatabaseConnected } = require('../config/database');
const { apiRateLimiter, analysisRateLimiter } = require('../middleware/rateLimiter');

const shouldUseLocalStore = () => !isDatabaseConnected();

// ===== Journal Entry Routes =====

/**
 * POST /api/journal
 * Create a new journal entry
 * Body: { userId, ambience, text }
 */
router.post('/journal', apiRateLimiter, async (req, res, next) => {
  try {
    const { userId, ambience, text } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!ambience || !['forest', 'ocean', 'mountain'].includes(ambience)) {
      return res.status(400).json({ error: 'ambience must be forest, ocean, or mountain' });
    }
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }

    let entry;
    if (shouldUseLocalStore()) {
      entry = localJournalStore.createEntry({ userId, ambience, text: text.trim() });
    } else {
      entry = new JournalEntry({
        userId,
        ambience,
        text: text.trim()
      });

      await entry.save();
    }

    res.status(201).json({
      message: 'Journal entry created successfully',
      entry: {
        id: entry._id,
        userId: entry.userId,
        ambience: entry.ambience,
        text: entry.text,
        createdAt: entry.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/journal/:userId
 * Get all journal entries for a user
 */
router.get('/journal/:userId', apiRateLimiter, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const entries = shouldUseLocalStore()
      ? localJournalStore.getEntriesByUser(userId)
      : await JournalEntry.find({ userId })
          .sort({ createdAt: -1 })
          .lean();

    res.json({
      userId,
      entries: entries.map(entry => ({
        id: entry._id,
        ambience: entry.ambience,
        text: entry.text,
        isAnalyzed: entry.isAnalyzed,
        analysis: entry.isAnalyzed ? entry.analysis : null,
        createdAt: entry.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/journal/analyze
 * Analyze text using LLM and return emotion analysis
 * Body: { text }
 * Response: { emotion, keywords, summary }
 */
router.post('/journal/analyze', analysisRateLimiter, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Analyze using LLM
    const analysis = await llmService.analyzeText(text.trim());

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/journal/:entryId/analyze
 * Analyze a specific journal entry and save the results
 */
router.post('/journal/:entryId/analyze', analysisRateLimiter, async (req, res, next) => {
  try {
    const { entryId } = req.params;

    const entry = shouldUseLocalStore()
      ? localJournalStore.getEntryById(entryId)
      : await JournalEntry.findById(entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Analyze using LLM
    const analysis = await llmService.analyzeText(entry.text);

    // Save analysis to entry
    if (shouldUseLocalStore()) {
      localJournalStore.saveAnalysis(entryId, analysis);
    } else {
      entry.analysis = {
        emotion: analysis.emotion,
        keywords: analysis.keywords,
        summary: analysis.summary,
        analyzedAt: new Date()
      };
      entry.isAnalyzed = true;
      await entry.save();
    }

    res.json({
      message: 'Entry analyzed successfully',
      analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/journal/insights/:userId
 * Get insights for a user
 * Response: { totalEntries, topEmotion, mostUsedAmbience, recentKeywords }
 */
router.get('/journal/insights/:userId', apiRateLimiter, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const insights = shouldUseLocalStore()
      ? localJournalStore.getInsights(userId)
      : await JournalEntry.getInsights(userId);

    res.json(insights);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
