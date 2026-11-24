import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import "@/components/home/home.css";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";
import { useReveal } from "@/components/home/useReveal";
import { EMAIL, PHONE_DISPLAY, WHATSAPP, mailto } from "@/components/home/site";
import { FAQ_SECTIONS as SECTIONS } from "./supportFaqs";
import { seoFor } from "@/seo";

// Help for app users, linked from the app's sign-in screen ("Need help?")
// and Settings ("Help & FAQ"). The questions live in supportFaqs.tsx.
const PHONE_TEL = "+919274722707";
const link = "font-semibold text-[#4C6395] underline underline-offset-4 hover:text-[#2E3D5C]";

const Support = () => {
  const [query, setQuery] = useState("");
  useReveal();

  useEffect(() => {
    document.title = seoFor("/support").title;
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const q = query.trim().toLowerCase();
  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        faqs: q ? s.faqs.filter((f) => `${f.q} ${f.keywords ?? ""} ${s.title}`.toLowerCase().includes(q)) : s.faqs,
      })).filter((s) => s.faqs.length > 0),
    [q],
  );

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello iCOPEDIA team, I need help with the app.")}`;
  const contacts = [
    { title: "WhatsApp", value: PHONE_DISPLAY, href: wa, note: "Quickest for most questions" },
    { title: "Email", value: EMAIL, href: mailto("iCOPEDIA app support"), note: "For anything in detail" },
    { title: "Call", value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}`, note: "Talk to the team" },
  ];

  return (
    <div className="ico min-h-screen">
      <SiteNav />

      <main>
        <section className="hero-top pb-[clamp(2.5rem,1.8rem+3vw,3.5rem)]">
          <div className="wrap">
            <h1 className="t-title">Help &amp; FAQ</h1>
            <p className="load-in t-lead mt-5 max-w-[56ch] text-[#3A4046]" style={{ ["--load-delay" as string]: "90ms" }}>
              Answers to common questions about the iCOPEDIA app. Can't find yours? Message us and a person will reply.
            </p>

            <div className="load-in relative mt-8 max-w-xl" style={{ ["--load-delay" as string]: "180ms" }}>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7278]" aria-hidden="true" />
              <label htmlFor="help-search" className="sr-only">Search help</label>
              <input
                id="help-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try OTP, BOQ or delete"
                className="w-full rounded-[3px] border-2 border-[#23282D] bg-white py-3.5 pl-12 pr-4 text-[17px] placeholder:text-[#8A9095] focus:outline-none focus:ring-2 focus:ring-[#4C6395]/40"
              />
            </div>
          </div>
        </section>

        <section className="border-t-2 border-[#23282D] bg-white py-[clamp(2.5rem,1.4rem+4.5vw,5rem)]">
          <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)] lg:gap-12">
            <nav aria-label="Help topics" className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
              <p className="text-sm font-semibold text-[#565D63]">Topics</p>
              <ul className="hide-scrollbar bleed mt-3 flex gap-2 overflow-x-auto lg:!mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:!px-0">
                {SECTIONS.map((s) => (
                  <li key={s.id} className="shrink-0">
                    <a
                      href={`#${s.id}`}
                      className="block whitespace-nowrap rounded-full border border-[#BFC4BE] px-3.5 py-2 text-[15px] hover:border-[#23282D] lg:whitespace-normal lg:rounded-none lg:border-0 lg:border-l-[3px] lg:border-transparent lg:px-0 lg:py-1.5 lg:pl-3 lg:text-[16px] lg:hover:border-[#F2A900] lg:hover:font-semibold"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-14" data-reveal>
              {sections.length === 0 && (
                <div className="drop-in border-l-4 border-[#23282D] bg-[#F3F4F2] p-6" role="status">
                  <p className="t-h5">No questions match “{query.trim()}”</p>
                  <p className="t-body mt-2 text-[#3A4046]">
                    Try a shorter word, or <a className={link} href={wa} target="_blank" rel="noopener noreferrer">ask us on WhatsApp</a>.
                  </p>
                </div>
              )}
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-[calc(var(--header-h)+1.5rem)]">
                  <h2 className="t-h3">{s.title}</h2>
                  <div className="mt-5 border-t-2 border-[#23282D]">
                    {s.faqs.map((f) => (
                      <details key={f.q} className="border-b border-[#D6D9D4]">
                        <summary className="t-h5 flex items-center justify-between gap-6 py-4">
                          {f.q}
                          <Plus className="faq-sign h-5 w-5 shrink-0 transition-transform duration-200" aria-hidden="true" />
                        </summary>
                        <p className="t-body max-w-[64ch] pb-5 text-[#3A4046]">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="section-y bg-[#23282D] text-white">
          <div className="wrap">
            <h2 className="t-h2 text-white" data-reveal>Still stuck?</h2>
            <p className="t-lead mt-3 max-w-[52ch] text-white/70">
              Tell us your mobile number and what happened. A screenshot helps.
            </p>
            <ul className="mt-10 grid gap-px bg-white/15 sm:grid-cols-3" data-reveal data-reveal-delay="120">
              {contacts.map((c) => (
                <li key={c.title} className="bg-[#23282D]">
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block py-5 pr-6 hover:bg-white/[0.04] sm:px-6"
                  >
                    <span className="block text-sm text-white/60">{c.title}</span>
                    <span className="num mt-1 block text-lg font-bold underline-offset-4 hover:underline">{c.value}</span>
                    <span className="mt-1 block text-sm text-white/55">{c.note}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Support;
