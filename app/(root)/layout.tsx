import type { ReactNode } from "react";

/** Minimal root layout for "/" only: language negotiation (Apache normally redirects before this is served). */
export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/fr/" />
        </noscript>
      </head>
      <body style={{ background: "#F7F2ED", color: "#201A1B", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
