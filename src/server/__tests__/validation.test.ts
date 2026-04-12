import { describe, it, expect } from 'vitest';
import {
  validateTitle,
  validateUUID,
  validateCompleted,
} from '../validation.js';

describe('Validation', () => {
  // SUC-07: Title validation
  describe('validateTitle', () => {
    // SUC-07: valid title
    it('accepts a valid title', () => {
      const result = validateTitle('Buy groceries');
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe('Buy groceries');
      }
    });

    it('trims whitespace', () => {
      const result = validateTitle('  Trimmed  ');
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe('Trimmed');
      }
    });

    // UC-01/5a, SUC-07/5a: empty title
    it('rejects empty string', () => {
      const result = validateTitle('');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.field).toBe('title');
        expect(result.error.message).toBe('Title cannot be empty');
      }
    });

    it('rejects whitespace-only string', () => {
      const result = validateTitle('   ');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Title cannot be empty');
      }
    });

    // SUC-07/5a: missing required field
    it('rejects null', () => {
      const result = validateTitle(null);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Title is required');
      }
    });

    it('rejects undefined', () => {
      const result = validateTitle(undefined);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Title is required');
      }
    });

    // SUC-07/5b: invalid type
    it('rejects non-string types', () => {
      const result = validateTitle(123);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Title must be a string');
      }
    });

    it('rejects boolean', () => {
      const result = validateTitle(true);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Title must be a string');
      }
    });

    // UC-01/5b, SUC-07/5c: title too long
    it('rejects title exceeding 500 characters', () => {
      const longTitle = 'a'.repeat(501);
      const result = validateTitle(longTitle);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toContain('500');
      }
    });

    it('accepts title at exactly 500 characters', () => {
      const maxTitle = 'a'.repeat(500);
      const result = validateTitle(maxTitle);
      expect(result.valid).toBe(true);
    });
  });

  // SUC-07: UUID validation
  describe('validateUUID', () => {
    it('accepts a valid UUID', () => {
      const result = validateUUID('550e8400-e29b-41d4-a716-446655440000');
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('accepts uppercase UUID', () => {
      const result = validateUUID('550E8400-E29B-41D4-A716-446655440000');
      expect(result.valid).toBe(true);
    });

    it('rejects invalid UUID format', () => {
      const result = validateUUID('not-a-uuid');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('ID must be a valid UUID');
      }
    });

    it('rejects non-string input', () => {
      const result = validateUUID(123);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('ID must be a string');
      }
    });

    it('rejects empty string', () => {
      const result = validateUUID('');
      expect(result.valid).toBe(false);
    });
  });

  // SUC-07: Completed validation
  describe('validateCompleted', () => {
    it('accepts true', () => {
      const result = validateCompleted(true);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe(true);
      }
    });

    it('accepts false', () => {
      const result = validateCompleted(false);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe(false);
      }
    });

    it('defaults to false for undefined', () => {
      const result = validateCompleted(undefined);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe(false);
      }
    });

    it('rejects non-boolean types', () => {
      const result = validateCompleted('true');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.message).toBe('Completed must be a boolean');
      }
    });

    it('rejects number', () => {
      const result = validateCompleted(1);
      expect(result.valid).toBe(false);
    });
  });
});
