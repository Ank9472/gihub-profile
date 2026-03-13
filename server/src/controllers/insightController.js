const JournalEntry = require('../models/JournalEntry');
const llmService = require('../services/llmService');
const cacheService = require('../services/cacheService');

/**
 * Get AI insights for a specific entry
 */
exports.getEntryInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await JournalEntry.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    if (!entry.isAnalyzed || !entry.insights) {
      return res.status(400).json({
        success: false,
        message: 'Entry has not been analyzed yet. Please analyze it first.'
      });
    }

    res.json({
      success: true,
      data: entry.insights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate weekly summary insights
 */
exports.getWeeklySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { weekOffset = 0 } = req.query;

    // Calculate week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Check cache
    const cacheKey = `weekly:${userId}:${startOfWeek.toISOString().split('T')[0]}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get entries for the week
    const entries = await JournalEntry.find({
      userId,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    }).sort({ createdAt: 1 });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No entries found for this week'
      });
    }

    // Generate weekly summary
    const summary = await llmService.generateWeeklySummary(entries);

    // Cache the result
    await cacheService.set(cacheKey, JSON.stringify(summary), 86400); // 24 hours

    res.json({
      success: true,
      data: {
        ...summary,
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        entryCount: entries.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get writing prompts based on recent entries
 */
exports.getWritingPrompts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { count = 3 } = req.query;

    // Check cache first
    const cacheKey = `prompts:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get recent analyzed entries
    const recentEntries = await JournalEntry.find({
      userId,
      isAnalyzed: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    if (recentEntries.length === 0) {
      return res.json({
        success: true,
        data: {
          prompts: [
            'What are you grateful for today?',
            'Describe a recent challenge and how you handled it.',
            'What goals are you working towards this week?'
          ]
        },
        message: 'Default prompts (no analyzed entries yet)'
      });
    }

    const prompts = await llmService.generateWritingPrompts(recentEntries, parseInt(count));

    // Cache for 6 hours
    await cacheService.set(cacheKey, JSON.stringify(prompts), 21600);

    res.json({
      success: true,
      data: prompts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get emotional trends over time
 */
exports.getEmotionalTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await JournalEntry.find({
      userId,
      isAnalyzed: true,
      createdAt: { $gte: startDate }
    })
      .select('createdAt mood insights.emotionalAnalysis')
      .sort({ createdAt: 1 });

    const trends = entries.map(entry => ({
      date: entry.createdAt,
      mood: entry.mood,
      emotion: entry.insights?.emotionalAnalysis?.primaryEmotion || null,
      score: entry.insights?.emotionalAnalysis?.emotionScore || null
    }));

    // Calculate averages and patterns
    const moodCounts = trends.reduce((acc, t) => {
      acc[t.mood] = (acc[t.mood] || 0) + 1;
      return acc;
    }, {});

    const emotionCounts = trends.reduce((acc, t) => {
      if (t.emotion) {
        acc[t.emotion] = (acc[t.emotion] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        trends,
        summary: {
          totalEntries: trends.length,
          moodDistribution: moodCounts,
          emotionDistribution: emotionCounts,
          averageEmotionScore: trends.filter(t => t.score).length > 0
            ? trends.filter(t => t.score).reduce((sum, t) => sum + t.score, 0) / trends.filter(t => t.score).length
            : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get common themes across entries
 */
exports.getThemeAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30, limit = 10 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await JournalEntry.find({
      userId,
      isAnalyzed: true,
      createdAt: { $gte: startDate }
    }).select('insights.themes');

    // Aggregate themes
    const themeMap = {};
    entries.forEach(entry => {
      if (entry.insights?.themes) {
        entry.insights.themes.forEach(t => {
          if (themeMap[t.theme]) {
            themeMap[t.theme].count++;
            themeMap[t.theme].totalConfidence += t.confidence;
          } else {
            themeMap[t.theme] = {
              theme: t.theme,
              count: 1,
              totalConfidence: t.confidence
            };
          }
        });
      }
    });

    // Sort by count and calculate average confidence
    const themes = Object.values(themeMap)
      .map(t => ({
        ...t,
        avgConfidence: t.totalConfidence / t.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        themes,
        totalEntriesAnalyzed: entries.length,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch analyze multiple entries
 */
exports.batchAnalyze = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { entryIds } = req.body;

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entry IDs array is required'
      });
    }

    // Limit batch size
    const maxBatchSize = 10;
    const idsToProcess = entryIds.slice(0, maxBatchSize);

    const entries = await JournalEntry.find({
      _id: { $in: idsToProcess },
      userId,
      isAnalyzed: false
    });

    const results = {
      success: [],
      failed: []
    };

    // Process entries sequentially to avoid rate limiting
    for (const entry of entries) {
      try {
        const insights = await llmService.analyzeEntry(entry);
        entry.insights = insights;
        entry.isAnalyzed = true;
        await entry.save();
        results.success.push(entry._id);
      } catch (error) {
        results.failed.push({
          id: entry._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Analyzed ${results.success.length} entries, ${results.failed.length} failed`
    });
  } catch (error) {
    next(error);
  }
};
