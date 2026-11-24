/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
// Build-time renderer used by scripts/prerender.mjs. Not shipped to browsers.
import { StrictMode } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppRoutes } from "./App";
import { FAQ_SECTIONS } from "./pages/supportFaqs";
import { MANUFACTURER_HOME, NOT_FOUND, OG_IMAGE, PAGES, SITE } from "./seo";

export { MANUFACTURER_HOME, NOT_FOUND, OG_IMAGE, PAGES, SITE };

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
}

/** FAQPage structured data built from the same questions /support shows. */
export function supportFaqJsonLd() {
  const text = (node: React.ReactNode) =>
    renderToStaticMarkup(<>{node}</>)
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((s) =>
      s.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: text(f.a) },
      })),
    ),
  };
}
