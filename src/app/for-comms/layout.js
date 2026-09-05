import styles from "./layout.module.css";

export const metadata = {
  title: "NeutralEye for communications and investor relations teams",
  description:
    "Send the coverage of a single story. Get back what each outlet reported, what each one left out, and where an outlet's own text does not support its summary.",
};

/**
 * The .for-comms class carries this route's scoped palette, defined in
 * globals.css. Every colour on this page reads from those tokens, so the
 * warm site palette is untouched here and unchanged everywhere else.
 */
export default function ForCommsLayout({ children }) {
  return <div className={`for-comms ${styles.page}`}>{children}</div>;
}
