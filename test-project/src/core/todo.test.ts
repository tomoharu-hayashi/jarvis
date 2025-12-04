import { describe, it, expect } from 'vitest';
import { createTodoItem, toggleTodoItem, updateTodoItemText } from './todo';

describe('TodoItem', () => {
  describe('createTodoItem', () => {
    it('creates a new todo item', () => {
      const todo = createTodoItem('Test task');

      expect(todo.id).toBeDefined();
      expect(todo.text).toBe('Test task');
      expect(todo.completed).toBe(false);
      expect(todo.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('toggleTodoItem', () => {
    it('toggles todo completion status', () => {
      const todo = createTodoItem('Test task');
      expect(todo.completed).toBe(false);

      const toggled = toggleTodoItem(todo);
      expect(toggled.completed).toBe(true);

      const toggledAgain = toggleTodoItem(toggled);
      expect(toggledAgain.completed).toBe(false);
    });
  });

  describe('updateTodoItemText', () => {
    it('updates todo text', () => {
      const todo = createTodoItem('Old text');
      const updated = updateTodoItemText(todo, 'New text');

      expect(updated.text).toBe('New text');
      expect(updated.id).toBe(todo.id);
    });
  });
});
