// CHORE6: the shared hook that closes a pop-up on Escape or a press outside it (useDismiss), used by
// the Shuffled-out panel (closes on click, with the ADJ2_5 "press started inside" rule) and the
// colour mode menu (closes on pointerdown, and catches Escape first so only the menu closes).
// Each test renders a small pop-up with a button outside it and an ignored button, and checks
// whether the pop-up asked to close, and why.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useDismiss, type DismissOptions } from '../../src/hooks/use-dismiss';

function PopUp({ onDismiss, options }: { onDismiss: (reason: string) => void; options: DismissOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onDismiss, options);
  return (
    <div>
      <div ref={ref} role="dialog" aria-label="Pop-up">
        <button type="button">Inside</button>
      </div>
      <button type="button">Outside</button>
      <button type="button" data-keep-open="">
        <span>Ignored</span>
      </button>
    </div>
  );
}

function setUp(options: DismissOptions) {
  const onDismiss = vi.fn();
  const view = render(<PopUp onDismiss={onDismiss} options={options} />);
  return {
    onDismiss,
    view,
    user: userEvent.setup(),
    inside: screen.getByRole('button', { name: 'Inside' }),
    outside: screen.getByRole('button', { name: 'Outside' }),
    ignored: screen.getByText('Ignored'),
  };
}

const CLICK: DismissOptions = { closeOn: 'click' };
const POINTERDOWN: DismissOptions = { closeOn: 'pointerdown' };

let bubbleListener: ((e: KeyboardEvent) => void) | undefined;
afterEach(() => {
  if (bubbleListener) document.removeEventListener('keydown', bubbleListener);
  bubbleListener = undefined;
});

describe('useDismiss: Escape (CHORE6)', () => {
  test.each([CLICK, POINTERDOWN])('Escape closes the pop-up (closeOn: $closeOn)', async (options) => {
    const { onDismiss, user, inside } = setUp(options);
    inside.focus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('escape');
  });

  test('other keys do not close it', async () => {
    const { onDismiss, user, inside } = setUp(CLICK);
    inside.focus();
    await user.keyboard('{Enter}a{ArrowDown}');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('with escapeFirst, Escape closes the pop-up and never reaches a listener that hears it later (e.g. the panel behind the menu)', async () => {
    const { onDismiss, user, inside } = setUp({ ...POINTERDOWN, escapeFirst: true });
    bubbleListener = vi.fn();
    document.addEventListener('keydown', bubbleListener);
    inside.focus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledWith('escape');
    expect(bubbleListener).not.toHaveBeenCalled();
  });

  test('without escapeFirst, Escape closes the pop-up and still reaches later listeners', async () => {
    const { onDismiss, user, inside } = setUp(CLICK);
    bubbleListener = vi.fn();
    document.addEventListener('keydown', bubbleListener);
    inside.focus();
    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledWith('escape');
    expect(bubbleListener).toHaveBeenCalledTimes(1);
  });
});

describe('useDismiss: presses outside and inside (CHORE6)', () => {
  test.each([CLICK, POINTERDOWN])('a click outside closes the pop-up (closeOn: $closeOn)', async (options) => {
    const { onDismiss, user, outside } = setUp(options);
    await user.click(outside);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test('with closeOn: pointerdown, it closes the moment a press outside starts, before any click', () => {
    const { onDismiss, outside } = setUp(POINTERDOWN);
    fireEvent.pointerDown(outside);
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test('with closeOn: click, a press outside that has not ended yet does not close it; the click does', () => {
    const { onDismiss, outside } = setUp(CLICK);
    fireEvent.pointerDown(outside);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.click(outside, { detail: 1 });
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test.each([CLICK, POINTERDOWN])('a click inside does not close it (closeOn: $closeOn)', async (options) => {
    const { onDismiss, user, inside } = setUp(options);
    await user.click(inside);
    await user.click(screen.getByRole('dialog', { name: 'Pop-up' }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('with closeOn: click, a keyboard click outside (Enter on a button, detail 0) closes it', async () => {
    const { onDismiss, user, outside } = setUp(CLICK);
    outside.focus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });
});

describe('useDismiss: a press that starts inside and ends outside (ADJ2_5, closeOn: click) (CHORE6)', () => {
  test('a press that starts inside and ends outside does not close it, but the next click outside does', async () => {
    const { onDismiss, user, inside, outside } = setUp(CLICK);
    fireEvent.pointerDown(inside);
    fireEvent.pointerUp(outside);
    // The browser sends the click for that press to what holds both ends, which is outside the pop-up.
    fireEvent.click(outside.parentElement!, { detail: 1 });
    expect(onDismiss).not.toHaveBeenCalled();

    await user.click(outside);
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test('after a press inside, a keyboard click outside (detail 0) still closes it', () => {
    const { onDismiss, inside, outside } = setUp(CLICK);
    fireEvent.pointerDown(inside);
    fireEvent.pointerUp(outside);
    fireEvent.click(outside, { detail: 0 });
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test.each(['pointerCancel', 'dragStart'] as const)(
    'after a press inside is ended by the browser (%s), the next click outside closes it',
    (ending) => {
      const { onDismiss, inside, outside } = setUp(CLICK);
      fireEvent.pointerDown(inside);
      fireEvent[ending](inside);
      fireEvent.click(outside, { detail: 1 });
      expect(onDismiss).toHaveBeenCalledWith('outside');
    },
  );
});

describe('useDismiss: ignored elements (CHORE6)', () => {
  test.each([CLICK, POINTERDOWN])(
    'a press on an element matching ignore (or on something inside it) does not count as outside (closeOn: $closeOn)',
    async (options) => {
      const { onDismiss, user, ignored } = setUp({ ...options, ignore: '[data-keep-open]' });
      await user.click(ignored);
      await user.click(screen.getByRole('button', { name: 'Ignored' }));
      expect(onDismiss).not.toHaveBeenCalled();
    },
  );

  test('a press that starts on an ignored element and ends outside does not close it either (closeOn: click)', () => {
    const { onDismiss, ignored, outside } = setUp({ ...CLICK, ignore: '[data-keep-open]' });
    fireEvent.pointerDown(ignored);
    fireEvent.click(outside, { detail: 1 });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test.each([CLICK, POINTERDOWN])(
    'without ignore, a press on that element counts as outside (closeOn: $closeOn)',
    async (options) => {
      const { onDismiss, user, ignored } = setUp(options);
      await user.click(ignored);
      expect(onDismiss).toHaveBeenCalledWith('outside');
    },
  );
});

describe('useDismiss: switched off (CHORE6)', () => {
  test.each([CLICK, POINTERDOWN])(
    'with enabled: false, neither Escape nor a press outside closes it (closeOn: $closeOn)',
    async (options) => {
      const { onDismiss, user, inside, outside } = setUp({ ...options, enabled: false });
      inside.focus();
      await user.keyboard('{Escape}');
      await user.click(outside);
      fireEvent.click(outside, { detail: 0 });
      expect(onDismiss).not.toHaveBeenCalled();
    },
  );

  test('when it is switched on again, it listens again', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PopUp onDismiss={onDismiss} options={{ ...CLICK, enabled: false }} />);
    rerender(<PopUp onDismiss={onDismiss} options={{ ...CLICK, enabled: true }} />);
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(onDismiss).toHaveBeenCalledWith('outside');
  });

  test.each([CLICK, POINTERDOWN])(
    'once the pop-up is gone (unmounted), it no longer listens (closeOn: $closeOn)',
    async (options) => {
      const { onDismiss, view, user } = setUp(options);
      view.unmount();
      await user.keyboard('{Escape}');
      fireEvent.pointerDown(document.body);
      fireEvent.click(document.body, { detail: 0 });
      expect(onDismiss).not.toHaveBeenCalled();
    },
  );
});
