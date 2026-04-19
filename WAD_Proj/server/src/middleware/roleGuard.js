/**
 * Factory that returns middleware restricting access to the given roles.
 * Usage: roleGuard('admin', 'farmer')
 */
const roleGuard = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

module.exports = roleGuard;
