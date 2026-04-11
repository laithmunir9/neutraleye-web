import { HeroWithMockup } from "@/components/ui/hero-with-mockup";

export default function HeroDemo() {
  return (
    <HeroWithMockup
      title="Build AI-powered apps in minutes, not months"
      description="Create sophisticated AI applications with our intuitive platform. No ML expertise required."
      primaryCta={{
        text: "Start Building",
        href: "/signup"
      }}
      secondaryCta={{
        text: "View on GitHub",
        href: "https://github.com/your-ai-platform"
      }}
      mockupImage={{
        alt: "AI Platform Dashboard",
        width: 1248,
        height: 765,
        src: "https://www.launchuicomponents.com/app-light.png"
      }}
    />
  );
}
