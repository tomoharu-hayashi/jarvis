import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteTagger } from './tagger';

describe('NoteTagger', () => {
  let tagger: NoteTagger;

  beforeEach(() => {
    tagger = new NoteTagger('test-api-key');
  });

  it('should create tagger instance', () => {
    expect(tagger).toBeDefined();
  });

  it('suggests tags structure', async () => {
    const mockTags = ['programming', 'typescript', 'testing'];

    vi.spyOn(tagger as any, 'callOpenAI').mockResolvedValue(mockTags);

    const content = 'This is about TypeScript programming and testing';
    const tags = await tagger.suggestTags(content);

    expect(Array.isArray(tags)).toBe(true);
    expect(tags).toEqual(mockTags);
  });
});
