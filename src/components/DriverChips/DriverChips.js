import styles from "./DriverChips.module.css";

const DRIVER_META = {
  "Loaded wording": "Emotionally charged descriptors.",
  Framing: "Selective context that steers interpretation.",
  "Source imbalance": "Uneven source representation.",
  "Attribution gaps": "Claims are weakly sourced or attribution is unclear.",
  "Attribution quality": "Unclear sourcing or weak attribution.",
  Omission: "Key context is absent from the narrative.",
  Tone: "Language tone shifts perception.",
  "Evidence quality": "Claims outpace cited evidence."
};

const DRIVER_RANK = {
  "Loaded wording": 1,
  Framing: 2,
  "Source imbalance": 3,
  "Attribution gaps": 4,
  "Attribution quality": 4,
  Omission: 5,
  Tone: 6,
  "Evidence quality": 7
};

export default function DriverChips({ items }) {
  const visible = (items || [])
    .map((item) => {
      if (typeof item === "string") {
        return { label: item, description: DRIVER_META[item] || "Detected narrative signal.", weight: 0 };
      }
      return {
        label: String(item?.label || item?.name || "Signal"),
        description: String(item?.description || DRIVER_META[item?.label || item?.name] || "Detected narrative signal."),
        weight: Number(item?.weight || 0)
      };
    })
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return (DRIVER_RANK[a.label] || 99) - (DRIVER_RANK[b.label] || 99);
    })
    .slice(0, 6);

  return (
    <div className={styles.row}>
      {visible.map((item, index) => (
        <div key={`${item.label}-${index}`} className={styles.chip} title={item.description}>
          <strong>{item.label}</strong>
          <span>{item.description}</span>
        </div>
      ))}
    </div>
  );
}
