import { describe, it, expect } from 'vitest';
import {
  buildChallengePreviewBridgeScript,
  createChallengePreviewTestFrameFromSnapshot,
  PREVIEW_REQUEST_TYPE,
  PREVIEW_RESPONSE_TYPE,
} from './challengePreviewBridge';

describe('challengePreviewBridge', () => {
  it('rebuilds a testable preview frame from a snapshot payload', () => {
    const snapshot = {
      html: '<!DOCTYPE html><html data-codeherway-node-id="0"><head data-codeherway-node-id="1"></head><body data-codeherway-node-id="2"><nav class="navbar" data-codeherway-node-id="3"><a href="#" data-codeherway-node-id="4">Home</a></nav></body></html>',
      viewportHeight: 720,
      viewportWidth: 1280,
      consoleResults: ['ready'],
      styles: {
        3: {
          display: 'flex',
          justifyContent: 'center',
        },
        4: {
          color: 'rgb(255, 255, 255)',
        },
      },
    };

    const frame = createChallengePreviewTestFrameFromSnapshot(snapshot);
    const nav = frame.contentDocument.querySelector('.navbar');
    const link = frame.contentDocument.querySelector('a');

    expect(nav).not.toBeNull();
    expect(frame.contentWindow.getComputedStyle(nav).display).toBe('flex');
    expect(frame.contentWindow.getComputedStyle(nav).justifyContent).toBe('center');
    expect(frame.contentWindow.getComputedStyle(link).color).toBe('rgb(255, 255, 255)');
    expect(frame.contentWindow.innerHeight).toBe(720);
    expect(frame.contentWindow.innerWidth).toBe(1280);
    expect(frame.contentWindow._challengeResults).toEqual(['ready']);
  });

  it('embeds the expected message contract in the injected bridge script', () => {
    const script = buildChallengePreviewBridgeScript();

    expect(script).toContain(PREVIEW_REQUEST_TYPE);
    expect(script).toContain(PREVIEW_RESPONSE_TYPE);
    expect(script).toContain('window.parent.postMessage');
    expect(script).toContain('buildSnapshot');
  });
});
