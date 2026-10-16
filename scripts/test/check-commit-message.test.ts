import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkCommitMessage, stripGitComments } from '../check-commit-message.ts';

const TRAILER = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';

describe('checkCommitMessage', () => {
  it('accepts a short title, a blank line and a description', () => {
    assert.deepEqual(checkCommitMessage('Add the shuffle button\n\nShuffles the deck in place.\n'), []);
  });

  it('accepts a description followed by a trailer', () => {
    assert.deepEqual(checkCommitMessage(`Add the shuffle button\n\nShuffles the deck.\n\n${TRAILER}\n`), []);
  });

  it('accepts Windows line endings', () => {
    assert.deepEqual(checkCommitMessage('Add the shuffle button\r\n\r\nShuffles the deck.\r\n'), []);
  });

  it('accepts a title of exactly 72 characters', () => {
    assert.deepEqual(checkCommitMessage(`${'a'.repeat(72)}\n\nDescription.`), []);
  });

  it('rejects a title longer than 72 characters', () => {
    const errors = checkCommitMessage(`${'a'.repeat(73)}\n\nDescription.`);
    assert.equal(errors.length, 1);
    assert.match(errors[0]!, /title is 73 characters long/);
  });

  it('rejects everything on one line as too long and missing a description', () => {
    const errors = checkCommitMessage(
      `Clear the card limit message when the user edits Typing in the field now clears the message. ${TRAILER}`,
    );
    assert.equal(errors.length, 2);
    assert.match(errors[0]!, /title is \d+ characters long/);
    assert.match(errors[1]!, /no description/);
  });

  it('rejects a description with no blank line after the title', () => {
    const errors = checkCommitMessage('Add the shuffle button\nShuffles the deck in place.\n');
    assert.deepEqual(errors, ['Line 2 must be blank, to separate the title from the description.']);
  });

  it('rejects a title with no description', () => {
    const errors = checkCommitMessage('Add the shuffle button\n');
    assert.equal(errors.length, 1);
    assert.match(errors[0]!, /no description/);
  });

  it('does not count a trailer on its own as the description', () => {
    const errors = checkCommitMessage(`Add the shuffle button\n\n${TRAILER}\n`);
    assert.equal(errors.length, 1);
    assert.match(errors[0]!, /no description/);
  });

  it('rejects an empty message', () => {
    assert.deepEqual(checkCommitMessage('\n\n'), ['The commit message is empty.']);
  });

  it('allows merge commits', () => {
    assert.deepEqual(checkCommitMessage("Merge remote-tracking branch 'origin/main' into feature/card-shuffle"), []);
    assert.deepEqual(
      checkCommitMessage('Merge pull request #16 from emarkexe2001/docs/commit-message-check-ticket'),
      [],
    );
  });

  it("allows git's own revert messages", () => {
    const title = `Revert "${'a'.repeat(80)}"`;
    assert.deepEqual(checkCommitMessage(`${title}\n\nThis reverts commit 70495e7.`), []);
  });
});

describe('stripGitComments', () => {
  it('removes comment lines git adds to the message file', () => {
    const file = 'Add the shuffle button\n\nShuffles the deck.\n# Please enter the commit message\n#\n';
    assert.deepEqual(checkCommitMessage(stripGitComments(file)), []);
    assert.equal(stripGitComments(file).includes('#'), false);
  });

  it('drops the diff that git commit --verbose adds', () => {
    const file = 'Title\n\nBody.\n# ------------------------ >8 ------------------------\ndiff --git a/x b/x\n';
    assert.equal(stripGitComments(file).trim(), 'Title\n\nBody.');
  });
});
