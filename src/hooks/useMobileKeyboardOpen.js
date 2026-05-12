import { useEffect, useState } from 'react';

const TEXT_ENTRY_SELECTOR = [
  'textarea',
  'select',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  'input:not([type])',
  'input[type="email"]',
  'input[type="number"]',
  'input[type="password"]',
  'input[type="search"]',
  'input[type="tel"]',
  'input[type="text"]',
  'input[type="url"]',
].join(',');

const KEYBOARD_SHRINK_PX = 120;
const KEYBOARD_HEIGHT_RATIO = 0.78;

function getViewportHeight() {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height || window.innerHeight || 0;
}

function isTextEntryElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  return element.matches(TEXT_ENTRY_SELECTOR);
}

export function useMobileKeyboardOpen(isMobile) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') {
      setKeyboardOpen(false);
      return undefined;
    }

    const viewport = window.visualViewport;
    let baselineHeight = getViewportHeight();
    let animationFrame = 0;
    let focusOutTimer = 0;
    let baselineResetTimer = 0;
    let lastKeyboardOpen = false;

    const updateKeyboardState = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        const currentHeight = getViewportHeight();
        const focusedForTyping = isTextEntryElement(document.activeElement);

        if (!focusedForTyping && currentHeight > baselineHeight) {
          baselineHeight = currentHeight;
        }

        const shrinkPx = Math.max(0, baselineHeight - currentHeight);
        const shrinkRatio = baselineHeight > 0 ? currentHeight / baselineHeight : 1;
        const nextKeyboardOpen =
          focusedForTyping &&
            (shrinkPx >= KEYBOARD_SHRINK_PX || shrinkRatio <= KEYBOARD_HEIGHT_RATIO);

        if (nextKeyboardOpen !== lastKeyboardOpen) {
          lastKeyboardOpen = nextKeyboardOpen;
          setKeyboardOpen(nextKeyboardOpen);
        }
      });
    };

    const resetBaselineSoon = () => {
      if (baselineResetTimer) {
        window.clearTimeout(baselineResetTimer);
      }
      baselineResetTimer = window.setTimeout(() => {
        baselineResetTimer = 0;
        baselineHeight = getViewportHeight();
        updateKeyboardState();
      }, 250);
    };

    const handleFocusOut = () => {
      if (focusOutTimer) {
        window.clearTimeout(focusOutTimer);
      }
      focusOutTimer = window.setTimeout(updateKeyboardState, 80);
    };

    viewport?.addEventListener('resize', updateKeyboardState);
    window.addEventListener('resize', updateKeyboardState);
    window.addEventListener('orientationchange', resetBaselineSoon);
    window.addEventListener('focusin', updateKeyboardState);
    window.addEventListener('focusout', handleFocusOut);

    updateKeyboardState();

    return () => {
      viewport?.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('orientationchange', resetBaselineSoon);
      window.removeEventListener('focusin', updateKeyboardState);
      window.removeEventListener('focusout', handleFocusOut);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (focusOutTimer) {
        window.clearTimeout(focusOutTimer);
      }
      if (baselineResetTimer) {
        window.clearTimeout(baselineResetTimer);
      }
    };
  }, [isMobile]);

  return keyboardOpen;
}
