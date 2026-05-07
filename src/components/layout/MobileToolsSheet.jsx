import { memo, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export const MobileToolsSheet = memo(function MobileToolsSheet({
  isOpen,
  onClose,
  tools = [],
  activePanel = null,
}) {
  const sheetRef = useRef(null);

  useFocusTrap(sheetRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

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
        ref={sheetRef}
        id="mobile-tools-sheet"
        className="mobile-tools-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-tools-title"
        tabIndex={-1}
      >
        <div className="mobile-tools-head">
          <h2 id="mobile-tools-title" className="mobile-tools-title">Learning tools</h2>
          <button type="button" className="mobile-tools-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mobile-tools-grid">
          {tools.length === 0 ? (
            <p className="mobile-tools-empty">
              Complete the current lesson to unlock more learning tools.
            </p>
          ) : tools.map((tool) => (
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
