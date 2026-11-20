import { ReactNode, useEffect, useState } from "react";
import "./home.css";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { useReveal } from "./useReveal";

type Toc = { id: string; label: string };

/** Shared page for the Terms of Use and Privacy Policy: title, contents that follow your place, and the text. */
export function LegalLayout({
  title,
  meta,
  intro,
  toc,
  children,
}: {
  title: string;
  meta: ReactNode;
  intro?: ReactNode;
  toc: Toc[];
  children: ReactNode;
}) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");
  useReveal();

  // Highlight the section being read in the contents list.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc]);

  // Deep links such as /privacy-policy#delete-account land on the section.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, []);

  const contents = (
    <ol className="space-y-0.5">
      {toc.map((t, i) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            aria-current={active === t.id ? "location" : undefined}
            className={`grid grid-cols-[2rem_1fr] border-l-[3px] py-1.5 pl-3 pr-2 text-[14px] leading-snug ${
              active === t.id ? "border-[#F2A900] bg-[#F3F4F2] font-semibold text-[#23282D]" : "border-transparent text-[#3A4046] hover:border-[#D6D9D4] hover:text-[#23282D]"
            }`}
          >
            <span className="num text-[#6B7278]">{i + 1}</span>
            <span>{t.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="ico min-h-screen">
      <SiteNav />
      <main>
        <header className="hero-top pb-[clamp(2.5rem,1.8rem+3vw,3rem)]">
          <div className="wrap">
            <h1 className="t-title max-w-[16ch]">{title}</h1>
            <p className="load-in num mt-5 text-[15px] text-[#565D63]" style={{ ["--load-delay" as string]: "90ms" }}>{meta}</p>
            {intro && <div style={{ ["--load-delay" as string]: "180ms" }} className="load-in t-lead mt-6 max-w-[62ch] text-[#3A4046]">{intro}</div>}
          </div>
        </header>

        <div className="border-t-2 border-[#23282D] bg-white">
          <div className="wrap grid gap-10 py-[clamp(2rem,1rem+4vw,4rem)] lg:grid-cols-[minmax(0,0.36fr)_minmax(0,1fr)] lg:gap-14">
            <nav aria-label="Contents" className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:max-h-[calc(100dvh-var(--header-h)-2rem)] lg:self-start lg:overflow-y-auto">
              <details className="border-2 border-[#23282D] lg:hidden">
                <summary className="flex items-center justify-between px-4 py-3 text-[16px] font-bold">
                  Contents <span className="faq-sign text-xl leading-none transition-transform" aria-hidden="true">+</span>
                </summary>
                <div className="border-t border-[#D6D9D4] py-2">{contents}</div>
              </details>
              <div className="hidden lg:block">
                <p className="mb-3 text-sm font-semibold text-[#565D63]">Contents</p>
                {contents}
              </div>
            </nav>

            <article className="legal min-w-0">{children}</article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
