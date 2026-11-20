import { EMAIL, PHONE_DISPLAY, PLAY_URL, whatsapp } from "./site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const heading = "mb-3 text-sm font-semibold text-white";
  const item = "text-sm text-white/65 hover:text-white hover:underline hover:underline-offset-4";

  return (
    <footer className="bg-[#23282D] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/icopedia-mark.svg" alt="" className="h-8 w-8" />
            <span className="semi-wide text-xl font-extrabold">
              iCOPEDIA<span className="align-super text-[0.5em]">™</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            Tools for the people who estimate, apply and inspect protective coatings, and for the manufacturers who supply them.
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
        </div>

        <div className="md:col-span-3">
          <p className={heading}>App</p>
          <ul className="space-y-2.5">
            <li><a className={item} href="/#tools">Tools</a></li>
            <li><a className={item} href="/#plans">Free and company plans</a></li>
            <li><a className={item} href="/#manufacturers">Manufacturers</a></li>
            <li><a className={item} href={PLAY_URL} target="_blank" rel="noopener noreferrer">Google Play</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Help</p>
          <ul className="space-y-2.5">
            <li><a className={item} href="/support">Help and FAQ</a></li>
            <li><a className={item} href="/#contact">Contact us</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Legal</p>
          <ul className="space-y-2.5">
            <li><a className={item} href="/terms">Terms of Use</a></li>
            <li><a className={item} href="/privacy-policy">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-white/50 sm:px-6">© {year} iCOPEDIA GLOBAL. All rights reserved.</p>
      </div>
    </footer>
  );
}
