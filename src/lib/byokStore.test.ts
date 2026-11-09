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
});
