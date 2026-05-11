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

  const renderTool = (tool) => {
    const isUnavailable = typeof tool.onSelect !== 'function';
    const labelId = `mobile-tool-${tool.key}-label`;
    const helperId = tool.helper ? `mobile-tool-${tool.key}-helper` : undefined;
    const unavailableId = isUnavailable ? `mobile-tool-${tool.key}-unavailable` : undefined;
    const describedBy = [helperId, unavailableId].filter(Boolean).join(' ') || undefined;

    return (
      <button
        key={tool.key}
        type="button"
        className={`mobile-tools-item ${activePanel === tool.key ? 'active' : ''}`}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-pressed={activePanel === tool.key}
        aria-disabled={isUnavailable}
        onClick={() => {
          if (isUnavailable) return;
          onClose();
          tool.onSelect();
        }}
      >
        {tool.icon && (
          <span className="mobile-tools-item-icon" aria-hidden="true">
            {tool.icon}
          </span>
        )}
        <span className="mobile-tools-item-copy">
          <span id={labelId} className="mobile-tools-item-label">{tool.label}</span>
          {tool.helper && (
            <span id={helperId} className="mobile-tools-item-helper">{tool.helper}</span>
          )}
          {isUnavailable && (
            <span id={unavailableId} className="sr-only">
              Unavailable until you make learning progress.
            </span>
          )}
        </span>
      </button>
    );
  };

  const renderSection = (label, sectionTools) => (
    <section
      className="mobile-tools-section"
      aria-label={label}
    >
      {hasGroupedTools && <p className="mobile-tools-section-title">{label}</p>}
      <div className="mobile-tools-section-grid">
        {sectionTools.map(renderTool)}
      </div>
    </section>
  );

  return (
    <>
      <div
        className="mobile-tools-scrim"
        aria-hidden="true"
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
                renderSection(hasGroupedTools ? 'Use now' : 'Available tools', primaryTools)
              )}
              {supportTools.length > 0 && (
                renderSection(hasGroupedTools ? 'Support when needed' : 'Available tools', supportTools)
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
});
