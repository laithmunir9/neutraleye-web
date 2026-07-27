---
name: changelog-entry
description: Draft a new changelog entry for the NeutralEye changelog page from recent commits, following this repo's timeline format. Invoke with /changelog-entry.
disable-model-invocation: true
---

Draft a new entry for `src/app/changelog/page.js` (or wherever `CHANGELOG_ENTRIES`/equivalent data lives in that file — read it first to confirm the current shape rather than assuming).

Steps:

1. Read `src/app/changelog/page.js` to find the most recent entry's date and confirm the exact data shape (fields, type tags used).
2. Run `git log --since="<most recent entry's date>" --oneline` to see what's shipped since then. Read the actual diffs for anything non-obvious rather than guessing from commit subjects alone.
3. Group changes into the repo's existing type tags (New / Improved / Fixed — confirm exact tag names from the file, don't assume).
4. Write user-facing descriptions, not commit messages — no file paths, no internal function names, no "refactored X". Describe what changed for someone using the product.
5. Show the drafted entry to the user before editing the file. Do not guess at a release date — ask, or use today's date if the user confirms that's correct.
6. Skip anything purely internal (dependency bumps, test-only changes, CLAUDE.md edits) unless the user says otherwise.
