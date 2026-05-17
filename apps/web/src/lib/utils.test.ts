import axios, { AxiosHeaders } from 'axios';
import { cn, getApiErrorMessage } from './utils';

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

describe('getApiErrorMessage', () => {
  it('returns the message from an Axios error response envelope', () => {
    const error = new axios.AxiosError('Request failed');
    error.response = {
      data: { message: 'Email already registered' },
      status: 409,
      statusText: 'Conflict',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
    expect(getApiErrorMessage(error)).toBe('Email already registered');
  });

  it('returns the generic fallback when the response has no message field', () => {
    const error = new axios.AxiosError('Request failed');
    error.response = {
      data: {},
      status: 500,
      statusText: 'Internal Server Error',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    };
    expect(getApiErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('returns the generic fallback for non-Axios errors', () => {
    expect(getApiErrorMessage(new Error('network error'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getApiErrorMessage('string error')).toBe('Something went wrong. Please try again.');
    expect(getApiErrorMessage(null)).toBe('Something went wrong. Please try again.');
  });
});
