import { useEffect, useEffectEvent, type RefObject } from 'react';

/** What closed the pop-up: Escape, or a press or click outside it. */
export type DismissReason = 'escape' | 'outside';

export interface DismissOptions {
  /** Listen only while this is true, e.g. while a menu is open. On by default. */
  enabled?: boolean;
  /**
   * What counts as a press outside:
   * - `'pointerdown'`: the moment a press outside starts (the colour mode menu, FEAT5);
   * - `'click'`: the click that ends a press or comes from the keyboard (the Shuffled-out panel).
   *   A press that starts inside (or on an `ignore` element) and ends outside doesn't close it
   *   (ADJ2_5, see below).
   */
  closeOn: 'pointerdown' | 'click';
  /**
   * Catch Escape before anything else on the page sees it, and stop it there, so it closes only
   * this pop-up and not one behind it (the colour mode menu over the Shuffled-out panel, FEAT5).
   * Off by default: Escape is heard once it has reached the page, as usual.
   */
  escapeFirst?: boolean;
  /** A CSS selector for elements whose presses don't count as outside, although they are. */
  ignore?: string;
}

/**
 * Closes a pop-up on Escape or a press outside it. `ref` is the pop-up (with anything that should
 * count as inside it); `onDismiss` closes it and is told why. The press listeners run in the
 * capture phase, before the press is handled, so a press inside always finds its target still in
 * the pop-up.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: (reason: DismissReason) => void,
  { enabled = true, closeOn, escapeFirst = false, ignore }: DismissOptions,
) {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    const popUp = ref.current;
    if (!enabled || !popUp) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node &&
      !popUp.contains(target) &&
      !(ignore && target instanceof Element && target.closest(ignore));

    // With `closeOn: 'click'`, a press that starts inside (e.g. selecting text) and ends outside
    // doesn't close the pop-up: the click the browser sends for that press is ignored. Only that
    // click (ADJ2_5): a press that ends without one (dragged away, or cancelled by the browser to
    // scroll) is forgotten, and a click that isn't the end of a press (e.g. Enter or Space on a
    // button, detail 0) is never ignored, so the next click outside always closes it.
    let pressedInside = false;
    const onPointerDown = (e: Event) => {
      if (closeOn === 'click') pressedInside = !isOutside(e.target);
      else if (isOutside(e.target)) dismiss('outside');
    };
    const forgetPress = () => {
      pressedInside = false;
    };
    const onClick = (e: MouseEvent) => {
      const endsPressInside = pressedInside && e.detail > 0;
      pressedInside = false;
      if (!endsPressInside && isOutside(e.target)) dismiss('outside');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (escapeFirst) e.stopPropagation();
      dismiss('escape');
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    if (closeOn === 'click') {
      document.addEventListener('pointercancel', forgetPress, true);
      document.addEventListener('dragstart', forgetPress, true);
      document.addEventListener('click', onClick, true);
    }
    document.addEventListener('keydown', onKeyDown, escapeFirst);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointercancel', forgetPress, true);
      document.removeEventListener('dragstart', forgetPress, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, escapeFirst);
    };
  }, [ref, enabled, closeOn, escapeFirst, ignore]);
}
