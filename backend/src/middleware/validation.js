import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

export const adminValidators = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('rememberMe must be boolean'),
    validate,
  ],
  
  changePassword: [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
    validate,
  ],
};

export const videoValidators = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('category')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be less than 5000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Each tag must be less than 50 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'unlisted', 'archived'])
      .withMessage('Invalid status'),
    body('visibility')
      .optional()
      .isIn(['public', 'private', 'subscribers', 'premium'])
      .withMessage('Invalid visibility'),
    body('ageRating')
      .optional()
      .isIn(['G', 'PG', 'PG-13', 'R', 'NC-17'])
      .withMessage('Invalid age rating'),
    body('language')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Language code too long'),
    body('season')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Season must be a positive integer'),
    body('episode')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Episode must be a positive integer'),
    body('series')
      .optional()
      .isMongoId()
      .withMessage('Invalid series ID'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be boolean'),
    body('isPremium')
      .optional()
      .isBoolean()
      .withMessage('isPremium must be boolean'),
    body('allowComments')
      .optional()
      .isBoolean()
      .withMessage('allowComments must be boolean'),
    body('allowEmbedding')
      .optional()
      .isBoolean()
      .withMessage('allowEmbedding must be boolean'),
    body('allowDownload')
      .optional()
      .isBoolean()
      .withMessage('allowDownload must be boolean'),
    body('seoTitle')
      .optional()
      .trim()
      .isLength({ max: 70 })
      .withMessage('SEO title must be less than 70 characters'),
    body('seoDescription')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('SEO description must be less than 160 characters'),
    validate,
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid video ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be less than 5000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'processing', 'published', 'unlisted', 'archived'])
      .withMessage('Invalid status'),
    body('visibility')
      .optional()
      .isIn(['public', 'private', 'subscribers', 'premium'])
      .withMessage('Invalid visibility'),
    body('ageRating')
      .optional()
      .isIn(['G', 'PG', 'PG-13', 'R', 'NC-17'])
      .withMessage('Invalid age rating'),
    body('language')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Language code too long'),
    body('season')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Season must be a positive integer'),
    body('episode')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Episode must be a positive integer'),
    body('series')
      .optional()
      .isMongoId()
      .withMessage('Invalid series ID'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be boolean'),
    body('isPremium')
      .optional()
      .isBoolean()
      .withMessage('isPremium must be boolean'),
    body('allowComments')
      .optional()
      .isBoolean()
      .withMessage('allowComments must be boolean'),
    body('allowEmbedding')
      .optional()
      .isBoolean()
      .withMessage('allowEmbedding must be boolean'),
    body('allowDownload')
      .optional()
      .isBoolean()
      .withMessage('allowDownload must be boolean'),
    validate,
  ],
  
  getList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('status')
      .optional()
      .isIn(['draft', 'processing', 'published', 'unlisted', 'archived', 'all'])
      .withMessage('Invalid status'),
    query('sort')
      .optional()
      .isIn(['-createdAt', 'createdAt', '-publishedAt', 'publishedAt', '-viewCount', 'viewCount', 'title', '-title'])
      .withMessage('Invalid sort parameter'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search query too long'),
    validate,
  ],
  
  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid video ID'),
    validate,
  ],
  
  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid video ID'),
    validate,
  ],
  
  upload: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('category')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('tags')
      .optional()
      .customSanitizer(value => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(t => t.trim()).filter(Boolean);
        return [];
      }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be less than 5000 characters'),
    validate,
  ],
};

export const categoryValidators = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be less than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('parent')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    body('icon')
      .optional()
      .trim(),
    body('iconColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Icon color must be a valid hex color'),
    body('gradient')
      .optional()
      .trim(),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a positive integer'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be boolean'),
    body('showOnHomepage')
      .optional()
      .isBoolean()
      .withMessage('showOnHomepage must be boolean'),
    validate,
  ],
  
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid category ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be less than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
    body('parent')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    body('icon')
      .optional()
      .trim(),
    body('iconColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Icon color must be a valid hex color'),
    body('gradient')
      .optional()
      .trim(),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a positive integer'),
    body('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be boolean'),
    body('showOnHomepage')
      .optional()
      .isBoolean()
      .withMessage('showOnHomepage must be boolean'),
    validate,
  ],
  
  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid category ID'),
    validate,
  ],
  
  getList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('parent')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be boolean'),
    query('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured must be boolean'),
    validate,
  ],
};

export const siteSettingsValidators = {
  update: [
    body('siteName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Site name must be less than 100 characters'),
    body('siteDescription')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Site description must be less than 300 characters'),
    body('siteUrl')
      .optional()
      .isURL()
      .withMessage('Site URL must be a valid URL'),
    body('primaryColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Primary color must be a valid hex color'),
    body('secondaryColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Secondary color must be a valid hex color'),
    body('contactEmail')
      .optional()
      .isEmail()
      .withMessage('Contact email must be valid'),
    body('adsenseClientId')
      .optional()
      .trim(),
    body('adsenseSlots')
      .optional()
      .isObject()
      .withMessage('AdSense slots must be an object'),
    validate,
  ],
};

export const searchValidators = {
  query: query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query is required and must be less than 100 characters'),
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  category: query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  tags: query('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  sort: query('sort')
    .optional()
    .isIn(['relevance', '-publishedAt', 'publishedAt', '-viewCount', 'viewCount', '-likeCount', 'likeCount'])
    .withMessage('Invalid sort parameter'),
  validate,
};