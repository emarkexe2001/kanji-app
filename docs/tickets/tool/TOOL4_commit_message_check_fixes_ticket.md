Ticket Code:
TOOL4

Feature Name:
Commit Message Check Fixes

Origin:
Peer review of PR #19 (TOOL3, commit message check). The check works, but the review found messages it wrongly rejects, and a few gaps in how merges and failures are handled.

Feature Description:
As a developer I would like the commit message check to only reject messages that really break standards 5.5, and to tell me what to do when it fails in CI, so I can trust it and never have to work around it.

Feature Requirements / Expected Behaviours:
Descriptions that look like trailers are accepted. Today a last paragraph whose lines all look like `Key: value` is treated as a trailer block, so `Note: this fixes the bug` or `Fixes: #12` on its own is rejected as "no description". Only treat known trailer names (e.g. Co-Authored-By, Signed-off-by, Reviewed-by, Refs, Fixes, Closes) as trailers, or require a description paragraph before the trailer block (scripts/check-commit-message.ts, TRAILER_LINE and hasDescription)
The hook and CI agree on lines starting with `#`. Today the hook drops every `#` line, but `git commit -F` and `-m` keep them, so a title like `#12 Fix bug` or a `# Why` line in the body is rejected locally but passes in CI. Only strip git's own editor template (the `#` lines git adds when it opens an editor) and the `--verbose` diff below the scissors line, and respect `core.commentChar` if set
Title length is counted in characters, not UTF-16 units (`[...title].length`), so an emoji counts as 1
In CI (--range mode), only commits that really have more than one parent are treated as merge commits. A single-parent commit whose title starts with "Merge" goes through the normal rules. The hook (--file mode) keeps the title check, since it can't see parents
`fixup!` and `squash!` commits stay rejected (we don't rebase, so they can't be squashed). Add a test and a line in standards 5.5 saying so
A failure in CI ends with what to do next: pushed commits can't be rewritten (no force-push), so move the work to a new branch with fixed commits and open a new pull request (standards 5.5)
Unit tests in scripts/test/check-commit-message.test.ts for every case above

Possible Test Scenarios I would like to see:

When I commit with a description of `Note: this fixes the bug`, the commit succeeds

When I commit with a title only and a `Co-Authored-By:` trailer, the hook still rejects it for having no description

When I commit with `git commit -F` and the title `#12 Fix the card limit`, the hook and CI both accept it

When I commit with a title of 72 characters that includes an emoji, the commit succeeds

When a pushed single-parent commit has the title "Merge" followed by more than 72 characters and no description, CI fails and names it

When CI fails on a commit, the output tells me to move the work to a new branch and open a new pull request

Dependencies:
TOOL3 (PR #19) merged.

Branch name Examples:
fix/commit-message-check-rules
