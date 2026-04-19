const { validationResult } = require('express-validator');

/**
 * Runs express-validator's validationResult and short-circuits with 400
 * if any validation errors are present.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
