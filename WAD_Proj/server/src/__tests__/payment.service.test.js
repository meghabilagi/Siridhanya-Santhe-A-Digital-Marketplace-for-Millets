// Feature: siridhanya-santhe, Property 26: Payment simulation generates unique transaction IDs

const fc = require('fast-check');
const { simulate } = require('../services/payment.service');

// ── Unit tests ────────────────────────────────────────────────────────────────

describe('payment.service.simulate', () => {
  it('returns { status: "failed" } when forceFailure is true', () => {
    const result = simulate({ forceFailure: true });
    expect(result).toEqual({ status: 'failed' });
  });

  it('returns { status: "success", transactionId } when forceFailure is false', () => {
    const result = simulate({ forceFailure: false });
    expect(result.status).toBe('success');
    expect(typeof result.transactionId).toBe('string');
    expect(result.transactionId.length).toBeGreaterThan(0);
  });

  it('returns success by default when no argument is passed', () => {
    const result = simulate();
    expect(result.status).toBe('success');
    expect(typeof result.transactionId).toBe('string');
  });

  it('does not include transactionId on failure', () => {
    const result = simulate({ forceFailure: true });
    expect(result.transactionId).toBeUndefined();
  });
});

// ── Property 26: Payment simulation generates unique transaction IDs ──────────
// Validates: Requirements 8.2

describe('Property 26: Payment simulation generates unique transaction IDs', () => {
  it('all successful simulations produce distinct transactionIds', () => {
    // Feature: siridhanya-santhe, Property 26: Payment simulation generates unique transaction IDs
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const ids = Array.from({ length: n }, () => simulate().transactionId);
          const unique = new Set(ids);
          return unique.size === n;
        }
      ),
      { numRuns: 100 }
    );
  });
});
