import { getTextSerializersFromSchema } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/*
 * The numbered marks on the sheet during a review. The server checks each
 * quote against content_text, which is the editor's getText with "\n\n"
 * between blocks; this walks the document the same way, keeping the document
 * position of every character, so a quote found in that text maps back to a
 * range on the sheet. Marks are decorations only: the draft is not changed.
 */

export const BLOCK_SEPARATOR = "\n\n";
export const reviewMarksKey = new PluginKey("reviewMarks");

/** The draft's text exactly as getText({ blockSeparator }) builds it, plus each character's position. */
export function textWithPositions(doc) {
  const serializers = getTextSerializersFromSchema(doc.type.schema);
  const range = { from: 0, to: doc.content.size };
  let text = "";
  const positions = [];
  const push = (value, pos) => {
    text += value;
    for (let i = 0; i < value.length; i += 1) positions.push(pos === null ? null : pos + i);
  };

  doc.nodesBetween(range.from, range.to, (node, pos, parent, index) => {
    if (node.isBlock && pos > range.from) push(BLOCK_SEPARATOR, null);
    const serializer = serializers[node.type.name];
    if (serializer) {
      if (parent) push(serializer({ node, pos, parent, index, range }), null);
      return false;
    }
    if (node.isText) push(node.text, pos);
    return true;
  });
  return { text, positions };
}

/** One { from, to, number } per finding, or null where a quote is not on the sheet. */
export function findingRanges(doc, findings) {
  const { text, positions } = textWithPositions(doc);
  return findings.map((finding, index) => {
    const start = text.indexOf(finding.quote);
    if (start === -1 || !finding.quote) return null;
    const end = start + finding.quote.length;
    let first = start;
    while (first < end && positions[first] === null) first += 1;
    let last = end - 1;
    while (last >= first && positions[last] === null) last -= 1;
    if (first > last) return null;
    return { from: positions[first], to: positions[last] + 1, number: index + 1 };
  });
}

function numberWidget(number, className) {
  return () => {
    const sup = document.createElement("sup");
    sup.className = className;
    sup.textContent = String(number);
    sup.setAttribute("aria-hidden", "true");
    return sup;
  };
}

/** `classes`: { mark, active, number }. */
export function createReviewMarks(ranges, classes) {
  return new Plugin({
    key: reviewMarksKey,
    state: {
      init: () => ({ active: null }),
      apply: (tr, value) => tr.getMeta(reviewMarksKey) || value,
    },
    props: {
      decorations(state) {
        const { active } = reviewMarksKey.getState(state);
        const decorations = [];
        for (const range of ranges) {
          if (!range) continue;
          decorations.push(
            Decoration.inline(range.from, range.to, {
              class: range.number === active ? `${classes.mark} ${classes.active}` : classes.mark,
              "data-finding": String(range.number),
            }),
            Decoration.widget(range.to, numberWidget(range.number, classes.number), {
              side: 1,
              key: `finding-${range.number}`,
            })
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
