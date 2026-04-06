import "./globals.css";

export const metadata = {
  title: "NeutralEye | Detect Bias in Any News Article",
  description: "AI-powered analysis for tone, framing, and omission in news articles."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
