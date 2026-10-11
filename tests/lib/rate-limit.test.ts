import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, _resetRateLimitStore } from '@/lib/rate-limit';

describe('rate-limit utility per PRD §8.1', () => {
  beforeEach(() => {
    _resetRateLimitStore();
  });

  it('allows requests within the limit', () => {
    const res1 = rateLimit({ key: 'test:user1', limit: 3, windowMs: 10000 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = rateLimit({ key: 'test:user1', limit: 3, windowMs: 10000 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = rateLimit({ key: 'test:user1', limit: 3, windowMs: 10000 });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit({ key: 'test:blocked', limit: 3, windowMs: 10000 });
    }

    const blocked = rateLimit({ key: 'test:blocked', limit: 3, windowMs: 10000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks different keys independently', () => {
    rateLimit({ key: 'userA', limit: 1, windowMs: 10000 });
    const blockedA = rateLimit({ key: 'userA', limit: 1, windowMs: 10000 });
    expect(blockedA.success).toBe(false);

    const allowedB = rateLimit({ key: 'userB', limit: 1, windowMs: 10000 });
    expect(allowedB.success).toBe(true);
  });
});
