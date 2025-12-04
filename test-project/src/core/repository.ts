import Database from 'better-sqlite3';
import type { Note } from './note';

export class NoteRepository {
  private db: Database.Database;

  constructor(dbPath: string = './notes.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  save(note: Note): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO notes (id, title, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      note.id,
      note.title,
      note.content,
      JSON.stringify(note.tags),
      note.createdAt.getTime(),
      note.updatedAt.getTime()
    );
  }

  findById(id: string): Note | undefined {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE id = ?');
    const row = stmt.get(id) as NoteRow | undefined;
    return row ? this.rowToNote(row) : undefined;
  }

  findAll(): Note[] {
    const stmt = this.db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
    const rows = stmt.all() as NoteRow[];
    return rows.map(row => this.rowToNote(row));
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  findByTag(tag: string): Note[] {
    const allNotes = this.findAll();
    return allNotes.filter(note => note.tags.includes(tag));
  }

  close(): void {
    this.db.close();
  }

  private rowToNote(row: NoteRow): Note {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: number;
  updated_at: number;
}
