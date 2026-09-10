# NeutralEye visual language

The rules the product's own devices follow, so device number seven has something
to be consistent with.

This is not a component library and it does not replace the Design System section
of `CLAUDE.md`, which covers site chrome, button colour meaning and layout widths.
This covers the part no library can supply: the marks, diagrams and charts that
show the method. Every rule below is taken from something already in the code, and
each names its source. Where a rule is a proposal rather than current practice, it
says so.

---

## 1. The mark is the product

Everything else is chrome around it. If a page has one memorable element, it is a
marked passage.

**One definition.** Two stacked background layers, a tint and a 2px rule sitting on
the baseline, painted as backgrounds rather than a border or box-shadow so the
width can animate and the mark survives a line wrap intact.

```css
background-color: transparent;
background-image:
  linear-gradient(var(--fc-accent), var(--fc-accent)),
  linear-gradient(var(--fc-tint), var(--fc-tint));
background-size: 100% 2px, 100% 100%;
background-position: 0 100%, 0 0;
background-repeat: no-repeat;
padding: 0.08em 0.14em;
border-radius: 2px 2px 0 0;
box-decoration-break: clone;
```

Source: `src/components/Annotation/Annotation.module.css`. Also implemented in
`src/components/QuoteEvidence/` and in the extension's `popup.css`.

**Never a generic highlighter.** No yellow, no soft fill without the baseline rule,
no rounded pill. A highlighter says "someone found this interesting." The rule
along the baseline says "this is the evidence."

**Mark what the data actually supports.** `biased_phrases` returns a sentence, not
sub-spans, and `highlights` is empty on every path today. So the whole excerpt is
marked. Marking individual words inside a quote is a prompt change first, a
rendering change second. Do not fake sub-spans by string matching.

**The gloss belongs under the line, not beside it.** A highlight sits in the text;
a gloss interrupts it. The note is a sibling block under the marked line, tied back
to it with a 2px left rule in the tint. Source: `src/components/home/Interlinear.js`.

---

## 2. Colour

**Current state:** one accent, `--fc-accent: #0E5A5E`, does every job on the site.
That is most of why the product reads austere to people outside the core buyer.

**The rule that makes the rest possible:** the accent belongs to the mark. Once
accent means evidence and nothing else, every other role is free to take another
hue without ever competing with an annotation.

| Token | Value | Job |
|---|---|---|
| `--fc-accent` | `#0E5A5E` | marks, and the rule under them. Nothing else. |
| `--fc-tint` | `#E5F0F0` | the mark's wash |
| `--fc-heading` | `#0D0F10` | ink. Free actions the reader takes themselves. |
| `--brand-rgb` | `14 90 94` | same accent, for `rgb()/alpha` use |

**Open decision, not yet built: the five signals as a colour set.** The analysis has
four reason codes today (`language`, `framing`, `source`, `attribution`) rendered
through `driverLabelFromReason`. They currently all render in the same accent, so a
reader cannot tell signals apart at a glance in a matrix or a chart.

Giving each signal its own hue is the single highest-value colour decision
available, and it is only safe because of the rule above. Do not pick these hues in
isolation: they have to hold as a set at small sizes, in both themes, and against
the accent without any of them reading as a mark.

**Do not reintroduce the warm brown palette** (`#8b6741`, `#f8f4ee`, and the tan
`rgba(205, 188, 163, ...)` that survived in `QuoteEvidence` until this pass). It is
retired in both repos.

---

## 3. Type

Two roles, and the distinction carries meaning rather than decoration.

- **Text under discussion** is set in the serif. Quoted article text, marked
  passages, the finding.
- **The tool's own voice** is set in the sans. Labels, notes, counts, chrome.
- **The tool always speaks in smaller type than the text it discusses.** In the
  extension: quotes at 15px, notes at 12.5px. A companion annotates, it does not
  talk over. This is the reading-companion idea made structural instead of claimed
  in copy.

**Tracked caps are permitted in exactly one position:** the signal label on an
interlinear note, plus the other structural label cases listed in `CLAUDE.md`
(a matrix column head, a chart axis or series name, a source line above a quote).
They are not permitted as eyebrows above section headings. If you cannot tell which
case a label is, it is decorative and it goes.

---

## 4. Diagrams and charts

The gap this document exists to close. `ClaimPipeline`, `CoverageMatrixLive`,
`MethodCharts` and `ConfidenceScale` were each invented separately and do not share
a drawing language. Before building the next one, settle:

- **Stroke weights.** Pick two, a structural weight and an emphasis weight, and use
  only those. The mark's 2px baseline rule is the natural emphasis weight, which
  ties diagrams to the annotation without repeating it.
- **The selected state.** `CLAUDE.md` records that the matrix's drawn selection rule
  reads as a heavier border in a still frame because `.cellOn` already turns the
  whole border accent. Whatever the next device does, selection should read as
  *marked*, not *boxed*, because marking is the house gesture.
- **Labels sit outside the drawing bounds.** Leave room in the viewBox. Every label
  names a value the chart actually reaches.
- **Build unstyled.** If a charting library is ever added, it should supply scales
  and shapes and none of the look. Anything that ships its own visual language will
  fight this document.

---

## 5. Motion

**One orchestrated moment per surface.** The marks draw themselves in, once, on
result, staggered. That is the product's own gesture and it is the only motion
worth spending on.

Everything else is user-triggered: opening, expanding, confirming. Motion that
answers an action is welcome. Fade-and-slide-up entrances on every section and
hover transitions on every card are the generic default and read as generated.
Both were removed from the analyzer's result column in this pass.

All of it disabled outright under `prefers-reduced-motion`.

---

## 6. Nothing is a card

Border, fill, radius and shadow each say "separate object." Spend them by role,
lifting the one thing that needs lifting. One radius and one shadow stamped on
every block flattens the hierarchy and is the single most reliable tell of a
generated page.

Separation is a hairline and space until proven otherwise.

Radius token is `--control-radius`, never `--radius-*`. Tailwind v4 reserves that
namespace and tree-shakes any variable in it that no utility references, so a
`--radius-*` token is silently stripped while its `var()` usages ship. See
`CLAUDE.md` Known Issues.

---

## 7. The devices that exist

| Device | Lives in | Used on |
|---|---|---|
| `Annotation` | `src/components/Annotation/` | `/methodology`, `/reports` |
| `Interlinear` | `src/components/home/` | `/` |
| `CoverageMatrixLive` | `src/components/home/` | `/` |
| `MethodCharts` | `src/components/home/` | `/` |
| `ClaimPipeline` | `src/components/how-it-works/` | `/how-it-works` |
| `ConfidenceScale` | `src/components/methodology/` | `/methodology` |
| `QuoteEvidence` | `src/components/QuoteEvidence/` | `/analyze` |
| marked passages | `neutraleye-extension/popup.js` | the extension |

Until this pass, every device on that list lived on a page that sells the product
and none lived in the product. That is the imbalance this document exists to stop
recurring.

---

## 8. Where richness should come from

Not from a component library. Buttons, modals and tables are not what makes this
product look like itself, and adopting someone else's system means adopting their
identity, which is the one thing here worth protecting.

Richness comes from more devices, a wider palette for non-mark roles, and real
content in the empty columns. On that last point, `CLAUDE.md` warns against
inventing quantities to fill a margin, and that still holds: a display-scale number
is only worth setting when it is a real parameter or finding. Notes about marked
lines are genuine margin content, which is what changes now that the annotation is
in the product.
