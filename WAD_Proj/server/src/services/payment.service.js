const { randomUUID } = require('crypto');

/**
 * Simulate a payment transaction.
 * @param {Object} options
 * @param {boolean} [options.forceFailure=false] - Force a payment failure
 * @returns {{ status: 'success', transactionId: string } | { status: 'failed' }}
 */
function simulate({ forceFailure = false } = {}) {
  if (forceFailure) {
    return { status: 'failed' };
  }
  return { status: 'success', transactionId: randomUUID() };
}

module.exports = { simulate };
