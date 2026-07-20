"use client";

import { Component, type ReactNode } from "react";

/**
 * Per-block error boundary — an unexpected render crash in one block must
 * never take down the rest of the world (catalog: errors are quiet, inline,
 * and non-blocking). The fallback is a minimal ground-colored gap; the
 * designed per-state error UIs inside each block handle the expected
 * failures, this only catches the unexpected.
 */
export class BlockBoundary extends Component<
  { blockId: string; children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    // surfaced for QA/critic runs; a real logger arrives with P4
    console.error(`[kol] block "${this.props.blockId}" crashed:`, error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div
          data-block-crashed={this.props.blockId}
          aria-hidden="true"
          className="h-[var(--space-8)] w-full"
        />
      );
    }
    return this.props.children;
  }
}
