import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/supabase/AuthProvider";

export const metadata = {
  title: "NeutralEye | See How an Article Frames the Story",
  description: "NeutralEye shows how an article frames a story — tone, sourcing, and omission — with quoted evidence and suggested sources to read next.",
  metadataBase: new URL("https://neutraleye-web.vercel.app"),
  openGraph: {
    title: "NeutralEye | See How an Article Frames the Story",
    description: "NeutralEye shows how an article frames a story — tone, sourcing, and omission — with quoted evidence and suggested sources.",
    url: "https://neutraleye-web.vercel.app",
    siteName: "NeutralEye",
    type: "website",
    images: [{ url: "/neutraleye-logo.png", width: 512, height: 512, alt: "NeutralEye" }]
  },
  twitter: {
    card: "summary",
    title: "NeutralEye | See How an Article Frames the Story",
    description: "NeutralEye shows how an article frames a story — tone, sourcing, and omission — in any article."
  },
  icons: {
    icon: "/neutraleye-logo-48.png",
    apple: "/neutraleye-logo-48.png"
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
      </body>
    </html>
  );
}
