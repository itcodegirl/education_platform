// ═══════════════════════════════════════════════
// ChallengeAIPanel — the inline AI tutor that lives
// next to the code editor in CodeChallenge. Owns its
// own state (open/closed, message buffer, input text,
// loading flag) so the parent doesn't have to babysit.
//
// Communication is one-way: the parent passes in the
// challenge context (title, requirements, current
// code, language, last test results) and we shape the
// system prompt + send the request.
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { askChallengeTutor } from '../../../services/aiService';

const SUGGESTION_PROMPTS = [
  'What am I doing wrong?',
  'Explain the requirements',
  'Give me a hint (not the answer)',
  'Help me understand the error',
];

function buildSystemPrompt({ challenge, monacoLang, code, results }) {
  const failingTests = results
    ? results.filter((r) => !r.passed).map((r) => r.label).join(', ')
    : 'not yet run';

  return `You are the CodeHerWay AI Tutor helping a student with a coding challenge.

Challenge: ${challenge.title}
Description: ${challenge.description}
Language: ${monacoLang}
Requirements: ${challenge.requirements?.join(', ')}
Failing tests: ${failingTests}

The student's current code:
${code}

Rules:
- NEVER give the full solution. Guide them toward it.
- Point out what they're missing or doing wrong.
- Give small, specific hints - one step at a time.
- Be encouraging and direct. No gatekeeping.
- Keep answers to 2-3 short paragraphs max.
- If they ask for the answer directly, nudge them to try the hint first.`;
}

function renderTutorReply(text) {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      if (line.startsWith('```')) return null;
      const trimmed = line.trim();
      if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        return <code key={i} className="cc-ai-inline-code">{trimmed.replace(/`/g, '')}</code>;
      }
      return <p key={i}>{line}</p>;
    });
}

export function ChallengeAIPanel({ challenge, monacoLang, code, results, isOpen }) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  async function ask(question) {
    if (loading) return;
    setLoading(true);
    try {
      const text = await askChallengeTutor({
        system: buildSystemPrompt({ challenge, monacoLang, code, results }),
        question,
      });
      setReply(text || 'Could not process that. Try rephrasing!');
    } catch {
      setReply('Connection issue - check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  function submitInput() {
    const trimmed = input.trim();
    if (!trimmed) return;
    ask(trimmed);
    setInput('');
  }

  if (!isOpen) return null;

  return (
    <div id="challenge-ai-panel" className="cc-ai-panel">
      <div className="cc-ai-header">
        <span>🤖 AI Tutor - Challenge Help</span>
      </div>

      {reply && (
        <div className="cc-ai-response">{renderTutorReply(reply)}</div>
      )}

      <div className="cc-ai-input-row">
        <div className="cc-ai-suggestions">
          {!reply && SUGGESTION_PROMPTS.map((s, i) => (
            <button key={i} type="button" className="cc-ai-suggestion" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="cc-ai-custom">
          <input
            className="cc-ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitInput(); }}
            placeholder="Ask about this challenge..."
            disabled={loading}
          />
          <button
            type="button"
            className="cc-ai-send"
            onClick={submitInput}
            disabled={!input.trim() || loading}
            aria-label="Send challenge help request"
          >
            {loading ? '⏳' : '^'}
          </button>
        </div>
      </div>
    </div>
  );
}
