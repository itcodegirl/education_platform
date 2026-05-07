import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const lessonsCss = readFileSync(path.join(process.cwd(), 'src/styles/lessons.css'), 'utf8');

describe('lesson task checklist accessibility styles', () => {
  it('keeps native task checkboxes available to keyboard and assistive tech', () => {
    const checkboxRule = lessonsCss.match(/\.task-item input\[type="checkbox"\]\s*{(?<body>[^}]*)}/)?.groups?.body || '';

    expect(checkboxRule).not.toMatch(/display\s*:\s*none/i);
    expect(checkboxRule).toMatch(/clip-path\s*:/i);
    expect(lessonsCss).toContain('.task-item input[type="checkbox"]:focus-visible + .task-check');
  });
});
