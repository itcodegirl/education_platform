import { memo, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const PRIMARY_TOOL_KEYS = new Set(['search', 'bookmarks', 'stats']);

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

  const primaryTools = tools.filter((tool) => PRIMARY_TOOL_KEYS.has(tool.key));
  const supportTools = tools.filter((tool) => !PRIMARY_TOOL_KEYS.has(tool.key));
  const hasGroupedTools = primaryTools.length > 0 && supportTools.length > 0;

  const renderTool = (tool) => (
    <button
      key={tool.key}
      type="button"
      className={`mobile-tools-item ${activePanel === tool.key ? 'active' : ''}`}
      aria-label={`${tool.label}${tool.helper ? `: ${tool.helper}` : ''}`}
      aria-pressed={activePanel === tool.key}
      disabled={typeof tool.onSelect !== 'function'}
      onClick={() => {
        onClose();
        tool.onSelect?.();
      }}
    >
      {tool.icon && (
        <span className="mobile-tools-item-icon" aria-hidden="true">
          {tool.icon}
        </span>
      )}
      <span className="mobile-tools-item-copy">
        <span className="mobile-tools-item-label">{tool.label}</span>
        {tool.helper && <span className="mobile-tools-item-helper">{tool.helper}</span>}
      </span>
    </button>
  );

  return (
    <>
      <button
        type="button"
        className="mobile-tools-scrim"
        aria-label="Close learning tools"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        ref={sheetRef}
        id="mobile-tools-sheet"
        className="mobile-tools-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-tools-title"
        aria-describedby="mobile-tools-description"
        tabIndex={-1}
      >
        <div className="mobile-tools-head">
          <h2 id="mobile-tools-title" className="mobile-tools-title">Learning tools</h2>
          <button
            type="button"
            className="mobile-tools-close"
            aria-label="Close learning tools"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <p id="mobile-tools-description" className="mobile-tools-subtitle">
          Keep the lesson first. Open a tool only when it helps the next step.
        </p>
        <div className="mobile-tools-grid">
          {tools.length === 0 ? (
            <p className="mobile-tools-empty">
              Finish the lesson in front of you first. More tools unlock after real progress.
            </p>
          ) : (
            <>
              {primaryTools.length > 0 && (
                <div className="mobile-tools-section" aria-label={hasGroupedTools ? 'Use now' : 'Available tools'}>
                  {hasGroupedTools && <p className="mobile-tools-section-title">Use now</p>}
                  <div className="mobile-tools-section-grid">
                    {primaryTools.map(renderTool)}
                  </div>
                </div>
              )}
              {supportTools.length > 0 && (
                <div className="mobile-tools-section" aria-label={hasGroupedTools ? 'Support when needed' : 'Available tools'}>
                  {hasGroupedTools && <p className="mobile-tools-section-title">Support when needed</p>}
                  <div className="mobile-tools-section-grid">
                    {supportTools.map(renderTool)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
});
