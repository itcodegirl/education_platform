// ═══════════════════════════════════════════════
// AI TUTOR — Context-aware lesson assistant
// Uses the app's server-side AI endpoint
// Knows the current lesson, module, and course
// ═══════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { askLessonTutor } from '../../services/aiService';

export function AITutor({ lesson, moduleTitle, courseId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // Reset when lesson changes
  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsOpen(false);
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

    const userMsg = { role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const aiText = await askLessonTutor({
        system: buildSystemPrompt(),
        history,
        question,
      });

      setMessages(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Connection issue — check your internet and try again.'
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
        <span className="ai-tutor-icon robot-glow">🤖</span>
        <span className="ai-tutor-label">AI Tutor</span>
        <span className="ai-tutor-hint">
          {isOpen ? 'Close' : 'Ask about this lesson'}
        </span>
        <span className="ai-tutor-arrow">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div id="lesson-ai-tutor-panel" className="ai-tutor-panel">
          {/* Messages */}
          <div className="ai-messages" role="log" aria-live="polite" aria-label="AI tutor conversation">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <p className="ai-welcome-text">
                  👋 I know what you're studying. Ask me anything about{' '}
                  <strong>{lesson.title}</strong> — I'll explain it, show
                  examples, or help you debug.
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
              <div key={i} className={`ai-msg ai-msg-${msg.role}`} aria-label={msg.role === 'user' ? 'You' : 'AI Tutor'}>
                <div className="ai-msg-avatar" aria-hidden="true">
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this lesson..."
              aria-label="Ask the AI tutor a question"
              rows={1}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-send"
              disabled={!input.trim() || loading}
              aria-label="Send message to AI tutor"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
