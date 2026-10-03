import ReadMode from "./ReadMode";
import WaitlistMode from "./WaitlistMode";

/*
 * The homepage's two modes, in tab order. The first entry is the default.
 *
 * Each mode owns everything inside the slot; the tabs, the prompt line and the
 * slot's position belong to Workbench and never move. When the writing
 * companion ships, swapping WaitlistMode for the real component on the "write"
 * entry below is the whole change.
 */
export const MODES = [
  {
    id: "read",
    label: "Read",
    prompt: "Paste an article to see how it frames the story.",
    Component: ReadMode,
  },
  {
    id: "write",
    label: "Write",
    prompt: "For the drafts you write yourself.",
    Component: WaitlistMode,
  },
];

export const DEFAULT_MODE = MODES[0].id;

export function resolveMode(value) {
  return MODES.some((mode) => mode.id === value) ? value : DEFAULT_MODE;
}
