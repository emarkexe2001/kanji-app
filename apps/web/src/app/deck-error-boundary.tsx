import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Catches errors thrown while rendering the deck and shows a friendly message instead of
 * a blank page. The error is logged to the console for debugging.
 */
export class DeckErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error while rendering the deck:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p role="alert" className="flex flex-1 items-center justify-center text-center text-danger-ink">
          Something went wrong showing the cards. Please reload the page to try again.
        </p>
      );
    }
    return this.props.children;
  }
}
