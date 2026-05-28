import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import styles from "./AnalyzerCta.module.css";

export default function AnalyzerCta() {
  return (
    <section className={styles.cta}>
      <h2>See NeutralEye in action</h2>
      <Link href="/analyze">
        <ShimmerButton
          background="#8b6741"
          shimmerColor="rgba(255, 244, 230, 0.65)"
          borderRadius="8px"
          shimmerDuration="2.5s"
          className="text-[0.89rem] font-medium px-[1.12rem] py-[0.74rem] min-h-[2.8rem]"
        >
          Open Analyzer
        </ShimmerButton>
      </Link>
    </section>
  );
}
