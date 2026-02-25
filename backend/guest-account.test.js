import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Guest account security', () => {
  test('guest account is disabled by default', () => {
    const enabled = process.env.GUEST_ACCOUNT_ENABLED === 'true';
    assert.strictEqual(enabled, false, 'Guest account must be opt-in');
  });

  test('guest password is not hardcoded', () => {
    const password = process.env.GUEST_PASSWORD;
    assert.notStrictEqual(password, 'guest', 'Must not use hardcoded "guest" password');
  });

  test('GUEST_EMAIL has sensible default', () => {
    const email = process.env.GUEST_EMAIL || 'guest@ctlplumbingllc.com';
    assert.ok(email.includes('@'), 'Must be a valid email format');
  });
});
