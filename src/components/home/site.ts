// Contact details and links shared by the home page sections.
export const EMAIL = "hello@icopedia.co";
export const PHONE_DISPLAY = "+91 92747 22707";
export const WHATSAPP = "919274722707";
export const PLAY_URL = "https://play.google.com/store/apps/details?id=com.icopedia.app";

/** Who is writing, picked on the contact form and added to the message. */
export const ROLES = ["Coating professional", "Manufacturer", "Contractor or inspection company", "Other"] as const;
export type Role = (typeof ROLES)[number];

export const whatsapp = (text: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

export const mailto = (subject: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
