/**
 * @jest-environment node
 */

// ── A stand-in for the user's Supabase session ─────────────────────────────

let mockUser = null;
let mockDraft = null;
let mockDailyCount = 0;
const mockUpdates = [];
const mockCreate = jest.fn();

function mockBuilder(table) {
  const op = { table, filters: {} };
  const chain = {
    select() { return chain; },
    update(values) { op.update = values; return chain; },
    eq(column, value) { op.filters[column] = value; return chain; },
    maybeSingle() {
      if (table === "daily_usage") return Promise.resolve({ data: { count: mockDailyCount }, error: null });
      // RLS: only the owner's draft comes back.
      const row = mockDraft && mockDraft.user_id === mockUser?.id && mockDraft.id === op.filters.id ? mockDraft : null;
      return Promise.resolve({ data: row, error: null });
    },
    single() {
      mockUpdates.push(op);
      return Promise.resolve({ data: { updated_at: "2026-10-23T12:00:00Z" }, error: null });
    },
  };
  return chain;
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: (table) => mockBuilder(table),
    rpc: async () => ({ data: 1, error: null }),
  }),
}));
jest.mock("openai", () => jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } })));
jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

import { POST } from "../route";

const DRAFT_ID = "6f1c2a3b-1111-4222-8333-944445555666";
const TEXT = Array.from({ length: 6 }, () => "The council's plan is a short-sighted raid on the library.").join(" ");

let mockIpCounter = 0;
function request(body, ip = `10.0.${Math.floor(mockIpCounter / 250)}.${mockIpCounter++ % 250}`) {
  return new Request("http://localhost/api/write/review", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockUser = { id: "user-a" };
  mockDraft = { id: DRAFT_ID, user_id: "user-a", kind: "opinion", target: null, topic: null, content_text: TEXT, word_count: 66 };
  mockDailyCount = 0;
  mockUpdates.length = 0;
  mockCreate.mockReset().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ summary: "Sum.", findings: [{ quote: "short-sighted raid", label: "loaded_wording", question: "Does the word do the arguing?" }], target_notes: [] }) } }],
  });
  jest.spyOn(console, "info").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/write/review auth", () => {
  test("refuses a signed-out request before touching the draft or the model", async () => {
    mockUser = null;
    const response = await POST(request({ draftId: DRAFT_ID }));
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe("UNAUTHENTICATED");
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdates).toHaveLength(0);
  });

  test("signed-out requests are rate limited too, per IP", async () => {
    mockUser = null;
    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await POST(request({ draftId: DRAFT_ID }, "192.0.2.7"))).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  test("another user's draft reads as not found, and nothing is checked or saved", async () => {
    mockUser = { id: "user-b" };
    const response = await POST(request({ draftId: DRAFT_ID }));
    expect(response.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdates).toHaveLength(0);
  });
});

describe("POST /api/write/review", () => {
  test("checks the owner's draft and saves the review to the draft", async () => {
    const response = await POST(request({ draftId: DRAFT_ID }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.review.findings).toEqual([{ quote: "short-sighted raid", label: "loaded_wording", question: "Does the word do the arguing?" }]);
    expect(body.review.kind).toBe("opinion");
    expect(mockUpdates).toHaveLength(1);
    expect(mockUpdates[0].filters.id).toBe(DRAFT_ID);
    expect(mockUpdates[0].update.last_review).toEqual(body.review);
    expect(mockUpdates[0].update.last_reviewed_at).toBe(body.last_reviewed_at);
  });

  test("never logs the draft text", async () => {
    await POST(request({ draftId: DRAFT_ID }));
    const lines = [console.info, console.warn, console.error].flatMap((fn) => fn.mock.calls.map(([line]) => String(line)));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line).not.toContain("short-sighted");
  });

  test("shares Read's daily limit", async () => {
    mockDailyCount = 10;
    const response = await POST(request({ draftId: DRAFT_ID }));
    expect(response.status).toBe(429);
    expect((await response.json()).code).toBe("DAILY_LIMIT_REACHED");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rejects a missing or malformed draftId", async () => {
    expect((await POST(request({}))).status).toBe(400);
    expect((await POST(request({ draftId: "not-a-uuid" }))).status).toBe(400);
  });

  test("asks for more words before checking a very short draft", async () => {
    mockDraft = { ...mockDraft, content_text: "Too short.", word_count: 2 };
    const response = await POST(request({ draftId: DRAFT_ID }));
    expect(response.status).toBe(422);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
