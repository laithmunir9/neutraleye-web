import ReadMode from "./ReadMode";
import WriteMode from "./WriteMode";

/*
 * The homepage's two modes, in tab order. The first entry is the default.
 *
 * Each mode owns everything inside the slot; the tabs, the prompt line and the
 * slot's position belong to Workbench and never move. Write's slot is only a
 * way in: the writing dashboard itself lives at /write.
 */
export const MODES = [
  {
    id: "read",
    label: "Read",
    prompt: "See how any article frames the story.",
    Component: ReadMode,
  },
  {
    id: "write",
    label: "Write",
    prompt: "For the drafts you write yourself.",
    Component: WriteMode,
  },
];

export const DEFAULT_MODE = MODES[0].id;

export function resolveMode(value) {
  return MODES.some((mode) => mode.id === value) ? value : DEFAULT_MODE;
}
