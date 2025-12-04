import { describe, it, expect } from 'vitest';
import { createNote, updateNote } from './note';

describe('Note', () => {
  describe('createNote', () => {
    it('creates a new note with required fields', () => {
      const note = createNote('Test Title', 'Test content');

      expect(note.id).toBeDefined();
      expect(note.title).toBe('Test Title');
      expect(note.content).toBe('Test content');
      expect(note.tags).toEqual([]);
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a note with tags', () => {
      const note = createNote('Test', 'Content', ['tag1', 'tag2']);

      expect(note.tags).toEqual(['tag1', 'tag2']);
    });

    it('generates unique IDs', () => {
      const note1 = createNote('Test1', 'Content1');
      const note2 = createNote('Test2', 'Content2');

      expect(note1.id).not.toBe(note2.id);
    });
  });

  describe('updateNote', () => {
    it('updates note title', () => {
      const note = createNote('Old Title', 'Content');
      const updated = updateNote(note, { title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('Content');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(note.updatedAt.getTime());
    });

    it('updates note content', () => {
      const note = createNote('Title', 'Old Content');
      const updated = updateNote(note, { content: 'New Content' });

      expect(updated.content).toBe('New Content');
      expect(updated.title).toBe('Title');
    });

    it('updates note tags', () => {
      const note = createNote('Title', 'Content', ['old']);
      const updated = updateNote(note, { tags: ['new1', 'new2'] });

      expect(updated.tags).toEqual(['new1', 'new2']);
    });

    it('preserves other fields when updating', () => {
      const note = createNote('Title', 'Content');
      const updated = updateNote(note, { title: 'New Title' });

      expect(updated.id).toBe(note.id);
      expect(updated.createdAt).toEqual(note.createdAt);
    });
  });
});
