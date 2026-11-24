// One entry per public page: its single canonical URL, a unique title and
// description, and its structured data. scripts/prerender.mjs writes these
// into each page's HTML at build time and builds sitemap.xml from PAGES.
import { EMAIL, INSTAGRAM_URL, LINKEDIN_URL, PLAY_URL } from "@/components/home/site";

export const SITE = "https://icopedia.co";
export const OG_IMAGE = `${SITE}/og-image.png`;

export type PageSeo = {
  path: string;
  /** Output file in dist/, served by Vercel's cleanUrls at `path`. */
  file: string;
  title: string;
  description: string;
  jsonLd: object[];
  /** Pages that must not be indexed (the 404 page). */
  noindex?: boolean;
};

const ORG_ID = `${SITE}/#organization`;

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: "iCOPEDIA GLOBAL",
  alternateName: "iCOPEDIA",
  url: `${SITE}/`,
  logo: `${SITE}/icon-512.png`,
  email: EMAIL,
  telephone: "+91-92747-22707",
  address: {
    "@type": "PostalAddress",
    streetAddress: "505, Neptune Prime, OP Road",
    addressLocality: "Vadodara",
    addressRegion: "Gujarat",
    postalCode: "390020",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: EMAIL,
    telephone: "+91-92747-22707",
    availableLanguage: ["en"],
  },
  sameAs: [LINKEDIN_URL, INSTAGRAM_URL],
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  name: "iCOPEDIA",
  url: `${SITE}/`,
  publisher: { "@id": ORG_ID },
};

const HOME_DESCRIPTION =
  "The iCOPEDIA Individual App: a free everyday digital companion for the protective coatings industry, with practical calculators, digital notes, an industry community and Ustad, an AI learning companion.";

const app = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "iCOPEDIA",
  description: HOME_DESCRIPTION,
  operatingSystem: "Android",
  applicationCategory: "BusinessApplication",
  installUrl: PLAY_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  publisher: { "@id": ORG_ID },
};

const breadcrumb = (name: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
  ],
});

export const PAGES: PageSeo[] = [
  {
    path: "/",
    file: "index.html",
    title: "iCOPEDIA: the protective coatings industry in your pocket",
    description: HOME_DESCRIPTION,
    jsonLd: [organization, website, app],
  },
  {
    path: "/about",
    file: "about.html",
    title: "About us | iCOPEDIA",
    description:
      "iCOPEDIA is building a connected ecosystem for the protective coatings and corrosion protection industry: connecting people, knowledge and opportunities.",
    jsonLd: [breadcrumb("About us", "/about")],
  },
  {
    path: "/support",
    file: "support.html",
    title: "Help & FAQ | iCOPEDIA",
    description:
      "Answers about signing in, BOQ and Ustad limits, company accounts, ads and deleting your account in the iCOPEDIA app, and how to contact the team.",
    // The FAQPage block is added by the prerender step from the page's own questions.
    jsonLd: [breadcrumb("Help & FAQ", "/support")],
  },
  {
    path: "/terms",
    file: "terms.html",
    title: "Terms of Use | iCOPEDIA",
    description: "The terms that govern use of the iCOPEDIA app, website and services, operated by iCOPEDIA GLOBAL, Vadodara, India.",
    jsonLd: [breadcrumb("Terms of Use", "/terms")],
  },
  {
    path: "/privacy-policy",
    file: "privacy-policy.html",
    title: "Privacy Policy | iCOPEDIA",
    description:
      "What personal data the iCOPEDIA app collects, why, who it is shared with, how long it is kept and how to access or delete it.",
    jsonLd: [breadcrumb("Privacy Policy", "/privacy-policy")],
  },
];

export const NOT_FOUND: PageSeo = {
  path: "/404",
  file: "404.html",
  title: "Page not found | iCOPEDIA",
  description: "This page doesn't exist on icopedia.co.",
  jsonLd: [],
  noindex: true,
};

export const seoFor = (path: string) => PAGES.find((p) => p.path === path) ?? NOT_FOUND;
