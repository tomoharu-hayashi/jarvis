import { randomUUID } from 'crypto';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export function createTodoItem(text: string): TodoItem {
  return {
    id: randomUUID(),
    text,
    completed: false,
    createdAt: new Date(),
  };
}

export function toggleTodoItem(todo: TodoItem): TodoItem {
  return {
    ...todo,
    completed: !todo.completed,
  };
}

export function updateTodoItemText(todo: TodoItem, text: string): TodoItem {
  return {
    ...todo,
    text,
  };
}

export function parseTodosFromMarkdown(content: string): TodoItem[] {
  const todoRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
  const todos: TodoItem[] = [];
  let match;

  while ((match = todoRegex.exec(content)) !== null) {
    const completed = match[1].toLowerCase() === 'x';
    const text = match[2].trim();
    todos.push({
      id: randomUUID(),
      text,
      completed,
      createdAt: new Date(),
    });
  }

  return todos;
}

export function todosToMarkdown(todos: TodoItem[]): string {
  return todos
    .map(todo => `- [${todo.completed ? 'x' : ' '}] ${todo.text}`)
    .join('\n');
}
