// Contact details and links shared by the home page sections.
export const EMAIL = "hello@icopedia.co";
export const PHONE_DISPLAY = "+91 92747 22707";
export const WHATSAPP = "919274722707";
export const PLAY_URL = "https://play.google.com/store/apps/details?id=com.icopedia.app";
export const LINKEDIN_URL = "https://www.linkedin.com/company/145255681/";
export const INSTAGRAM_URL = "https://www.instagram.com/icopedia.co/";

/** Who is writing, picked on the contact form and added to the message. */
export const ROLES = ["Coating professional", "Manufacturer", "Contractor or inspection company", "Other"] as const;
export type Role = (typeof ROLES)[number];

export const whatsapp = (text: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

export const mailto = (subject: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

/** Empty until the iOS app is live; the App Store button shows "Coming soon" until then. */
export const APP_STORE_URL = "";

/**
 * Click handler for links to a page section ("/#contact", "/about#vision").
 * On that page it scrolls there without putting the hash in the address bar;
 * from other pages the link loads normally and arriveAtSection strips the hash.
 */
export function goToSection(e: { preventDefault(): void }, href: string) {
  const [path, id] = href.split("#");
  const el = id && window.location.pathname === (path || "/") ? document.getElementById(id) : null;
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView();
}

/** On page load: jump to the section named in the hash, then drop the hash from the URL. */
export function arriveAtSection() {
  const id = window.location.hash.slice(1);
  if (!id) return false;
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}
