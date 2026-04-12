import { describe, it, expect } from 'vitest';
import { validateCreateTodo, validateUpdateTodo } from '../validation.js';

describe('Input Validation (UC-S11)', () => {
  describe('validateCreateTodo (UC-S11, Main Flow)', () => {
    it('accepts valid title (UC-S11, Main Flow)', () => {
      const result = validateCreateTodo({ title: 'Buy milk' });
      expect(result).toEqual({ title: 'Buy milk' });
    });

    it('trims whitespace from title', () => {
      const result = validateCreateTodo({ title: '  Buy milk  ' });
      expect(result).toEqual({ title: 'Buy milk' });
    });

    it('rejects missing title (UC-S11, Alt 5a)', () => {
      expect(() => validateCreateTodo({})).toThrow('Title is required');
    });

    it('rejects empty title (UC-S01, Alt 5a)', () => {
      expect(() => validateCreateTodo({ title: '' })).toThrow(
        'Title is required'
      );
    });

    it('rejects whitespace-only title (UC-U01, Alt 5b)', () => {
      expect(() => validateCreateTodo({ title: '   ' })).toThrow(
        'Title is required'
      );
    });

    it('rejects non-string title (UC-S11, Alt 5b)', () => {
      expect(() => validateCreateTodo({ title: 123 })).toThrow(
        'Title is required'
      );
    });

    it('rejects title over 500 characters (UC-S01, Alt 5b)', () => {
      const longTitle = 'a'.repeat(501);
      expect(() => validateCreateTodo({ title: longTitle })).toThrow(
        'Title must be 500 characters or less'
      );
    });

    it('accepts title of exactly 500 characters', () => {
      const title = 'a'.repeat(500);
      const result = validateCreateTodo({ title });
      expect(result.title).toBe(title);
    });
  });

  describe('validateUpdateTodo (UC-S11, for UC-S03)', () => {
    it('accepts title update', () => {
      const result = validateUpdateTodo({ title: 'New title' });
      expect(result).toEqual({ title: 'New title' });
    });

    it('accepts completed update', () => {
      const result = validateUpdateTodo({ completed: true });
      expect(result).toEqual({ completed: true });
    });

    it('accepts both fields', () => {
      const result = validateUpdateTodo({ title: 'New', completed: true });
      expect(result).toEqual({ title: 'New', completed: true });
    });

    it('rejects empty body (UC-S03, Alt 5c)', () => {
      expect(() => validateUpdateTodo({})).toThrow('No fields to update');
    });

    it('rejects empty title (UC-S03, Alt 5d)', () => {
      expect(() => validateUpdateTodo({ title: '' })).toThrow(
        'Title is required'
      );
    });

    it('rejects non-boolean completed', () => {
      expect(() => validateUpdateTodo({ completed: 'yes' })).toThrow(
        'Completed must be a boolean'
      );
    });

    it('rejects title over 500 characters', () => {
      const longTitle = 'a'.repeat(501);
      expect(() => validateUpdateTodo({ title: longTitle })).toThrow(
        'Title must be 500 characters or less'
      );
    });
  });
});
