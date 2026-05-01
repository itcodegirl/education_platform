import { describe, it, expect } from 'vitest';
import { slugify, escapeJS, generateModuleCode } from './lessonCodegen';

describe('slugify', () => {
  it('lowercases and replaces non-alphanumeric runs with single hyphens', () => {
    expect(slugify('Advanced Flexbox & Grid!')).toBe('advanced-flexbox-grid');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('!!! Hello World !!!')).toBe('hello-world');
  });

  it('returns the empty string when given falsy input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify(null)).toBe('');
  });
});

describe('escapeJS', () => {
  it('escapes single quotes', () => {
    expect(escapeJS("it's tricky")).toBe("it\\'s tricky");
  });

  it('escapes backslashes BEFORE quotes so we do not double-escape', () => {
    // Input  : a\b'c
    // Expect : a\\b\'c (backslash doubled, quote escaped — once each)
    expect(escapeJS("a\\b'c")).toBe("a\\\\b\\'c");
  });

  it('converts newlines to literal \\n', () => {
    expect(escapeJS('line one\nline two')).toBe('line one\\nline two');
  });

  it('returns an empty string for falsy input', () => {
    expect(escapeJS(undefined)).toBe('');
    expect(escapeJS(null)).toBe('');
  });
});

describe('generateModuleCode', () => {
  const minimalModule = {
    moduleInfo: {
      id: 21,
      emoji: '🚀',
      title: 'Advanced Flexbox',
      tagline: 'Master flexible layouts.',
      difficulty: 'beginner',
    },
    lessons: [
      {
        id: 'h21-1',
        title: 'Flex Direction',
        difficulty: 'beginner',
        duration: '8 min',
        concepts: ['flex-direction sets the main axis.'],
        code: '<div class="flex-row"></div>',
        output: 'A horizontal row.',
        tasks: ['Try column.'],
        challenge: 'Build a navbar.',
        devFession: '',
      },
    ],
  };

  it('emits a runnable export with the expected top-level shape', () => {
    const code = generateModuleCode(minimalModule);
    expect(code).toContain('export const module = {');
    expect(code).toContain("id: 21,");
    expect(code).toContain("emoji: '🚀',");
    expect(code).toContain("title: 'Advanced Flexbox',");
    expect(code).toContain("difficulty: 'beginner',");
    expect(code).toContain('lessons: [');
  });

  it('omits scaffolding when the lesson uses the default "full" value', () => {
    const code = generateModuleCode(minimalModule);
    expect(code).not.toContain('scaffolding:');
  });

  it('emits scaffolding when the lesson sets a non-default value', () => {
    const code = generateModuleCode({
      ...minimalModule,
      lessons: [{ ...minimalModule.lessons[0], scaffolding: 'partial' }],
    });
    expect(code).toContain("scaffolding: 'partial',");
  });

  it('escapes backticks and ${} inside the lesson code template literal', () => {
    const lesson = {
      ...minimalModule.lessons[0],
      code: 'const x = `hello ${name}`',
    };
    const code = generateModuleCode({ ...minimalModule, lessons: [lesson] });
    // Both the backtick and $ must be escaped so the emitted file
    // remains valid JS (the wrapping template literal does not close
    // early or interpolate accidentally).
    expect(code).toContain('\\`hello \\${name}\\`');
  });

  it('parses comma-separated prereqs into a JS array literal', () => {
    const lesson = { ...minimalModule.lessons[0], prereqs: 'h20-3, h20-4' };
    const code = generateModuleCode({ ...minimalModule, lessons: [lesson] });
    expect(code).toContain("prereqs: ['h20-3', 'h20-4']");
  });

  it('emits an empty prereqs array when no prereqs are given', () => {
    const code = generateModuleCode(minimalModule);
    expect(code).toContain('prereqs: []');
  });

  it('drops empty entries from concepts and tasks lists', () => {
    const lesson = {
      ...minimalModule.lessons[0],
      concepts: ['real concept', '', '   ', 'another real concept'],
      tasks: ['', 'real task'],
    };
    const code = generateModuleCode({ ...minimalModule, lessons: [lesson] });
    // The two empty/whitespace-only concepts get filtered out.
    const conceptMatches = code.match(/'real concept'/g) || [];
    expect(conceptMatches.length).toBe(1);
    expect(code).toContain("'another real concept'");
    expect(code).toContain("'real task'");
  });

  it('serializes multiple lessons with comma separators', () => {
    const code = generateModuleCode({
      ...minimalModule,
      lessons: [
        { ...minimalModule.lessons[0], id: 'a' },
        { ...minimalModule.lessons[0], id: 'b' },
      ],
    });
    expect(code).toContain("id: 'a'");
    expect(code).toContain("id: 'b'");
  });
});
