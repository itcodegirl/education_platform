import { describe, it, expect } from 'vitest';
import { normalizePayload } from './useAdminAuditLog';

describe('normalizePayload', () => {
  it('returns empty rows and total 0 for null input', () => {
    const result = normalizePayload(null);
    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns empty rows for undefined input', () => {
    expect(normalizePayload(undefined).rows).toEqual([]);
  });

  it('parses a JSON string payload', () => {
    const payload = JSON.stringify({ rows: [{ id: 1 }], total: 1 });
    const result = normalizePayload(payload);
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('accepts an object payload directly', () => {
    const result = normalizePayload({ rows: [{ id: 1 }], total: 5 });
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(5);
  });

  it('uses rows.length as total when total is absent', () => {
    const result = normalizePayload({ rows: [{ id: 1 }, { id: 2 }] });
    expect(result.total).toBe(2);
  });

  it('normalizes actorName from actor_name', () => {
    const result = normalizePayload({
      rows: [{ id: 1, actor_name: 'Alice' }],
      total: 1,
    });
    expect(result.rows[0].actorName).toBe('Alice');
  });

  it('normalizes targetName from target_name', () => {
    const result = normalizePayload({
      rows: [{ id: 1, target_name: 'Bob' }],
      total: 1,
    });
    expect(result.rows[0].targetName).toBe('Bob');
  });

  it('prefers actorName over actor_name when both present', () => {
    const result = normalizePayload({
      rows: [{ id: 1, actorName: 'Carol', actor_name: 'Dave' }],
      total: 1,
    });
    expect(result.rows[0].actorName).toBe('Carol');
  });

  it('sets actorName and targetName to empty string when absent', () => {
    const result = normalizePayload({ rows: [{ id: 1 }], total: 1 });
    expect(result.rows[0].actorName).toBe('');
    expect(result.rows[0].targetName).toBe('');
  });

  it('falls back to empty rows when payload.rows is not an array', () => {
    const result = normalizePayload({ rows: 'invalid', total: 0 });
    expect(result.rows).toEqual([]);
  });
});
