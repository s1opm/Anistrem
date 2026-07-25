import { body, param, query, validationResult } from 'express-validator';

export function validate(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  };
}

export const adminValidators = {
  login: validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isString(),
  ]),

  changePassword: validate([
    body('currentPassword')
      .notEmpty().withMessage('Current password is required')
      .isString(),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
};

export const videoValidators = {
  create: validate([
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
    body('categoryId')
      .optional()
      .isString().withMessage('Category ID must be a string'),
    body('description')
      .optional()
      .isString(),
  ]),

  update: validate([
    param('id')
      .notEmpty().withMessage('Video ID is required'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
    body('categoryId')
      .optional()
      .isString().withMessage('Category ID must be a string'),
  ]),

  getList: validate([
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
  ]),

  getById: validate([
    param('id')
      .notEmpty().withMessage('Video ID is required'),
  ]),

  delete: validate([
    param('id')
      .notEmpty().withMessage('Video ID is required'),
  ]),

  upload: validate([
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
    body('categoryId')
      .optional()
      .isString().withMessage('Category ID must be a string'),
  ]),
};

export const categoryValidators = {
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Category name is required')
      .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  ]),

  update: validate([
    param('id')
      .notEmpty().withMessage('Category ID is required'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  ]),

  delete: validate([
    param('id')
      .notEmpty().withMessage('Category ID is required'),
  ]),

  getList: validate([
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
  ]),
};

export const siteSettingsValidators = validate([
  body('key')
    .trim()
    .notEmpty().withMessage('Setting key is required')
    .isString()
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Key must be alphanumeric with dots, underscores, or hyphens'),
  body('value')
    .notEmpty().withMessage('Setting value is required'),
]);

export const searchValidators = validate([
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
]);
