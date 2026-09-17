import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lead Tracker",
    template: "%s | Lead Tracker",
  },
  description:
    "A focused workspace for managing sales leads across the full pipeline.",
};

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): React.ReactElement {
  return (
    <html lang="en">
      <body className="grid min-h-screen grid-rows-[1fr] bg-slate-50 text-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
