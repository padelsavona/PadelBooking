import { describe, expect, it } from 'vitest';
import { normalizeBase } from './api';

// re-exported for tests

// sanitize import because api.ts previously had export

describe('normalizeBase', () => {
  it('leaves "/api" alone', () => {
    expect(normalizeBase('/api')).toBe('/api');
    expect(normalizeBase('/api/')).toBe('/api');
  });

  it('prepends https:// to hostnames', () => {
    expect(normalizeBase('example.com')).toBe('https://example.com/api');
    expect(normalizeBase('example.com/')).toBe('https://example.com/api');
  });

  it('does not double-add /api when already present', () => {
    expect(normalizeBase('https://foo.bar/api')).toBe('https://foo.bar/api');
    expect(normalizeBase('https://foo.bar/api/')).toBe('https://foo.bar/api');
  });

  it('preserves full URL paths that are more than "/"', () => {
    expect(normalizeBase('https://foo.bar/v1')).toBe('https://foo.bar/v1');
  });

  it('handles IRL messy values gracefully', () => {
    expect(normalizeBase('http://localhost:8000')).toBe('http://localhost:8000/api');
  });
});
