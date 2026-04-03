// ═══════════════════════════════════════════════
// AI TUTOR — Context-aware lesson assistant
// Calls Anthropic API directly (no backend needed)
// Knows the current lesson, module, and course
// ═══════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { AI_MODEL } from '../utils/helpers';

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
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
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
      const history = [...messages, userMsg].map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: history
        })
      });

      const data = await response.json();
      const aiText = data.content?.[0]?.text
        || 'Hmm, I couldn\'t process that. Try rephrasing your question!';

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
        className={`ai-tutor-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="ai-tutor-icon">🤖</span>
        <span className="ai-tutor-label">AI Tutor</span>
        <span className="ai-tutor-hint">
          {isOpen ? 'Close' : 'Ask about this lesson'}
        </span>
        <span className="ai-tutor-arrow">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className="ai-tutor-panel">
          {/* Messages */}
          <div className="ai-messages">
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this lesson..."
              rows={1}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-send"
              disabled={!input.trim() || loading}
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
