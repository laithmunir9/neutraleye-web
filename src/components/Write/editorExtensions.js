import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

/*
 * The draft editor's whole schema: paragraphs and line breaks, bold, italic,
 * underline, and left, center or right alignment, with undo and redo.
 * StarterKit's headings, lists, quotes, code, strike, rules and links are off,
 * so pasted rich text comes in as plain paragraphs. StarterKit 3 bundles its
 * own underline; it is off in favour of the standalone extension.
 */
export const draftExtensions = [
  StarterKit.configure({
    heading: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    blockquote: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
  }),
  Underline,
  TextAlign.configure({ types: ["paragraph"], alignments: ["left", "center", "right"] }),
];
