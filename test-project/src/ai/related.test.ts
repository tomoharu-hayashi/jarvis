import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RelatedNoteFinder } from './related';
import { createNote } from '../core/note';

describe('RelatedNoteFinder', () => {
  let finder: RelatedNoteFinder;

  beforeEach(() => {
    finder = new RelatedNoteFinder('test-api-key');
  });

  it('should create finder instance', () => {
    expect(finder).toBeDefined();
  });

  it('finds related notes', async () => {
    const notes = [
      createNote('TypeScript Guide', 'Learn TypeScript programming', ['typescript', 'programming']),
      createNote('React Basics', 'Introduction to React', ['react', 'javascript']),
      createNote('Advanced TS', 'Advanced TypeScript features', ['typescript', 'advanced']),
    ];

    const currentNote = createNote('TS Tutorial', 'TypeScript tutorial content', ['typescript']);

    const mockScores = [
      { noteId: notes[0].id, score: 0.85 },
      { noteId: notes[2].id, score: 0.75 },
    ];

    vi.spyOn(finder as any, 'calculateSimilarity').mockImplementation(
      (note1: any, note2: any) => {
        const match = mockScores.find(s => s.noteId === note2.id);
        return match ? match.score : 0.1;
      }
    );

    const related = await finder.findRelated(currentNote, notes, 2);

    expect(related.length).toBeLessThanOrEqual(2);
    expect(related[0].id).toBe(notes[0].id);
  });
});
