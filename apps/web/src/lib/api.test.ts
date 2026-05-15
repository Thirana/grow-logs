import { setAccessToken, getAccessToken, clearAccessToken } from './api';

describe('access token helpers', () => {
  afterEach(() => {
    clearAccessToken();
  });

  it('returns null before any token is set', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setAccessToken('my-jwt-token');
    expect(getAccessToken()).toBe('my-jwt-token');
  });

  it('clears the stored token', () => {
    setAccessToken('my-jwt-token');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('overwrites a previously stored token', () => {
    setAccessToken('token-a');
    setAccessToken('token-b');
    expect(getAccessToken()).toBe('token-b');
  });
});
