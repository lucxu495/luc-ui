import type { Metadata } from "next";
import { LucProvider, lucThemeInitScript } from "@luc/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luc UI Next.js consumer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: lucThemeInitScript({ defaultTheme: "dark" }) }} />
      </head>
      <body>
        <LucProvider defaultTheme="dark">{children}</LucProvider>
      </body>
    </html>
  );
}
