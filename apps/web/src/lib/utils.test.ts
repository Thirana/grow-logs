import { cn } from './utils';

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('merges conflicting tailwind classes — last one wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional class objects', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold');
  });

  it('handles conditional arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('returns empty string when given no truthy inputs', () => {
    expect(cn(false, undefined, null)).toBe('');
  });
});
