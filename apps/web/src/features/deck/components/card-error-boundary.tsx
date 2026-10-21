import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Wraps one card in a list of cards, so a card whose details can't be drawn (e.g. broken data)
 * shows a friendly message in its place and the rest of the list keeps working. The error is
 * logged to the console for debugging.
 */
export class CardErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error while drawing a card:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-2 text-xs text-slate-600">
          This card can&apos;t be shown.
        </p>
      );
    }
    return this.props.children;
  }
}
