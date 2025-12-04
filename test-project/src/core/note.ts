import { randomUUID } from 'crypto';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function createNote(
  title: string,
  content: string,
  tags: string[] = []
): Note {
  const now = new Date();
  return {
    id: randomUUID(),
    title,
    content,
    tags,
    createdAt: now,
    updatedAt: now,
  };
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  tags?: string[];
}

export function updateNote(note: Note, updates: NoteUpdate): Note {
  return {
    ...note,
    ...updates,
    updatedAt: new Date(),
  };
}
