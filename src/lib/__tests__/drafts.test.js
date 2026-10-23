/**
 * @jest-environment node
 */
jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

import * as Sentry from "@sentry/nextjs";
import { KINDS, countWords, draftStatusLine, kindOf, notesCount, reportDraftError } from "@/lib/drafts";

const NOW = new Date(2026, 9, 23, 15, 0);

describe("draftStatusLine", () => {
  test("an unchecked draft", () => {
    expect(draftStatusLine({ kind: "essay", last_reviewed_at: null }, NOW)).toBe("Essay · Not checked yet");
  });

  test("checked today, with its notes", () => {
    const draft = { kind: "opinion", last_reviewed_at: new Date(2026, 9, 23, 9, 30).toISOString(), last_review: { findings: [1, 2, 3, 4] } };
    expect(draftStatusLine(draft, NOW)).toBe("Opinion · Checked today · 4 notes");
  });

  test("checked on an earlier day, one note", () => {
    const draft = { kind: "news", last_reviewed_at: new Date(2026, 9, 12, 10).toISOString(), last_review: { findings: [1] } };
    expect(draftStatusLine(draft, NOW)).toBe("News · Checked Oct 12 · 1 note");
  });

  test("checked in another year shows the year", () => {
    const draft = { kind: "news", last_reviewed_at: new Date(2025, 11, 30, 10).toISOString(), last_review: { findings: [] } };
    expect(draftStatusLine(draft, NOW)).toBe("News · Checked Dec 30, 2025 · 0 notes");
  });
});

describe("drafts helpers", () => {
  test("counts words across lines and spacing", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("The council  voted.\n\nIt was close.")).toBe(6);
  });

  test("notes come from the review's findings, and none without a review", () => {
    expect(notesCount(null)).toBe(0);
    expect(notesCount({ findings: [1, 2] })).toBe(2);
  });

  test("an unknown kind falls back to essay", () => {
    expect(kindOf("poem").id).toBe("essay");
  });

  test("every standard is framing language: no 'bias', no em dashes", () => {
    for (const kind of KINDS) {
      expect(kind.standard).toMatch(new RegExp(`^${kind.label}: `));
      expect(kind.standard).not.toMatch(/bias/i);
      expect(kind.standard).not.toMatch(/—/);
    }
  });

  test("errors reach Sentry by action and code only, never with draft text", () => {
    reportDraftError({ code: "42501", message: "The council rammed through its budget" }, "save");
    const [error, context] = Sentry.captureException.mock.calls[0];
    expect(error.message).toBe("Draft save failed");
    expect(context).toEqual({ tags: { area: "write", draft_action: "save", code: "42501" } });
    expect(JSON.stringify(Sentry.captureException.mock.calls)).not.toMatch(/council/);
  });
});
