// src/routes/transfer.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transferController = require('../controllers/transfer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

// Validation rules
const transferValidation = [
  body('from_account_id').isInt().withMessage('Valid from account ID is required'),
  body('to_account_id').isInt().withMessage('Valid to account ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString().trim(),
  body('reference').optional().isString().trim(),
  body('pin').isString().isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
];

// Routes
router.post(
  '/',
  authenticate,
  transferValidation,
  validate,
  transferController.createTransfer
);

router.get(
  '/',
  authenticate,
  transferController.getTransfers
);

router.get(
  '/:id',
  authenticate,
  transferController.getTransferById
);

router.get(
  '/recent',
  authenticate,
  transferController.getRecentTransfers
);

module.exports = router;