import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/ui/theme-provider";

export const metadata = {
  title: "NeutralEye | Detect Bias in Any News Article",
  description: "AI-powered analysis for tone, framing, and omission in news articles."
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
