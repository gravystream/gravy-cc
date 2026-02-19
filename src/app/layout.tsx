import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gravy Command Center — The Creator Marketplace",
  description:
    "Where brands discover, commission, and hire premium video content creators. AI-powered quality gate, secure escrow payments, and real-time collaboration.",
  keywords: ["creator marketplace", "video content", "influencer marketing", "brand deals"],
  openGraph: {
    title: "Gravy Command Center",
    description: "The AI-powered creator marketplace where brands discover premium video talent.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-quicksand bg-[#0A0A0A] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
