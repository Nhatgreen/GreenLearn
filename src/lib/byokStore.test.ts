import { describe, it, expect, beforeEach } from 'vitest';
import { ByokStore } from './byokStore';

describe('ByokStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets, gets and checks presence of BYOK keys', () => {
    expect(ByokStore.has('openai')).toBe(false);
    expect(ByokStore.get('openai')).toBeNull();

    ByokStore.set('openai', 'sk-test-12345');
    expect(ByokStore.has('openai')).toBe(true);
    expect(ByokStore.get('openai')).toBe('sk-test-12345');
  });

  it('clears stored keys', () => {
    ByokStore.set('gemini', 'AIzaSyTest');
    expect(ByokStore.has('gemini')).toBe(true);

    ByokStore.clear('gemini');
    expect(ByokStore.has('gemini')).toBe(false);
    expect(ByokStore.get('gemini')).toBeNull();
  });

  it('correctly masks API keys for display', () => {
    expect(ByokStore.mask('')).toBe('');
    expect(ByokStore.mask(null)).toBe('');
    expect(ByokStore.mask('12345')).toBe('••••••••');
    expect(ByokStore.mask('sk-proj-1234567890abcdefXYZ9')).toBe('sk-proj-••••••••••••XYZ9');
    expect(ByokStore.mask('sk-abcdef1234567890wxyz')).toBe('sk-••••••••wxyz');
    expect(ByokStore.mask('my_custom_api_key_1234')).toBe('my_••••••••1234');
  });
});
