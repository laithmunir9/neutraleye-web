import { Hero7 } from "@/components/ui/modern-hero";

const demoData = {
  heading: "See how an article moves the reader",
  description:
    "NeutralEye turns article text into a structured read of tone, framing, sourcing, and omission so teams can review influence signals without collapsing everything into a single opaque score.",
  button: {
    text: "Open Analyzer",
    url: "/analyze"
  },
  reviews: {
    count: 200,
    avatars: [
      {
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
        alt: "Reader avatar 1"
      },
      {
        src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
        alt: "Reader avatar 2"
      },
      {
        src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
        alt: "Reader avatar 3"
      },
      {
        src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
        alt: "Reader avatar 4"
      },
      {
        src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=160&q=80",
        alt: "Reader avatar 5"
      }
    ]
  }
};

export default function HeroDemo() {
  return (
    <Hero7 {...demoData} />
  );
}
