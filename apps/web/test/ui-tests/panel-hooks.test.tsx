// ADJ2_5: the hooks that place the deck card below the phone pop-up (usePanelClearance) and the
// panel below the header (usePanelTop): measuring, measuring again on resize, and cleaning up.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePanelClearance } from '../../src/features/deck/hooks/use-panel-clearance';
import { usePanelTop } from '../../src/features/deck/hooks/use-panel-top';
import { WIDE_LAYOUT_QUERY } from '../../src/features/deck/utils/wide-layout';

/** A stand-in for ResizeObserver (jsdom has none), recording what each one watches. */
class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  targets = new Set<Element>();
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.all.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.targets.clear();
  }
  /** Tells this observer that what it watches changed size. */
  fire() {
    act(() => this.callback([], this as unknown as ResizeObserver));
  }
}
const watching = (el: Element) => FakeResizeObserver.all.filter((o) => !o.disconnected && o.targets.has(el));

let wide = false;
function stubWide() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: wide && query === WIDE_LAYOUT_QUERY, media: query })),
  );
}

const resize = () => act(() => void window.dispatchEvent(new Event('resize')));

/** A made-up rectangle, as jsdom has no layout. */
const rect = (top: number, bottom: number) =>
  ({ top, bottom, left: 0, right: 300, width: 300, height: bottom - top, x: 0, y: top }) as DOMRect;

beforeEach(() => {
  wide = false;
  FakeResizeObserver.all = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  stubWide();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('usePanelClearance (keeps the deck card below the phone pop-up)', () => {
  /** A pop-up laid out at `top`, `height` tall, and the deck card's space starting at `areaTop`. */
  function setUp() {
    const layout = { top: 92, height: 260, areaTop: 200 };
    const panel = document.createElement('section');
    panel.id = 'panel';
    document.body.append(panel);
    Object.defineProperty(panel, 'offsetTop', { get: () => layout.top });
    Object.defineProperty(panel, 'offsetHeight', { get: () => layout.height });
    const area = document.createElement('div');
    document.body.append(area);
    const areaRect = vi.fn(() => rect(layout.areaTop, layout.areaTop + 400));
    area.getBoundingClientRect = areaRect;
    return { layout, panel, ref: { current: area }, areaRect };
  }

  test('while the pop-up is open, the deck card starts 12px below it; while it is closed, 0', () => {
    const { ref } = setUp();
    const { result, rerender } = renderHook(({ open }) => usePanelClearance(open, 'panel', ref), {
      initialProps: { open: false },
    });
    expect(result.current).toBe(0);
    rerender({ open: true });
    expect(result.current).toBe(92 + 260 + 12 - 200);
    rerender({ open: false });
    expect(result.current).toBe(0);
  });

  test('in the wide layout it is 0, as the panel floats beside the deck, and nothing is measured or watched', () => {
    const { panel, ref, areaRect } = setUp();
    const added = vi.spyOn(window, 'addEventListener');
    const { result } = renderHook(() => usePanelClearance(true, 'panel', ref, 92, true));
    expect(result.current).toBe(0);
    expect(areaRect).not.toHaveBeenCalled();
    expect(added.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
    expect(watching(panel)).toHaveLength(0);
  });

  test('it takes the wide layout from the deck (useWideLayout), not from its own media query', () => {
    // The screen's media query says wide, but the deck says it isn't: the deck is the one source.
    wide = true;
    const { ref } = setUp();
    const { result, rerender } = renderHook(({ isWide }) => usePanelClearance(true, 'panel', ref, 92, isWide), {
      initialProps: { isWide: false },
    });
    expect(result.current).toBe(92 + 260 + 12 - 200);
    // And the other way round: the deck says wide, the media query doesn't.
    wide = false;
    rerender({ isWide: true });
    expect(result.current).toBe(0);
  });

  test('when the window is resized, it is measured again, including going in and out of the wide layout', () => {
    const { layout, ref } = setUp();
    const { result, rerender } = renderHook(({ isWide }) => usePanelClearance(true, 'panel', ref, 92, isWide), {
      initialProps: { isWide: false },
    });

    layout.areaTop = 150;
    resize();
    expect(result.current).toBe(92 + 260 + 12 - 150);

    rerender({ isWide: true });
    resize();
    expect(result.current).toBe(0);

    rerender({ isWide: false });
    expect(result.current).toBe(92 + 260 + 12 - 150);
    layout.areaTop = 100;
    resize();
    expect(result.current).toBe(92 + 260 + 12 - 100);
  });

  test('when the pop-up changes size, it is measured again', () => {
    const { layout, panel, ref } = setUp();
    const { result } = renderHook(() => usePanelClearance(true, 'panel', ref));
    expect(watching(panel)).toHaveLength(1);

    layout.height = 200;
    watching(panel)[0].fire();
    expect(result.current).toBe(92 + 200 + 12 - 200);
  });

  test('when the pop-up moves (its top below the header changes), it is measured again', () => {
    const { layout, ref } = setUp();
    const { result, rerender } = renderHook(({ top }) => usePanelClearance(true, 'panel', ref, top), {
      initialProps: { top: 92 },
    });
    layout.top = 148;
    rerender({ top: 148 });
    expect(result.current).toBe(148 + 260 + 12 - 200);
  });

  test('it is never less than 0, e.g. when the deck card is already below the pop-up', () => {
    const { layout, ref } = setUp();
    layout.areaTop = 500;
    const { result } = renderHook(() => usePanelClearance(true, 'panel', ref));
    expect(result.current).toBe(0);
  });

  test.each([
    [
      'the pop-up closes',
      (r: { rerender: (p: { open: boolean }) => void; unmount: () => void }) => r.rerender({ open: false }),
    ],
    ['the deck goes away', (r: { rerender: (p: { open: boolean }) => void; unmount: () => void }) => r.unmount()],
  ])('when %s, it stops listening for resizes and watching the pop-up', (_, end) => {
    const { panel, ref, areaRect } = setUp();
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const hook = renderHook(({ open }) => usePanelClearance(open, 'panel', ref), { initialProps: { open: true } });
    const onResize = added.mock.calls.find(([type]) => type === 'resize')![1];
    const observer = watching(panel)[0];

    end(hook);

    expect(removed).toHaveBeenCalledWith('resize', onResize);
    expect(observer.disconnected).toBe(true);
    expect(watching(panel)).toHaveLength(0);
    // A resize after that doesn't measure anything.
    areaRect.mockClear();
    resize();
    expect(areaRect).not.toHaveBeenCalled();
  });

  test('where there is no ResizeObserver, it still works with resizes', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { layout, ref } = setUp();
    const { result } = renderHook(() => usePanelClearance(true, 'panel', ref));
    layout.areaTop = 100;
    resize();
    expect(result.current).toBe(92 + 260 + 12 - 100);
  });
});

describe('usePanelTop (puts the panel just below the header)', () => {
  function setUp() {
    const layout = { bottom: 80 };
    const header = document.createElement('header');
    document.body.append(header);
    const headerRect = vi.fn(() => rect(24, layout.bottom));
    header.getBoundingClientRect = headerRect;
    return { layout, header, headerRect };
  }

  test("the panel's top is 12px below the header's bottom edge", () => {
    const { header } = setUp();
    const { result } = renderHook(() => usePanelTop(true, header));
    expect(result.current).toBe(92);
  });

  test('when the header changes size (e.g. the title wraps onto three lines), it is measured again', () => {
    const { layout, header } = setUp();
    const { result } = renderHook(() => usePanelTop(true, header));
    layout.bottom = 136;
    watching(header)[0].fire();
    expect(result.current).toBe(148);
  });

  test('when the window is resized or zoomed, it is measured again', () => {
    const { layout, header } = setUp();
    const { result } = renderHook(() => usePanelTop(true, header));
    layout.bottom = 60;
    resize();
    expect(result.current).toBe(72);
  });

  test('while the panel is closed, or with no header, the header is not watched', () => {
    const { header } = setUp();
    renderHook(() => usePanelTop(false, header));
    expect(watching(header)).toHaveLength(0);
    const { result } = renderHook(() => usePanelTop(true, null));
    expect(result.current).toBe(0);
  });

  test.each([
    [
      'the panel closes',
      (r: { rerender: (p: { open: boolean }) => void; unmount: () => void }) => r.rerender({ open: false }),
    ],
    ['the deck goes away', (r: { rerender: (p: { open: boolean }) => void; unmount: () => void }) => r.unmount()],
  ])('when %s, it stops listening for resizes and watching the header', (_, end) => {
    const { header, headerRect } = setUp();
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const hook = renderHook(({ open }) => usePanelTop(open, header), { initialProps: { open: true } });
    const onResize = added.mock.calls.find(([type]) => type === 'resize')![1];
    const observer = watching(header)[0];

    end(hook);

    expect(removed).toHaveBeenCalledWith('resize', onResize);
    expect(observer.disconnected).toBe(true);
    headerRect.mockClear();
    resize();
    expect(headerRect).not.toHaveBeenCalled();
  });
});
