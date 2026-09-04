import "./globals.css";
import { Newsreader, Public_Sans } from "next/font/google";
import { GeistMono } from "geist/font/mono";

/* Newsreader is drawn for reading news, which is the subject; it also replaces
   "Iowan Old Style", a macOS-only system font that silently fell back to
   Palatino or Georgia everywhere else. Public Sans is a civic, neutral text
   face, chosen over Geist because Geist is the default of every Next.js
   project. Both load through next/font, so no dependency was added. */
const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const sans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});
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
      className={`${display.variable} ${sans.variable} ${GeistMono.variable}`}
    >
      <body className={sans.className}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
