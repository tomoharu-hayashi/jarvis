import OpenAI from 'openai';

export class NoteSummarizer {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarize(content: string, maxLength: number = 100): Promise<string> {
    if (!content.trim()) {
      return '';
    }

    try {
      const response = await this.callOpenAI(content, maxLength);
      return response;
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callOpenAI(content: string, maxLength: number): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that creates concise summaries.
          Summarize the given text in ${maxLength} characters or less.
          Focus on the main points and key information.`,
        },
        {
          role: 'user',
          content: `Summarize this text:\n\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  }
}
