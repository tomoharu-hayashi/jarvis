import OpenAI from 'openai';
import type { Note } from '../core/note';

export class RelatedNoteFinder {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async findRelated(currentNote: Note, allNotes: Note[], maxResults: number = 5): Promise<Note[]> {
    const otherNotes = allNotes.filter(n => n.id !== currentNote.id);

    if (otherNotes.length === 0) {
      return [];
    }

    const similarities: Array<{ note: Note; score: number }> = [];

    for (const note of otherNotes) {
      const score = await this.calculateSimilarity(currentNote, note);
      similarities.push({ note, score });
    }

    similarities.sort((a, b) => b.score - a.score);

    return similarities
      .filter(s => s.score > 0.3)
      .slice(0, maxResults)
      .map(s => s.note);
  }

  private async calculateSimilarity(note1: Note, note2: Note): Promise<number> {
    let score = 0;

    const commonTags = note1.tags.filter(tag => note2.tags.includes(tag));
    score += commonTags.length * 0.3;

    const words1 = new Set(note1.content.toLowerCase().split(/\s+/));
    const words2 = new Set(note2.content.toLowerCase().split(/\s+/));
    const commonWords = Array.from(words1).filter(word => words2.has(word) && word.length > 3);
    score += Math.min(commonWords.length * 0.05, 0.5);

    return Math.min(score, 1.0);
  }
}
