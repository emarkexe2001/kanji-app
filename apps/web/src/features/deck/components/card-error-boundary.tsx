import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CardCantBeShown } from './card-cant-be-shown';

/**
 * Wraps one card in a list of cards, so a card whose details can't be drawn (e.g. broken data)
 * shows a friendly message in its place and the rest of the list keeps working. The error is
 * logged to the console for debugging. A card whose data is missing is handled before it gets
 * here (CHORE8); this stays as a safety net.
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
    if (this.state.hasError) return <CardCantBeShown />;
    return this.props.children;
  }
}
