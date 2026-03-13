const JournalEntry = require('../models/JournalEntry');
const llmService = require('../services/llmService');
const cacheService = require('../services/cacheService');

/**
 * Create a new journal entry
 */
exports.createEntry = async (req, res, next) => {
  try {
    const { title, content, mood, tags } = req.body;
    const userId = req.user.id;

    const entry = new JournalEntry({
      userId,
      title,
      content,
      mood: mood || 'neutral',
      tags: tags || []
    });

    await entry.save();

    // Invalidate user's cache
    await cacheService.invalidateUserCache(userId);

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all entries for the authenticated user
 */
exports.getEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      mood,
      tags,
      startDate,
      endDate,
      isAnalyzed
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      mood,
      tags: tags ? tags.split(',') : undefined,
      startDate,
      endDate,
      isAnalyzed: isAnalyzed === 'true' ? true : isAnalyzed === 'false' ? false : undefined
    };

    const result = await JournalEntry.findByUser(userId, options);

    res.json({
      success: true,
      data: result.entries,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single entry by ID
 */
exports.getEntry = async (req, res, next) => {
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

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a journal entry
 */
exports.updateEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, mood, tags } = req.body;

    const entry = await JournalEntry.findOne({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Update fields
    if (title) entry.title = title;
    if (content) {
      entry.content = content;
      entry.isAnalyzed = false; // Reset analysis status when content changes
      entry.insights = {}; // Clear previous insights
    }
    if (mood) entry.mood = mood;
    if (tags) entry.tags = tags;

    await entry.save();

    // Invalidate cache
    await cacheService.invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a journal entry
 */
exports.deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await JournalEntry.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Invalidate cache
    await cacheService.invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search journal entries
 */
exports.searchEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await JournalEntry.find(
      {
        userId,
        $text: { $search: q }
      },
      {
        score: { $meta: 'textScore' }
      }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JournalEntry.countDocuments({
      userId,
      $text: { $search: q }
    });

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mood statistics
 */
exports.getMoodStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const stats = await JournalEntry.getMoodStats(userId, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze a journal entry with AI
 */
exports.analyzeEntry = async (req, res, next) => {
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

    // Generate AI insights
    const insights = await llmService.analyzeEntry(entry);

    // Update entry with insights
    entry.insights = insights;
    entry.isAnalyzed = true;
    await entry.save();

    res.json({
      success: true,
      message: 'Entry analyzed successfully',
      data: {
        entry,
        insights
      }
    });
  } catch (error) {
    next(error);
  }
};
