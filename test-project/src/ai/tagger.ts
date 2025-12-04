import OpenAI from 'openai';

export class NoteTagger {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async suggestTags(content: string, maxTags: number = 5): Promise<string[]> {
    if (!content.trim()) {
      return [];
    }

    try {
      const tags = await this.callOpenAI(content, maxTags);
      return tags;
    } catch (error) {
      throw new Error(`Failed to suggest tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callOpenAI(content: string, maxTags: number): Promise<string[]> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that suggests relevant tags for text content.
          Analyze the content and suggest up to ${maxTags} relevant tags.
          Return tags as a comma-separated list.
          Tags should be lowercase, concise, and descriptive.
          Examples: programming, javascript, tutorial, debugging, web-development`,
        },
        {
          role: 'user',
          content: `Suggest tags for this content:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content?.trim() || '';
    return response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, maxTags);
  }
}
