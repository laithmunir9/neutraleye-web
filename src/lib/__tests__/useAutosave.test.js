import { act, renderHook } from "@testing-library/react";
import { useAutosave } from "@/lib/useAutosave";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

test("saves once, about 1.5 seconds after the last change, with the changes merged", async () => {
  const save = jest.fn().mockResolvedValue({});
  const { result } = renderHook(() => useAutosave(save));

  act(() => result.current.schedule({ content_text: "The council" }));
  act(() => jest.advanceTimersByTime(1000));
  act(() => result.current.schedule({ content_text: "The council voted", title: "Budget" }));
  expect(result.current.status).toBe("saving");
  act(() => jest.advanceTimersByTime(1400));
  expect(save).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(100));
  await settle();
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith({ content_text: "The council voted", title: "Budget" });
  expect(result.current.status).toBe("saved");
});

test("flush saves at once, as on blur", async () => {
  const save = jest.fn().mockResolvedValue({});
  const { result } = renderHook(() => useAutosave(save));
  act(() => result.current.schedule({ title: "Now" }));
  await act(() => result.current.flush());
  expect(save).toHaveBeenCalledWith({ title: "Now" });
});

test("a failed save is kept and retried with the next change, not in a loop", async () => {
  const save = jest.fn().mockResolvedValueOnce({ error: { code: "08006" } }).mockResolvedValue({});
  const { result } = renderHook(() => useAutosave(save));

  act(() => result.current.schedule({ content_text: "first" }));
  await act(() => result.current.flush());
  expect(result.current.status).toBe("error");
  expect(save).toHaveBeenCalledTimes(1);

  act(() => result.current.schedule({ title: "Second" }));
  await act(() => result.current.flush());
  expect(save).toHaveBeenLastCalledWith({ content_text: "first", title: "Second" });
  expect(result.current.status).toBe("saved");
});

test("saves never overlap: a change during a save goes out after it", async () => {
  let finish;
  const save = jest.fn().mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; })).mockResolvedValue({});
  const { result } = renderHook(() => useAutosave(save));

  act(() => result.current.schedule({ content_text: "one" }));
  let first;
  act(() => { first = result.current.flush(); });
  act(() => result.current.schedule({ content_text: "two" }));
  let second;
  act(() => { second = result.current.flush(); });
  expect(save).toHaveBeenCalledTimes(1);

  await act(async () => { finish({}); await first; await second; });
  expect(save).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenLastCalledWith({ content_text: "two" });
});

test("leaving the draft saves what is waiting", async () => {
  const save = jest.fn().mockResolvedValue({});
  const { result, unmount } = renderHook(() => useAutosave(save));
  act(() => result.current.schedule({ content_text: "unsaved" }));
  unmount();
  await settle();
  expect(save).toHaveBeenCalledWith({ content_text: "unsaved" });
});

test("asks before closing the page while something is unsaved", () => {
  const save = jest.fn().mockResolvedValue({});
  const { result } = renderHook(() => useAutosave(save));
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);

  act(() => result.current.schedule({ content_text: "unsaved" }));
  const dirty = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
});
