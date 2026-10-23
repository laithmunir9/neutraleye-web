import { Editor } from "@tiptap/core";
import { draftExtensions } from "../editorExtensions";

function makeEditor(content) {
  return new Editor({ extensions: draftExtensions, content });
}

describe("the draft editor's formatting", () => {
  test("allows only bold, italic and underline marks", () => {
    const editor = makeEditor("<p>x</p>");
    expect(Object.keys(editor.schema.marks).sort()).toEqual(["bold", "italic", "underline"]);
    editor.destroy();
  });

  test("allows only paragraphs and line breaks as blocks", () => {
    const editor = makeEditor("<p>x</p>");
    expect(Object.keys(editor.schema.nodes).sort()).toEqual(["doc", "hardBreak", "paragraph", "text"]);
    editor.destroy();
  });

  test("pasted headings, lists, quotes, links and code arrive as plain paragraphs", () => {
    const editor = makeEditor(
      '<h1>Head</h1><ul><li>Item</li></ul><blockquote><p>Quote</p></blockquote><p><a href="https://x.com">link</a> <code>code</code> <s>gone</s></p>'
    );
    const types = new Set();
    editor.state.doc.descendants((node) => {
      types.add(node.type.name);
      node.marks.forEach((mark) => types.add(`mark:${mark.type.name}`));
    });
    expect([...types].sort()).toEqual(["paragraph", "text"]);
    expect(editor.getText()).toContain("Head");
    expect(editor.getText()).toContain("link");
    editor.destroy();
  });

  test("aligns paragraphs left, center or right, and nothing else", () => {
    const editor = makeEditor("<p>x</p>");
    expect(editor.commands.setTextAlign("center")).toBe(true);
    expect(editor.getJSON().content[0].attrs.textAlign).toBe("center");
    expect(editor.commands.setTextAlign("justify")).toBe(false);
    editor.destroy();
  });

  test("formatting and undo work", () => {
    const editor = makeEditor("<p>word</p>");
    editor.chain().selectAll().toggleBold().toggleItalic().toggleUnderline().run();
    expect(editor.getHTML()).toBe("<p><strong><em><u>word</u></em></strong></p>");
    editor.commands.undo();
    expect(editor.getHTML()).toBe("<p>word</p>");
    editor.destroy();
  });
});
