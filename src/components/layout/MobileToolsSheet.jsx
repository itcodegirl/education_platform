import { memo, useEffect } from 'react';

export const MobileToolsSheet = memo(function MobileToolsSheet({
  isOpen,
  onClose,
  tools = [],
  activePanel = null,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="mobile-tools-scrim"
        aria-label="Close learning tools"
        onClick={onClose}
      />
      <section
        id="mobile-tools-sheet"
        className="mobile-tools-sheet"
        role="dialog"
        aria-labelledby="mobile-tools-title"
      >
        <div className="mobile-tools-head">
          <h2 id="mobile-tools-title" className="mobile-tools-title">Learning tools</h2>
          <button type="button" className="mobile-tools-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mobile-tools-grid">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              className={`mobile-tools-item ${activePanel === tool.key ? 'active' : ''}`}
              aria-pressed={activePanel === tool.key}
              onClick={() => {
                onClose();
                tool.onSelect();
              }}
            >
              <span className="mobile-tools-item-label">{tool.label}</span>
              {tool.helper && <span className="mobile-tools-item-helper">{tool.helper}</span>}
            </button>
          ))}
        </div>
      </section>
    </>
  );
});
