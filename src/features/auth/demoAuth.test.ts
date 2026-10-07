import { describe, expect, it } from 'vitest';
import { authenticateDemoClient } from './demoAuth';

describe('demo client authentication', () => {
  it('accepts the fictional account case-insensitively', () => {
    expect(authenticateDemoClient(' MEMBER@DEMO.INVALID ', 'demo123')).toEqual({
      account: 'member@demo.invalid',
      displayName: 'Alex Morgan'
    });
  });

  it('rejects an incorrect passcode or unknown account', () => {
    expect(authenticateDemoClient('member@demo.invalid', 'wrong')).toBeNull();
    expect(authenticateDemoClient('other@demo.invalid', 'demo123')).toBeNull();
  });
});
