// ═══════════════════════════════════════════════
// LESSON BUILDER CODEGEN TESTS — Pins the shape
// of generated module files and the validation
// rules that guard the Lesson Builder.
// ═══════════════════════════════════════════════

import { describe, test, expect } from 'vitest';
import {
  slugify,
  escapeJS,
  generateModuleCode,
  validateDraft,
} from '../../src/components/admin/lessonBuilderCodegen.js';

const emptyLesson = {
  id: 'h1-1',
  title: 'Intro',
  difficulty: 'beginner',
  duration: '5 min',
  scaffolding: 'full',
  concepts: ['one', 'two'],
  code: '<h1>Hi</h1>',
  output: 'says hi',
  tasks: ['task one'],
  challenge: 'do the thing',
  devFession: "I once shipped a bug",
  prereqs: '',
};

const emptyModule = {
  id: 1,
  emoji: '🚀',
  title: 'Module One',
  tagline: 'a tagline',
  difficulty: 'beginner',
};

describe('slugify', () => {
  test('lowercases and replaces non-alphanumeric runs with dashes', () => {
    expect(slugify('Advanced Flexbox!')).toBe('advanced-flexbox');
  });

  test('strips leading and trailing dashes', () => {
    expect(slugify('  --Hello World--  ')).toBe('hello-world');
  });

  test('returns empty string for input with no word characters', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('escapeJS', () => {
  test('escapes single quotes and backslashes', () => {
    expect(escapeJS("it's \\ok")).toBe("it\\'s \\\\ok");
  });

  test('escapes newlines as \\n literals', () => {
    expect(escapeJS('line1\nline2')).toBe('line1\\nline2');
  });
});

describe('generateModuleCode', () => {
  test('emits a parseable module export', () => {
    const src = generateModuleCode(emptyModule, [emptyLesson]);
    expect(src).toContain('export const module = {');
    expect(src).toContain("id: 1,");
    expect(src).toContain("title: 'Module One',");
    expect(src).toContain("emoji: '🚀'");
    expect(src).toContain("id: 'h1-1',");
    expect(src).toContain("'one',");
    expect(src).toContain("'two',");
  });

  test('omits the scaffolding field when it is the default', () => {
    const src = generateModuleCode(emptyModule, [emptyLesson]);
    expect(src).not.toContain("scaffolding: 'full'");
  });

  test('emits the scaffolding field when it differs from default', () => {
    const src = generateModuleCode(emptyModule, [
      { ...emptyLesson, scaffolding: 'starter' },
    ]);
    expect(src).toContain("scaffolding: 'starter'");
  });

  test('wraps prereqs correctly', () => {
    const src = generateModuleCode(emptyModule, [
      { ...emptyLesson, prereqs: 'h1-1, h1-2' },
    ]);
    expect(src).toContain("prereqs: ['h1-1', 'h1-2']");
  });

  test('empty prereqs becomes []', () => {
    const src = generateModuleCode(emptyModule, [emptyLesson]);
    expect(src).toContain('prereqs: []');
  });
});

describe('validateDraft', () => {
  test('passes a complete draft', () => {
    expect(validateDraft(emptyModule, [emptyLesson])).toEqual([]);
  });

  test('flags missing module title and id', () => {
    const issues = validateDraft({ ...emptyModule, id: '', title: '' }, [emptyLesson]);
    expect(issues).toContain('Module title is required');
    expect(issues).toContain('Module ID is required');
  });

  test('flags missing lesson fields with lesson number prefix when multiple', () => {
    const bad = { ...emptyLesson, id: '', title: '', concepts: [''] };
    const issues = validateDraft(emptyModule, [emptyLesson, bad]);
    expect(issues).toContain('Lesson 2: Lesson ID is required');
    expect(issues).toContain('Lesson 2: Lesson title is required');
    expect(issues).toContain('Lesson 2: At least one concept is required');
  });

  test('omits the prefix for a single-lesson draft', () => {
    const bad = { ...emptyLesson, id: '' };
    const issues = validateDraft(emptyModule, [bad]);
    expect(issues).toContain('Lesson ID is required');
  });
});
