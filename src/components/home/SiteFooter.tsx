import type { SVGProps } from "react";
import { Instagram, Linkedin } from "lucide-react";
import type { SiteVariant } from "./SiteNav";
import { EMAIL, INSTAGRAM_URL, LINKEDIN_URL, PHONE_DISPLAY, PLAY_URL, goToSection, whatsapp } from "./site";

// lucide-react has no WhatsApp icon; this matches its 24px, 2px-stroke style.
function WhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9.5 8.5c.3-.3.8-.3 1 .1l.7 1.4c.1.3.1.6-.1.8l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.5c.2-.2.5-.3.8-.1l1.4.7c.4.2.4.7.1 1l-.6.6c-.6.6-1.6.7-2.4.3-1.8-.9-3.2-2.3-4.1-4.1-.4-.8-.3-1.8.3-2.4z"
      />
    </svg>
  );
}

const SOCIAL = [
  { href: LINKEDIN_URL, label: "iCOPEDIA on LinkedIn", Icon: Linkedin },
  { href: INSTAGRAM_URL, label: "iCOPEDIA on Instagram", Icon: Instagram },
  { href: whatsapp("Hello iCOPEDIA team"), label: "Message iCOPEDIA on WhatsApp", Icon: WhatsApp },
];

const LINKS = [{ href: "/about", label: "About us" }];

// The same footer on both sites. manufacturer.icopedia.co only has its home
// page, so there the page links point at icopedia.co.
export function SiteFooter({ variant = "main" }: { variant?: SiteVariant }) {
  const site = variant === "manufacturer" ? "https://icopedia.co" : "";
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
            Connecting people, knowledge and opportunities across the protective coatings and corrosion protection industry.
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
          <p className={heading}>iCOPEDIA</p>
          <ul className="space-y-1.5">
            {LINKS.map((l) => (
              <li key={l.href}><a className={item} href={site + l.href}>{l.label}</a></li>
            ))}
            <li><a className={item} href={PLAY_URL} target="_blank" rel="noopener noreferrer">Google Play</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Help</p>
          <ul className="space-y-1.5">
            <li><a className={item} href={`${site}/support`}>Help & FAQ</a></li>
            <li><a className={item} href="/#contact" onClick={(e) => goToSection(e, "/#contact")}>Contact us</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Legal</p>
          <ul className="space-y-1.5">
            <li><a className={item} href={`${site}/terms`}>Terms of Use</a></li>
            <li><a className={item} href={`${site}/privacy-policy`}>Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="wrap py-6 text-xs text-white/50">© {year} iCOPEDIA GLOBAL. All rights reserved.</p>
      </div>
    </footer>
  );
}
