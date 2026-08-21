import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/supabase/AuthProvider";

export const metadata = {
  title: "NeutralEye | See How an Article Frames the Story",
  description: "NeutralEye shows how an article frames a story, checking tone, sourcing, and omission, with quoted evidence and suggested sources to read next.",
  metadataBase: new URL("https://tryneutraleye.com"),
  openGraph: {
    title: "NeutralEye | See How an Article Frames the Story",
    description: "NeutralEye shows how an article frames a story, checking tone, sourcing, and omission, with quoted evidence and suggested sources.",
    url: "https://tryneutraleye.com",
    siteName: "NeutralEye",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeutralEye | See How an Article Frames the Story",
    description: "NeutralEye shows how any article frames a story, checking tone, sourcing, and omission."
  },
  icons: {
    icon: "/neutraleye-logo-48.png",
    apple: "/neutraleye-logo-128.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className={GeistSans.className}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
