const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Process validation results and return errors if any
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validate journal entry create/update
 */
const validateJournalEntry = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50000 characters'),
  
  body('mood')
    .optional()
    .isIn(['very_negative', 'negative', 'neutral', 'positive', 'very_positive'])
    .withMessage('Invalid mood value'),
  
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Tags must be an array with max 20 items'),
  
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  
  handleValidationErrors
];

/**
 * Validate MongoDB ObjectId parameter
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${paramName} format`);
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Validate pagination query parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'mood'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * Validate search query
 */
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validate date range
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('startDate').custom((value, { req }) => {
    if (value && req.query.endDate) {
      if (new Date(value) > new Date(req.query.endDate)) {
        throw new Error('Start date must be before end date');
      }
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validate batch analysis request
 */
const validateBatchAnalysis = [
  body('entryIds')
    .isArray({ min: 1, max: 10 })
    .withMessage('Entry IDs must be an array with 1-10 items'),
  
  body('entryIds.*')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid entry ID format');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  // Basic XSS prevention - escape HTML entities
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};

module.exports = {
  validateJournalEntry,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateBatchAnalysis,
  sanitizeInput,
  handleValidationErrors
};
