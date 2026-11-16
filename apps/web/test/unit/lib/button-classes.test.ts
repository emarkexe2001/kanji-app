import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buttonClass, type ButtonSize, type ButtonVariant } from '../../../src/lib/button-classes';

// CHORE7: buttonClass(variant, size) gives a filled button's whole look in Light, Dark and High
// contrast. The class names are the look (jsdom and Node draw no colours), so they are checked
// here; color-mode-css.test.ts checks Tailwind generates them.

const VARIANTS: ButtonVariant[] = ['sky', 'indigo', 'emerald', 'rose'];
const SIZES: ButtonSize[] = ['header', 'full', 'panel'];

const classesOf = (variant: ButtonVariant, size: ButtonSize) => buttonClass(variant, size).split(' ');

/** Rounded, bold, a shadow, and the small press-in: on every filled button. */
const BASE = ['rounded-xl', 'font-semibold', 'shadow-sm', 'transition', 'active:scale-95'];

/** The colour and its lighter hover, with white text (the same in Light and Dark). */
const COLOUR: Record<ButtonVariant, string[]> = {
  sky: ['bg-sky-600', 'text-white', 'hover:bg-sky-500'],
  indigo: ['bg-indigo-600', 'text-white', 'hover:bg-indigo-500'],
  emerald: ['bg-emerald-600', 'text-white', 'hover:bg-emerald-500'],
  rose: ['bg-rose-600', 'text-white', 'hover:bg-rose-500'],
};

/** High contrast: black, no shadow, a 2px outline drawn inside it, and the #262626 hover fill. */
const HC_SHARED = ['hc:bg-page', 'hc:shadow-none', 'hc:ring-2', 'hc:ring-inset', 'hc:hover:bg-hc-hover'];

/** Each colour's High contrast outline and text: white text, except Clear List's red that turns white under the pointer. */
const HC_OWN: Record<ButtonVariant, string[]> = {
  sky: ['hc:text-ink', 'hc:ring-hc-sky'],
  indigo: ['hc:text-ink', 'hc:ring-hc-indigo'],
  emerald: ['hc:text-ink', 'hc:ring-hc-emerald'],
  rose: ['hc:text-hc-rose', 'hc:ring-hc-rose', 'hc:hover:text-ink'],
};

const SIZE: Record<ButtonSize, string[]> = {
  header: ['px-4', 'py-2', 'text-sm'],
  full: ['px-4', 'py-3'],
  panel: ['px-2', 'py-2', 'text-sm'],
};

const sorted = (classes: string[]) => [...classes].sort();

for (const variant of VARIANTS) {
  test(`${variant}: the ${variant}-600 colour, the lighter ${variant}-500 under the pointer and white text, at every size`, () => {
    for (const size of SIZES) {
      const classes = classesOf(variant, size);
      for (const cls of COLOUR[variant]) assert.ok(classes.includes(cls), `${variant} ${size} is missing ${cls}`);
      // No other colour's background or hover.
      const otherColours = classes.filter((c) => /^(hover:)?bg-\w+-\d+$/.test(c) && !COLOUR[variant].includes(c));
      assert.deepEqual(otherColours, [], `${variant} ${size} has another colour`);
    }
  });

  test(`${variant}: in High contrast it is black with a 2px ${variant} outline inside it, no shadow and the hover fill, at every size`, () => {
    for (const size of SIZES) {
      const classes = classesOf(variant, size);
      for (const cls of [...HC_SHARED, ...HC_OWN[variant]]) {
        assert.ok(classes.includes(cls), `${variant} ${size} is missing ${cls}`);
      }
      // Exactly one outline colour, and it's this button's.
      assert.deepEqual(
        classes.filter((c) => c.startsWith('hc:ring-hc-')),
        [`hc:ring-hc-${variant}`],
      );
    }
  });

  test(`${variant}: in High contrast it has exactly one text colour at rest`, () => {
    // Two hc: text colours on one button would be decided by their order in the built CSS
    // (FEAT5_5 review R1), so each variant has exactly one.
    const expected = variant === 'rose' ? 'hc:text-hc-rose' : 'hc:text-ink';
    for (const size of SIZES) {
      assert.deepEqual(
        classesOf(variant, size).filter((c) => c.startsWith('hc:text-')),
        [expected],
      );
    }
  });
}

test('rose (Clear List and "Yes, Clear List"): red text in High contrast that turns white under the pointer; the other colours keep white text', () => {
  for (const size of SIZES) {
    assert.ok(classesOf('rose', size).includes('hc:hover:text-ink'));
    for (const variant of ['sky', 'indigo', 'emerald'] as const) {
      assert.ok(!classesOf(variant, size).includes('hc:hover:text-ink'), `${variant} ${size}`);
      assert.ok(!classesOf(variant, size).includes('hc:text-hc-rose'), `${variant} ${size}`);
    }
  }
});

test('header size ("Shuffled out (N)"): px-4 py-2 and small text', () => {
  for (const variant of VARIANTS) {
    const classes = classesOf(variant, 'header');
    for (const cls of ['px-4', 'py-2', 'text-sm']) assert.ok(classes.includes(cls), `${variant} is missing ${cls}`);
  }
});

test('full size (Deck Shuffle, Shuffle In Cards): px-4 py-3 and normal-size text (no text-sm)', () => {
  for (const variant of VARIANTS) {
    const classes = classesOf(variant, 'full');
    for (const cls of ['px-4', 'py-3']) assert.ok(classes.includes(cls), `${variant} is missing ${cls}`);
    assert.ok(!classes.includes('text-sm'), `${variant} has text-sm`);
  }
});

test('panel size (the Shuffled-out panel buttons): px-2 py-2 and small text', () => {
  for (const variant of VARIANTS) {
    const classes = classesOf(variant, 'panel');
    for (const cls of ['px-2', 'py-2', 'text-sm']) assert.ok(classes.includes(cls), `${variant} is missing ${cls}`);
  }
});

test('each size has exactly one side and one top/bottom padding, so no two padding classes compete', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const classes = classesOf(variant, size);
      assert.equal(classes.filter((c) => /^px-/.test(c)).length, 1, `${variant} ${size} px`);
      assert.equal(classes.filter((c) => /^py-/.test(c)).length, 1, `${variant} ${size} py`);
    }
  }
});

test('every colour and size is rounded, bold, has a shadow and presses in a little', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const cls of BASE) assert.ok(classesOf(variant, size).includes(cls), `${variant} ${size} is missing ${cls}`);
    }
  }
});

test('each colour and size gives exactly its base, size, colour and High contrast classes, and nothing else', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      assert.deepEqual(
        sorted(classesOf(variant, size)),
        sorted([...BASE, ...SIZE[size], ...COLOUR[variant], ...HC_SHARED, ...HC_OWN[variant]]),
        `${variant} ${size}`,
      );
    }
  }
});

test('every class is written out in full, once, with single spaces between (so Tailwind finds each one)', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const value = buttonClass(variant, size);
      assert.equal(value, value.trim());
      assert.doesNotMatch(value, /\s{2}|\$\{|undefined|null/);
      const classes = classesOf(variant, size);
      assert.equal(new Set(classes).size, classes.length, `${variant} ${size} repeats a class`);
    }
  }
});
