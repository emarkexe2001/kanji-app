// CHORE10, agreed answer 1: SAMPLE_WORDS is deleted, with its export from @kanji/core.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as core from '../../src/index';

test('@kanji/core no longer exports SAMPLE_WORDS', () => {
  assert.equal('SAMPLE_WORDS' in core, false);
});

test('packages/core/src/samples.ts is gone', () => {
  assert.equal(existsSync(new URL('../../src/samples.ts', import.meta.url)), false);
});
