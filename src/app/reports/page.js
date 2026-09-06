import Link from "next/link";
import { BOOKING_URL } from "@/lib/content";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import Annotation from "@/components/for-comms/Annotation";
import styles from "../marketing.module.css";

export const metadata = {
  title: "Reports | NeutralEye",
  description:
    "A finished coverage report on a contested political primary, with the findings it produced and the checks each one had to pass first.",
};

/* This page used to open with the Honeywell earnings report, which the homepage
   now carries in full. Repeating it meant anyone arriving from the homepage was
   served the thing they had just read, so the page leads with the harder case
   instead: the political story, where outlets agree on the facts and diverge on
   what the story is. Drawn from a completed run. Nothing here is illustrative. */
const DIVERGENCES = [
  {
    claim: "More than $80 million was spent on the primary overall.",
    against:
      "The Detroit Free Press said the exact amount spent by campaigns and outside allies was not yet known.",
  },
  {
    claim:
      "Stevens and her allies outspent El-Sayed and his allies on advertising by about nine to one.",
    against: "Fox News quoted El-Sayed putting the same disparity at eleven to one.",
  },
];

/* Four gates, each stated as the rule it applies rather than as a paragraph
   about the rule. They run in this order and the order is the point: timing is
   settled before an absence can count as one. */
const GATES = [
  {
    name: "Reproduced twice",
    body: "A finding present in one pass and not the other is reported as unstable, not as a result.",
  },
  {
    name: "Filing time first",
    body: "An absence explained by when an outlet filed is excluded rather than counted against it.",
  },
  {
    name: "Carried by several",
    body: "One outlet mentioning what the others did not is a difference in emphasis, not a coverage gap.",
  },
  {
    name: "Quote located",
    body: "Every quote is found verbatim in the original article text before it reaches a report.",
  },
];

export default function ReportsPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>The harder case</h1>
          <p className={styles.lead}>
            The <Link href="/#method">earnings story on the homepage</Link> is the easy one. The
            outlets agreed on the numbers,
            and the finding that mattered sat inside a single article where anyone could check it in
            thirty seconds. This is a report on a contested political primary, where five outlets
            agreed on the result and disagreed about which story it was.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Five outlets, one result, three stories</h2>
          <div className={styles.measure}>
            <p>
              NBC News, Al Jazeera, Fox News, the Associated Press and the Detroit Free Press
              covered the Michigan Democratic Senate primary called on 5 August 2026. All five
              agreed on who won. The divergence was in which story it was: evidence about
              progressive viability, a verdict on outside spending, or a Republican opportunity.
            </p>
            <p>
              The report describes what each outlet foregrounded and what it left out. It does not
              rate the outlets, and it does not place them on a spectrum.
            </p>
          </div>

          <ul className={styles.rows}>
            {DIVERGENCES.map((d) => (
              <li key={d.claim} className={styles.row}>
                <h3 className={styles.rowTitle}>{d.claim}</h3>
                <p className={styles.rowBody}>{d.against}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>A finding the method threw out</h2>
          <div className={styles.measure}>
            <p>
              The most useful thing in this report is something that did not make it into the
              report.
            </p>
          </div>

          <figure className={styles.exhibit}>
            <p className={styles.exhibitBody}>
              The five articles&rsquo; last-updated times spanned{" "}
              <Annotation>12.7 hours</Annotation>. Later statements, advertising commitments and
              unity plans were missing from the earliest filings, because those articles had stopped
              updating before the material existed. Every one of those absences was dropped rather
              than counted against the outlet that filed first.
            </p>
            <figcaption className={styles.exhibitMeta}>
              The timing check runs before the finding, so an absence with a scheduling explanation
              never reaches a report at all.
            </figcaption>
          </figure>
        </section>

        <section className={styles.section}>
          <h2>What had to be true before a finding appeared</h2>
          <dl className={styles.fields}>
            {GATES.map((g) => (
              <div key={g.name} className={styles.field}>
                <dt className={styles.fieldName}>{g.name}</dt>
                <dd className={styles.fieldBody}>{g.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.cta}>
          <h2>Bring a story you already know well</h2>
          <p>
            The fastest way to judge this is on coverage you have read closely enough to argue
            with. Bring one and we will go through what it finds.
          </p>
          <div className={styles.actions}>
            <a href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer" className={styles.btn}>Book a demo</a>
            <Link href="/how-it-works" className={styles.btnQuiet}>How the analysis works</Link>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}
