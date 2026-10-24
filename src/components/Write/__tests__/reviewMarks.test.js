import { Editor } from "@tiptap/core";
import { draftExtensions } from "../editorExtensions";
import { BLOCK_SEPARATOR, createReviewMarks, findingRanges, reviewMarksKey, textWithPositions } from "../reviewMarks";

const HTML =
  "<p>The plan is a <strong>short-sighted raid</strong> on the library.</p><p></p><p>Line one<br>line two. Visits have risen.</p>";

function makeEditor() {
  return new Editor({ element: document.createElement("div"), extensions: draftExtensions, content: HTML });
}

describe("review marks", () => {
  test("builds exactly the text the server checks quotes against", () => {
    const editor = makeEditor();
    expect(textWithPositions(editor.state.doc).text).toBe(editor.getText({ blockSeparator: BLOCK_SEPARATOR }));
    editor.destroy();
  });

  test("maps each quote to its range on the sheet, across formatting", () => {
    const editor = makeEditor();
    const [raid, visits, missing] = findingRanges(editor.state.doc, [
      { quote: "a short-sighted raid on" },
      { quote: "Visits have risen." },
      { quote: "not in the draft" },
    ]);
    expect(editor.state.doc.textBetween(raid.from, raid.to)).toBe("a short-sighted raid on");
    expect(editor.state.doc.textBetween(visits.from, visits.to)).toBe("Visits have risen.");
    expect(raid.number).toBe(1);
    expect(missing).toBeNull();
    editor.destroy();
  });

  test("marks passages with numbers, strengthens the chosen one, and leaves the draft unchanged", () => {
    const editor = makeEditor();
    const before = editor.getJSON();
    const ranges = findingRanges(editor.state.doc, [{ quote: "short-sighted raid" }, { quote: "Visits have risen." }]);
    editor.registerPlugin(createReviewMarks(ranges, { mark: "m", active: "a", number: "n" }));

    const dom = editor.view.dom;
    expect([...dom.querySelectorAll("[data-finding]")].map((el) => el.textContent)).toEqual(["short-sighted raid", "Visits have risen."]);
    expect([...dom.querySelectorAll("sup.n")].map((el) => el.textContent)).toEqual(["1", "2"]);

    editor.view.dispatch(editor.state.tr.setMeta(reviewMarksKey, { active: 2 }));
    expect(dom.querySelector('[data-finding="2"]').className).toBe("m a");
    expect(dom.querySelector('[data-finding="1"]').className).toBe("m");

    editor.unregisterPlugin(reviewMarksKey);
    expect(dom.querySelectorAll("[data-finding], sup.n")).toHaveLength(0);
    expect(editor.getJSON()).toEqual(before);
    editor.destroy();
  });
});
