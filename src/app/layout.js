import "./globals.css";
import { Source_Serif_4 } from "next/font/google";
import { GeistMono } from "geist/font/mono";

/* One family throughout, per the approved homepage design: Source Serif 4 sets
   the headings, the body, and the small tracked labels. It replaces a Newsreader
   and Public Sans pairing, and before that "Iowan Old Style", a macOS-only
   system font that silently fell back to Palatino or Georgia everywhere else. */
const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
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
      className={`${serif.variable} ${GeistMono.variable}`}
    >
      <body className={serif.className}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
