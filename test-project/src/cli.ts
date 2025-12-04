#!/usr/bin/env node
import { Command } from 'commander';
import { NoteRepository } from './core/repository';
import { createNote, updateNote } from './core/note';
import { NoteSummarizer } from './ai/summarizer';
import { NoteTagger } from './ai/tagger';
import { RelatedNoteFinder } from './ai/related';
import { parseTodosFromMarkdown } from './core/todo';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const repo = new NoteRepository();
const program = new Command();

program
  .name('ai-note')
  .description('Markdown-based note app with AI features')
  .version('0.1.0');

program
  .command('create')
  .description('Create a new note')
  .argument('<title>', 'Note title')
  .option('-c, --content <content>', 'Note content')
  .option('-f, --file <path>', 'Read content from file')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (title: string, options: { content?: string; file?: string; tags?: string }) => {
    let content = options.content || '';

    if (options.file) {
      if (!existsSync(options.file)) {
        console.error(`Error: File not found: ${options.file}`);
        process.exit(1);
      }
      content = await readFile(options.file, 'utf-8');
    }

    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
    const note = createNote(title, content, tags);
    repo.save(note);

    console.log(`Created note: ${note.id}`);
    console.log(`Title: ${note.title}`);
    if (tags.length > 0) {
      console.log(`Tags: ${tags.join(', ')}`);
    }
  });

program
  .command('list')
  .description('List all notes')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action((options: { tag?: string }) => {
    const notes = options.tag ? repo.findByTag(options.tag) : repo.findAll();

    if (notes.length === 0) {
      console.log('No notes found.');
      return;
    }

    console.log(`Found ${notes.length} note(s):\n`);
    notes.forEach(note => {
      console.log(`[${note.id}]`);
      console.log(`  Title: ${note.title}`);
      if (note.tags.length > 0) {
        console.log(`  Tags: ${note.tags.join(', ')}`);
      }
      console.log(`  Updated: ${note.updatedAt.toLocaleString()}`);
      console.log();
    });
  });

program
  .command('show')
  .description('Show a note')
  .argument('<id>', 'Note ID')
  .action((id: string) => {
    const note = repo.findById(id);

    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    console.log(`ID: ${note.id}`);
    console.log(`Title: ${note.title}`);
    console.log(`Tags: ${note.tags.join(', ')}`);
    console.log(`Created: ${note.createdAt.toLocaleString()}`);
    console.log(`Updated: ${note.updatedAt.toLocaleString()}`);
    console.log(`\n---\n`);
    console.log(note.content);
  });

program
  .command('delete')
  .description('Delete a note')
  .argument('<id>', 'Note ID')
  .action((id: string) => {
    const deleted = repo.delete(id);

    if (!deleted) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    console.log(`Deleted note: ${id}`);
  });

program
  .command('edit')
  .description('Edit a note')
  .argument('<id>', 'Note ID')
  .option('-t, --title <title>', 'New title')
  .option('-c, --content <content>', 'New content')
  .option('-f, --file <path>', 'Read content from file')
  .option('--tags <tags>', 'New comma-separated tags')
  .action(async (id: string, options: { title?: string; content?: string; file?: string; tags?: string }) => {
    const note = repo.findById(id);

    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const updates: { title?: string; content?: string; tags?: string[] } = {};

    if (options.title) {
      updates.title = options.title;
    }

    if (options.file) {
      if (!existsSync(options.file)) {
        console.error(`Error: File not found: ${options.file}`);
        process.exit(1);
      }
      updates.content = await readFile(options.file, 'utf-8');
    } else if (options.content) {
      updates.content = options.content;
    }

    if (options.tags) {
      updates.tags = options.tags.split(',').map(t => t.trim());
    }

    const updated = updateNote(note, updates);
    repo.save(updated);

    console.log(`Updated note: ${id}`);
    if (options.title) {
      console.log(`  New title: ${updated.title}`);
    }
    if (options.tags) {
      console.log(`  New tags: ${updated.tags.join(', ')}`);
    }
  });

program
  .command('export')
  .description('Export a note to file')
  .argument('<id>', 'Note ID')
  .argument('<path>', 'Output file path')
  .action(async (id: string, path: string) => {
    const note = repo.findById(id);

    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const markdown = `# ${note.title}

${note.tags.length > 0 ? `**Tags:** ${note.tags.join(', ')}\n` : ''}
**Created:** ${note.createdAt.toLocaleString()}
**Updated:** ${note.updatedAt.toLocaleString()}

---

${note.content}
`;

    await writeFile(path, markdown, 'utf-8');
    console.log(`Exported note to: ${path}`);
  });

program
  .command('summarize')
  .description('Generate AI summary for a note')
  .argument('<id>', 'Note ID')
  .option('-l, --length <length>', 'Maximum summary length', '100')
  .action(async (id: string, options: { length: string }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Error: OPENAI_API_KEY environment variable is not set');
      process.exit(1);
    }

    const note = repo.findById(id);
    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const summarizer = new NoteSummarizer(apiKey);
    console.log('Generating summary...');

    try {
      const summary = await summarizer.summarize(note.content, parseInt(options.length));
      console.log('\nSummary:');
      console.log(summary);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('suggest-tags')
  .description('Suggest tags for a note using AI')
  .argument('<id>', 'Note ID')
  .option('-n, --num <number>', 'Maximum number of tags', '5')
  .option('-a, --apply', 'Apply suggested tags to the note')
  .action(async (id: string, options: { num: string; apply: boolean }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Error: OPENAI_API_KEY environment variable is not set');
      process.exit(1);
    }

    const note = repo.findById(id);
    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const tagger = new NoteTagger(apiKey);
    console.log('Suggesting tags...');

    try {
      const suggestedTags = await tagger.suggestTags(note.content, parseInt(options.num));
      console.log('\nSuggested tags:');
      suggestedTags.forEach(tag => console.log(`  - ${tag}`));

      if (options.apply) {
        const updated = updateNote(note, { tags: suggestedTags });
        repo.save(updated);
        console.log('\nTags applied to note.');
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('related')
  .description('Find related notes')
  .argument('<id>', 'Note ID')
  .option('-n, --num <number>', 'Maximum number of related notes', '5')
  .action(async (id: string, options: { num: string }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Error: OPENAI_API_KEY environment variable is not set');
      process.exit(1);
    }

    const note = repo.findById(id);
    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const allNotes = repo.findAll();
    const finder = new RelatedNoteFinder(apiKey);

    console.log('Finding related notes...');

    try {
      const related = await finder.findRelated(note, allNotes, parseInt(options.num));

      if (related.length === 0) {
        console.log('\nNo related notes found.');
        return;
      }

      console.log(`\nFound ${related.length} related note(s):\n`);
      related.forEach(relatedNote => {
        console.log(`[${relatedNote.id}]`);
        console.log(`  Title: ${relatedNote.title}`);
        if (relatedNote.tags.length > 0) {
          console.log(`  Tags: ${relatedNote.tags.join(', ')}`);
        }
        console.log();
      });
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('todos')
  .description('Extract and list todo items from a note')
  .argument('<id>', 'Note ID')
  .action((id: string) => {
    const note = repo.findById(id);
    if (!note) {
      console.error(`Error: Note not found: ${id}`);
      process.exit(1);
    }

    const todos = parseTodosFromMarkdown(note.content);

    if (todos.length === 0) {
      console.log('No todo items found in this note.');
      return;
    }

    console.log(`Found ${todos.length} todo item(s) in "${note.title}":\n`);
    todos.forEach((todo, index) => {
      const status = todo.completed ? '✓' : ' ';
      console.log(`${index + 1}. [${status}] ${todo.text}`);
    });

    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;
    console.log(`\nProgress: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`);
  });

program.parse();
