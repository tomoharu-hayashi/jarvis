import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteSummarizer } from './summarizer';

describe('NoteSummarizer', () => {
  let summarizer: NoteSummarizer;

  beforeEach(() => {
    summarizer = new NoteSummarizer('test-api-key');
  });

  it('should create summarizer instance', () => {
    expect(summarizer).toBeDefined();
  });

  // 実際のAPI呼び出しはモック化してテスト
  it('generates summary structure', async () => {
    const mockSummary = 'This is a test summary';

    vi.spyOn(summarizer as any, 'callOpenAI').mockResolvedValue(mockSummary);

    const content = 'Long content that needs to be summarized';
    const summary = await summarizer.summarize(content);

    expect(summary).toBe(mockSummary);
  });
});
