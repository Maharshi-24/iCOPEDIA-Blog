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
        <section className="pb-14 pt-28 sm:pt-36">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h1 className="wide text-[3rem] font-black leading-[0.95] sm:text-[4.5rem]">Help</h1>
            <p className="load-in mt-5 max-w-[56ch] text-lg leading-relaxed text-[#3A4046]" style={{ ["--load-delay" as string]: "90ms" }}>
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
                placeholder="Search, for example OTP, BOQ or delete"
                className="w-full rounded-[3px] border-2 border-[#23282D] bg-white py-3.5 pl-12 pr-4 text-[17px] placeholder:text-[#8A9095] focus:outline-none focus:ring-2 focus:ring-[#4C6395]/40"
              />
            </div>
          </div>
        </section>

        <section className="border-t-2 border-[#23282D] bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)]">
            <nav aria-label="Help topics" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold text-[#565D63]">Topics</p>
              <ul className="mt-3 space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block border-l-[3px] border-transparent py-1.5 pl-3 text-[16px] hover:border-[#F2A900] hover:font-semibold">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-14" data-reveal>
              {sections.length === 0 && (
                <div className="drop-in border-l-4 border-[#23282D] bg-[#F3F4F2] p-6" role="status">
                  <p className="text-[18px] font-bold">No questions match “{query.trim()}”</p>
                  <p className="mt-2 text-[16px] leading-relaxed text-[#3A4046]">
                    Try a shorter word, or <a className={link} href={wa} target="_blank" rel="noopener noreferrer">ask us on WhatsApp</a>.
                  </p>
                </div>
              )}
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="semi-wide text-2xl sm:text-3xl">{s.title}</h2>
                  <div className="mt-5 border-t-2 border-[#23282D]">
                    {s.faqs.map((f) => (
                      <details key={f.q} className="border-b border-[#D6D9D4]">
                        <summary className="flex items-center justify-between gap-6 py-4 text-[17px] font-bold">
                          {f.q}
                          <Plus className="faq-sign h-5 w-5 shrink-0 transition-transform duration-200" aria-hidden="true" />
                        </summary>
                        <p className="max-w-[64ch] pb-5 text-[16px] leading-relaxed text-[#3A4046]">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#23282D] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="wide text-[2rem] leading-[1.05] text-white sm:text-[2.5rem]" data-reveal>Still stuck?</h2>
            <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-white/70">
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
