import type { Metadata, Viewport } from "next";
import { LocaleProvider, LucProvider, lucThemeInitScript } from "@luc/ui";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppFrame } from "@/components/shell/app-frame";
import {
  appearanceInitScript,
  DEFAULT_PALETTE,
  DEFAULT_PERSONALITY,
  DEFAULT_TYPEFACE,
} from "@/lib/appearance";
import { HTML_LANG } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

/*
 * Self-hosted open-source fonts (SIL OFL 1.1). Bundled, not fetched from a
 * third-party CDN at runtime — Luc UI stays portable and offline-safe.
 * Subsets are declared per `unicode-range`, so only used scripts download.
 */
import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";

export const metadata: Metadata = {
  title: {
    default: "Luc UI — design system",
    template: "%s · Luc UI",
  },
  description:
    "Luc UI is an open-source React and TypeScript design system: accessible components, tokens, motion and charts.",
  icons: {
    icon: [
      {
        url: "/brand/luc-ui-logo-light-32.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/luc-ui-logo-dark-32.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/brand/luc-ui-apple-touch-180.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /*
   * One locale per request, resolved on the server from the URL prefix, the
   * cookie and `Accept-Language` (see `lib/i18n/server.ts`). It reaches every
   * consumer through three places and nowhere else:
   *
   *   <html lang>      so a screen reader picks the right voice
   *   LocaleProvider   @luc/ui's own locale context, which React Aria uses for
   *                    date/number segment order, week start and clock format
   *   I18nProvider     the Showcase's copy dictionary
   */
  const locale = await getLocale();

  return (
    /*
     * `data-palette` / `data-typeface` are brand-level attributes, not page
     * state, so they belong on the document element exactly like the theme. The
     * init script re-applies the visitor's stored choice before paint.
     */
    <html
      lang={HTML_LANG[locale]}
      className="dark"
      data-theme="dark"
      data-palette={DEFAULT_PALETTE}
      data-typeface={DEFAULT_TYPEFACE}
      data-personality={DEFAULT_PERSONALITY}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: lucThemeInitScript({ defaultTheme: "dark" }) }} />
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript() }} />
      </head>
      <body className="min-h-dvh bg-surface-canvas text-fg-primary antialiased">
        <LucProvider defaultTheme="dark">
          <LocaleProvider locale={locale}>
            <I18nProvider locale={locale}>
              {/*
                nuqs is the Showcase's framework adapter, not a @luc/ui dependency:
                the library owns the codecs, Next owns the plumbing.
              */}
              <NuqsAdapter>
                <AppFrame>{children}</AppFrame>
              </NuqsAdapter>
            </I18nProvider>
          </LocaleProvider>
        </LucProvider>
      </body>
    </html>
  );
}
