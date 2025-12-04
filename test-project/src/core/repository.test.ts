import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoteRepository } from './repository';
import { createNote } from './note';
import { unlink } from 'fs/promises';

const TEST_DB = './test-notes.db';

describe('NoteRepository', () => {
  let repo: NoteRepository;

  beforeEach(() => {
    repo = new NoteRepository(TEST_DB);
  });

  afterEach(async () => {
    repo.close();
    try {
      await unlink(TEST_DB);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  describe('save', () => {
    it('saves a new note', () => {
      const note = createNote('Test Title', 'Test content', ['tag1']);
      repo.save(note);

      const retrieved = repo.findById(note.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Title');
      expect(retrieved?.content).toBe('Test content');
      expect(retrieved?.tags).toEqual(['tag1']);
    });

    it('updates an existing note', () => {
      const note = createNote('Original', 'Content');
      repo.save(note);

      note.title = 'Updated';
      repo.save(note);

      const retrieved = repo.findById(note.id);
      expect(retrieved?.title).toBe('Updated');
    });
  });

  describe('findById', () => {
    it('returns note if found', () => {
      const note = createNote('Test', 'Content');
      repo.save(note);

      const found = repo.findById(note.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(note.id);
    });

    it('returns undefined if not found', () => {
      const found = repo.findById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns all notes', () => {
      const note1 = createNote('Note 1', 'Content 1');
      const note2 = createNote('Note 2', 'Content 2');

      repo.save(note1);
      repo.save(note2);

      const all = repo.findAll();
      expect(all).toHaveLength(2);
      expect(all.map(n => n.id)).toContain(note1.id);
      expect(all.map(n => n.id)).toContain(note2.id);
    });

    it('returns empty array when no notes exist', () => {
      const all = repo.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes a note', () => {
      const note = createNote('Test', 'Content');
      repo.save(note);

      const deleted = repo.delete(note.id);
      expect(deleted).toBe(true);

      const found = repo.findById(note.id);
      expect(found).toBeUndefined();
    });

    it('returns false if note does not exist', () => {
      const deleted = repo.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('findByTag', () => {
    it('returns notes with specified tag', () => {
      const note1 = createNote('Note 1', 'Content', ['tag1', 'tag2']);
      const note2 = createNote('Note 2', 'Content', ['tag2', 'tag3']);
      const note3 = createNote('Note 3', 'Content', ['tag3']);

      repo.save(note1);
      repo.save(note2);
      repo.save(note3);

      const found = repo.findByTag('tag2');
      expect(found).toHaveLength(2);
      expect(found.map(n => n.id)).toContain(note1.id);
      expect(found.map(n => n.id)).toContain(note2.id);
    });

    it('returns empty array if no notes have the tag', () => {
      const note = createNote('Test', 'Content', ['other-tag']);
      repo.save(note);

      const found = repo.findByTag('non-existent-tag');
      expect(found).toEqual([]);
    });
  });
});
