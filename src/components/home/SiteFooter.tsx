import { Instagram, Linkedin } from "lucide-react";
import type { SiteVariant } from "./SiteNav";
import { EMAIL, INSTAGRAM_URL, LINKEDIN_URL, PHONE_DISPLAY, PLAY_URL, goToSection, whatsapp } from "./site";

const SOCIAL = [
  { href: LINKEDIN_URL, label: "iCOPEDIA on LinkedIn", Icon: Linkedin },
  { href: INSTAGRAM_URL, label: "iCOPEDIA on Instagram", Icon: Instagram },
];

// manufacturer.icopedia.co has its own blurb and section links; its help and
// legal links go to the main site.
const VARIANTS = {
  main: {
    blurb: "Connecting people, knowledge and opportunities across the protective coatings and corrosion protection industry.",
    heading: "iCOPEDIA",
    links: [{ href: "/", label: "The app" }, { href: "/about", label: "About us" }],
    site: "",
  },
  manufacturer: {
    blurb: "Tools for the people who estimate, apply and inspect protective coatings, and for the manufacturers who supply them.",
    heading: "App",
    links: [
      { href: "/#tools", label: "Tools" },
      { href: "/#plans", label: "Free and company plans" },
      { href: "/#manufacturers", label: "Manufacturers" },
    ],
    site: "https://icopedia.co",
  },
};

export function SiteFooter({ variant = "main" }: { variant?: SiteVariant }) {
  const v = VARIANTS[variant];
  const year = new Date().getFullYear();
  const heading = "mb-3 text-sm font-semibold text-white";
  const item = "inline-block py-1.5 text-[15px] sm:py-1 sm:text-sm text-white/65 hover:text-white hover:underline hover:underline-offset-4";

  return (
    <footer className="bg-[#23282D] text-white">
      <div className="wrap grid grid-cols-2 gap-x-6 gap-y-10 py-[clamp(3rem,2.4rem+2.5vw,3.5rem)] md:grid-cols-12">
        <div className="col-span-2 md:col-span-5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/icopedia-mark.svg" alt="" className="h-8 w-8" />
            <span className="semi-wide text-xl font-extrabold">
              iCOPEDIA<span className="align-super text-[0.5em]">™</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            {v.blurb}
          </p>
          <address className="mt-6 space-y-1.5 text-sm not-italic leading-relaxed text-white/65">
            <p>iCOPEDIA GLOBAL</p>
            <p>505, Neptune Prime, OP Road, Vadodara 390020, Gujarat, India</p>
            <p><a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a></p>
            <p>
              <a href={whatsapp("Hello iCOPEDIA team")} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp {PHONE_DISPLAY}
              </a>
            </p>
          </address>
          <ul className="mt-5 flex gap-2" aria-label="Follow iCOPEDIA">
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-[3px] border border-white/20 text-white/75 hover:border-white/60 hover:text-white">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="row-span-2 md:col-span-3 md:row-span-1">
          <p className={heading}>{v.heading}</p>
          <ul className="space-y-1.5">
            {v.links.map((l) => (
              <li key={l.href}><a className={item} href={l.href} onClick={(e) => goToSection(e, l.href)}>{l.label}</a></li>
            ))}
            <li><a className={item} href={PLAY_URL} target="_blank" rel="noopener noreferrer">Google Play</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Help</p>
          <ul className="space-y-1.5">
            <li><a className={item} href={`${v.site}/support`}>Help & FAQ</a></li>
            <li><a className={item} href="/#contact" onClick={(e) => goToSection(e, "/#contact")}>Contact us</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Legal</p>
          <ul className="space-y-1.5">
            <li><a className={item} href={`${v.site}/terms`}>Terms of Use</a></li>
            <li><a className={item} href={`${v.site}/privacy-policy`}>Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="wrap py-6 text-xs text-white/50">© {year} iCOPEDIA GLOBAL. All rights reserved.</p>
      </div>
    </footer>
  );
}
