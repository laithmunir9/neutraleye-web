import React from "react";
import { Star } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Hero7Props {
  heading?: string;
  description?: string;
  button?: {
    text: string;
    url: string;
  };
  reviews?: {
    count: number;
    avatars: {
      src: string;
      alt: string;
    }[];
  };
}

const Hero7 = ({
  heading = "See how an article moves the reader",
  description = "NeutralEye turns article text into a structured read of tone, framing, sourcing, and omission so the analyzer feels inspectable, calm, and evidence-led.",
  button = {
    text: "Open Analyzer",
    url: "/analyze"
  },
  reviews = {
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
}: Hero7Props) => {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container mx-auto px-6 text-center">
        <div className="mx-auto flex max-w-screen-lg flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="text-balance text-base leading-8 text-muted-foreground lg:text-lg">{description}</p>
        </div>
        <Button asChild size="lg" className="mt-10">
          <a href={button.url}>{button.text}</a>
        </Button>
        <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-4 sm:flex-row">
          <span className="mx-4 inline-flex items-center -space-x-4">
            {reviews.avatars.map((avatar, index) => (
              <Avatar key={index} className="size-14 border border-border">
                <AvatarImage src={avatar.src} alt={avatar.alt} />
              </Avatar>
            ))}
          </span>
          <div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => (
                <Star key={index} className="size-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-left font-medium text-muted-foreground">from {reviews.count}+ reviews</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero7 };
