import { Github } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mockup } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";

interface HeroWithMockupProps {
  title: string;
  description: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  mockupImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  className?: string;
}

export function HeroWithMockup({
  title,
  description,
  primaryCta = {
    text: "Get Started",
    href: "/get-started"
  },
  secondaryCta = {
    text: "GitHub",
    href: "https://github.com/your-repo",
    icon: <Github className="mr-2 h-4 w-4" />
  },
  mockupImage,
  className
}: HeroWithMockupProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-background px-4 py-12 text-foreground md:py-24 lg:py-32",
        className
      )}
    >
      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-12 lg:gap-24">
        <div className="relative z-10 flex flex-col items-center gap-6 pt-8 text-center md:pt-16 lg:gap-12">
          <h1
            className={cn(
              "inline-block animate-appear bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-4xl leading-[1.1] font-bold tracking-tight text-transparent drop-shadow-sm sm:text-5xl sm:leading-[1.1] md:text-6xl lg:text-7xl xl:text-8xl dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "max-w-[550px] animate-appear text-base font-medium text-muted-foreground opacity-0 [animation-delay:150ms] sm:text-lg md:text-xl"
            )}
          >
            {description}
          </p>

          <div className="relative z-10 flex flex-wrap justify-center gap-4 animate-appear opacity-0 [animation-delay:300ms]">
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-[hsl(var(--brand))] text-white shadow-lg transition-all duration-300 hover:bg-[hsl(var(--brand)/0.9)]"
              )}
            >
              <a href={primaryCta.href}>{primaryCta.text}</a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className={cn("text-foreground/80 transition-all duration-300 dark:text-foreground/70")}
            >
              <a href={secondaryCta.href}>
                {secondaryCta.icon}
                {secondaryCta.text}
              </a>
            </Button>
          </div>

          <div className="relative w-full px-4 pt-12 sm:px-6 lg:px-8">
            <Mockup
              className={cn(
                "animate-appear border-brand/10 opacity-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] [animation-delay:700ms] dark:border-brand/5 dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]"
              )}
            >
              <img {...mockupImage} className="h-auto w-full" loading="lazy" decoding="async" />
            </Mockup>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Glow variant="above" className="animate-appear-zoom opacity-0 [animation-delay:1000ms]" />
      </div>
    </section>
  );
}
