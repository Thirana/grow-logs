// Tests for route protection middleware — covers all redirect and pass-through cases.
// Used by: src/middleware.ts
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function makeRequest(path: string, hasCookie = false): NextRequest {
  const url = `http://localhost:3001${path}`;
  const headers = hasCookie ? { cookie: '_gl_session=1' } : undefined;
  return new NextRequest(url, headers ? { headers } : undefined);
}

describe('middleware — unauthenticated user', () => {
  it('redirects /dashboard to /login with ?next=/dashboard', () => {
    const res = middleware(makeRequest('/dashboard'));
    expect(res.headers.get('location')).toMatch(/\/login\?next=%2Fdashboard/);
  });

  it('redirects /categories to /login with the correct ?next= value', () => {
    const res = middleware(makeRequest('/categories'));
    expect(res.headers.get('location')).toMatch(/\/login\?next=%2Fcategories/);
  });

  it('redirects /onboarding to /login', () => {
    const res = middleware(makeRequest('/onboarding'));
    expect(res.headers.get('location')).toMatch(/\/login/);
  });

  it('allows /login through', () => {
    const res = middleware(makeRequest('/login'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /register through', () => {
    const res = middleware(makeRequest('/register'));
    expect(res.headers.get('location')).toBeNull();
  });
});

describe('middleware — authenticated user', () => {
  it('redirects /login to /dashboard', () => {
    const res = middleware(makeRequest('/login', true));
    expect(res.headers.get('location')).toMatch(/\/dashboard/);
  });

  it('redirects /register to /dashboard', () => {
    const res = middleware(makeRequest('/register', true));
    expect(res.headers.get('location')).toMatch(/\/dashboard/);
  });

  it('allows /dashboard through', () => {
    const res = middleware(makeRequest('/dashboard', true));
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /categories through', () => {
    const res = middleware(makeRequest('/categories', true));
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /entries through', () => {
    const res = middleware(makeRequest('/entries', true));
    expect(res.headers.get('location')).toBeNull();
  });
});
