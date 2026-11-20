import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { PLAY_URL } from "./site";

const LINKS = [
  { id: "tools", label: "Tools" },
  { id: "plans", label: "Plans" },
  { id: "manufacturers", label: "Manufacturers" },
  { id: "contact", label: "Contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <header className={`site-header fixed inset-x-0 top-0 z-50 border-b bg-[#F3F4F2] ${scrolled || open ? "border-[#D6D9D4]" : "border-transparent"}`}>
      <div className="wrap flex h-[var(--header-h)] items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" aria-label="iCOPEDIA home">
          <img src="/icopedia-mark.svg" alt="" className="h-7 w-7" />
          <span className="semi-wide text-lg font-extrabold tracking-tight text-[#23282D]">
            iCOPEDIA<span className="align-super text-[0.5em]">™</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.id} href={`/#${l.id}`} className="text-[15px] text-[#3A4046] hover:text-[#23282D] hover:underline hover:underline-offset-4">
              {l.label}
            </a>
          ))}
          <a href="/support" className="text-[15px] text-[#3A4046] hover:text-[#23282D] hover:underline hover:underline-offset-4">
            Help
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden whitespace-nowrap rounded-[3px] bg-[#23282D] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#3A4046] min-[360px]:inline-block sm:px-4"
          >
            Get the app
          </a>
          <button
            className="-mr-2 grid h-11 w-11 place-items-center rounded-[3px] text-[#23282D] hover:bg-[#E6E8E4] lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="drop-in max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-t border-[#D6D9D4] px-[var(--gutter)] pb-5 pt-1 lg:hidden" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.id} href={`/#${l.id}`} onClick={() => setOpen(false)} className="block w-full border-b border-[#E3E5E1] py-3.5 text-left text-base text-[#23282D]">
              {l.label}
            </a>
          ))}
          <a href="/support" className="block border-b border-[#E3E5E1] py-3.5 text-base text-[#23282D]">Help</a>
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-[3px] bg-[#23282D] py-3 text-center text-sm font-semibold text-white"
          >
            Get the app
          </a>
        </nav>
      )}
    </header>
  );
}
