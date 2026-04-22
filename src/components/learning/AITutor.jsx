// ═══════════════════════════════════════════════
// AI TUTOR — Context-aware lesson assistant
// Uses the app's server-side AI endpoint
// Knows the current lesson, module, and course
// ═══════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { askLessonTutor } from '../../services/aiService';

const MAX_TUTOR_CHARS = 4000;
const HISTORY_WINDOW = 8;

export function AITutor({ lesson, moduleTitle, courseId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // Reset when lesson changes
  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsOpen(false);
    setSubmitError('');
  }, [lesson?.id]);

  // Scroll to latest message
  useEffect(() => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    messagesEnd.current?.scrollIntoView({ behavior });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  // Build lesson context for the AI system prompt
  function buildSystemPrompt() {
    const parts = [];
    parts.push(`You are the CodeHerWay AI Tutor — a supportive, direct coding mentor for women learning web development.`);
    parts.push(`\nThe student is currently studying:`);
    parts.push(`Course: ${courseId?.toUpperCase() || 'Web Development'}`);
    if (moduleTitle) parts.push(`Module: ${moduleTitle}`);
    parts.push(`Lesson: ${lesson.title}`);

    if (lesson.concepts?.length) {
      parts.push(`\nKey concepts in this lesson:`);
      lesson.concepts.forEach(c => parts.push(`• ${c}`));
    }

    if (lesson.code) {
      parts.push(`\nCode example shown in this lesson:\n${lesson.code.slice(0, 600)}`);
    }

    parts.push(`\nRules:`);
    parts.push(`- Keep answers concise (2-4 short paragraphs max).`);
    parts.push(`- Use simple code examples when helpful.`);
    parts.push(`- Reference the current lesson concepts when relevant.`);
    parts.push(`- Be encouraging but honest. No sugarcoating.`);
    parts.push(`- Voice: direct, zero-gatekeeping, empowering.`);
    parts.push(`- If asked something off-topic, briefly answer then guide back.`);
    parts.push(`- Format code blocks with triple backticks.`);

    return parts.join('\n');
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    if (!isOnline) {
      setSubmitError('You are offline. Reconnect, then send your message.');
      return;
    }

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSubmitError('');
    setLoading(true);

    try {
      const history = messages.slice(-HISTORY_WINDOW).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const aiText = await askLessonTutor({
        system: buildSystemPrompt(),
        history,
        question,
      });

      setMessages(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const payloadTooLarge = /413|too large|payload|request entity/i.test(message);
      const networkIssue = !isOnline || /network|failed to fetch|offline|internet/i.test(message);
      const fallback = payloadTooLarge
        ? 'That request was too long for the tutor context. Shorten it and try again.'
        : networkIssue
          ? 'You appear offline right now. Reconnect and try again.'
          : 'AI tutor is temporarily unavailable. Please try again in a moment.';
      setSubmitError(fallback);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: fallback,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Format AI response — handles code blocks and paragraphs
  function formatResponse(text) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();
        return (
          <pre key={i} className="ai-code-block">
            <code>{code}</code>
          </pre>
        );
      }
      return part.split('\n').filter(Boolean).map((line, j) => (
        <p key={`${i}-${j}`}>{line}</p>
      ));
    });
  }

  // Suggested starter questions
  const suggestions = [
    `Explain ${lesson.title} in simpler terms`,
    `Show me a different code example`,
    `What mistakes should I avoid?`,
    `How is this used in real projects?`
  ];

  return (
    <div className="ai-tutor">
      <button
        type="button"
        className={`ai-tutor-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="lesson-ai-tutor-panel"
      >
        <span className="ai-tutor-icon robot-glow" aria-hidden="true">🤖</span>
        <span className="ai-tutor-label">AI Tutor</span>
        <span className="ai-tutor-hint">
          {isOpen ? 'Close' : 'Ask about this lesson'}
        </span>
        <span className="ai-tutor-arrow">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div id="lesson-ai-tutor-panel" className="ai-tutor-panel">
          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <p className="ai-welcome-text">
                  👋 I am grounded in this lesson already. Ask about{' '}
                  <strong>{lesson.title}</strong> and I will explain it, show a different example,
                  or help you get unstuck without making you feel lost.
                </p>
                <div className="ai-suggestions">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="ai-suggestion"
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ai-msg-${msg.role}`}>
                <div className="ai-msg-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="ai-msg-content">
                  {msg.role === 'assistant'
                    ? formatResponse(msg.text)
                    : <p>{msg.text}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-avatar">🤖</div>
                <div className="ai-msg-content">
                  <div className="ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <form className="ai-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (submitError) setSubmitError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this lesson..."
              maxLength={MAX_TUTOR_CHARS}
              rows={1}
              disabled={loading || !isOnline}
              aria-describedby="ai-input-meta"
            />
            <button
              type="submit"
              className="ai-send"
              disabled={!input.trim() || loading || !isOnline}
              aria-label="Send message to AI tutor"
            >
              ↑
            </button>
          </form>
          <div id="ai-input-meta" className="ai-input-meta">
            <span className="ai-input-limit">
              {isOnline
                ? `Messages can be up to ${MAX_TUTOR_CHARS.toLocaleString()} characters.`
                : 'Offline: reconnect to send a question.'}
            </span>
            <span
              className={`ai-input-count ${input.length >= MAX_TUTOR_CHARS * 0.9 ? 'near-limit' : ''}`}
              aria-live="polite"
            >
              {input.length.toLocaleString()} / {MAX_TUTOR_CHARS.toLocaleString()}
            </span>
          </div>
          {submitError && (
            <p className="ai-input-error" role="status" aria-live="polite">
              {submitError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
