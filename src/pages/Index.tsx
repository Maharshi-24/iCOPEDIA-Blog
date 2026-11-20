import { useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import "@/components/home/home.css";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";
import { AppScreens } from "@/components/home/AppScreens";
import { ContactForm } from "@/components/home/ContactForm";
import { useReveal } from "@/components/home/useReveal";
import { EMAIL, PHONE_DISPLAY, PLAY_URL, mailto, whatsapp, type Role } from "@/components/home/site";
import { seoFor } from "@/seo";

// Home page. The copy follows what the app does today: Home tiles in
// lib/Frontend/Pages/Home/home.dart; free-user rules in the backend's
// is_free_user, home_tiles, usage_limits and ai_daily_token_limit; product
// fields in lib/Frontend/Pages/Product/product_model.dart. Keep it in step
// with the app and with /terms. Design tokens are in components/home/home.css.

const wrap = "wrap";
const h2 = "t-h2";
const lead = "t-lead mt-4 max-w-[60ch] text-[#565D63]";

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lift inline-flex items-center justify-center rounded-[3px] bg-[#F2A900] px-6 py-3.5 text-[16px] font-bold text-[#23282D] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] hover:bg-[#FFB914]"
    >
      {children}
    </a>
  );
}

/** A real link (crawlable, works without JavaScript); onClick only adds behaviour on top. */
function SecondaryLink({ href, onClick, children, dark = false }: { href: string; onClick?: () => void; children: React.ReactNode; dark?: boolean }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[3px] border-2 px-6 py-3 text-[16px] font-semibold ${
        dark ? "border-white/70 text-white hover:bg-white/10" : "border-[#23282D] text-[#23282D] hover:bg-[#E6E8E4]"
      }`}
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------- hero */

function Hero({ onCompany }: { onCompany: () => void }) {
  return (
    <section className="hero-top">
      <div className={wrap}>
        <h1 className="t-display max-w-[14ch]">
          Every coat, worked out.
        </h1>
        <p className="load-in t-lead mt-6 max-w-[56ch] text-[#3A4046] sm:mt-7" style={{ ["--load-delay" as string]: "90ms" }}>
          iCOPEDIA is the app for people who estimate, apply and inspect protective coatings. Calculators, bills of
          quantities, site reports, instrument records, manufacturers' product data and an AI assistant, free to start.
        </p>
        <div className="load-in mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row" style={{ ["--load-delay" as string]: "180ms" }}>
          <PrimaryLink href={PLAY_URL}>Get it on Google Play</PrimaryLink>
          <SecondaryLink href="/#contact" onClick={onCompany}>Set up your company</SecondaryLink>
        </div>
      </div>
      <AppScreens />
    </section>
  );
}

/* ---------------------------------------------------------- job sequence */

const STAGES = [
  {
    stage: "Estimate",
    job: "Work out how much paint the job needs before you quote.",
    tools: [
      ["Bill of quantities", "Litres for each coat of the system, shared as a PDF. On a company account, pick the products and their data fills in."],
      ["Coverage and quantity estimation", "Area, DFT and volume solids in; litres and coverage out."],
      ["Product details", "Volume solids, DFT range, mixing ratio, pot life and pack sizes, in the same layout for every product."],
    ],
  },
  {
    stage: "Prepare",
    job: "Check the surface and the weather before anyone starts.",
    tools: [
      ["Dew point calculator", "Air temperature and humidity in; dew point out."],
      ["Project report", "Log surface preparation, blasting and environmental readings for the day's visit."],
    ],
  },
  {
    stage: "Apply",
    job: "Get the mix and the film thickness right.",
    tools: [
      ["Part quantity calculator", "How much of part A and part B to mix for the quantity you need."],
      ["DFT to WFT", "The wet film to aim for, so the dry film lands in range."],
      ["Unit converter", "Microns to mils and back."],
    ],
  },
  {
    stage: "Inspect",
    job: "Record what was done, and back it up.",
    tools: [
      ["Project report", "DFT readings, photos and the officials present, exported as a PDF. On a company account, pick the products used and their details fill in."],
      ["Instrument records", "Each gauge with its calibration certificate, and which ones are due or overdue."],
      ["Notes", "Private by default, with voice dictation when your hands are full."],
    ],
  },
];

function Tools() {
  return (
    <section id="tools" className="anchor section-y border-t-2 border-[#23282D] bg-white">
      <div className={wrap}>
        <h2 className={h2} data-reveal>From estimate to sign‑off</h2>
        <p className={lead}>The app follows the job. Here's where each tool fits.</p>

        <ol className="mt-10 sm:mt-14">
          {STAGES.map((s, i) => (
            <li key={s.stage} data-reveal className="grid gap-6 border-t border-[#D6D9D4] py-8 sm:py-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] md:gap-12">
              <div>
                <p className="num text-sm font-semibold text-[#6B7278]">Stage {i + 1} of {STAGES.length}</p>
                <h3 className="t-h3 mt-1">{s.stage}</h3>
                <p className="t-lead mt-3 max-w-[32ch] text-[#3A4046]">{s.job}</p>
              </div>
              <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {s.tools.map(([name, text]) => (
                  <div key={name} className="border-l-[3px] border-[#F2A900] pl-4">
                    <dt className="t-h5">{name}</dt>
                    <dd className="t-body mt-1 text-[#565D63]">{text}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- Ustad */

function Ustad() {
  return (
    <section className="section-y bg-[#23282D] text-white">
      <div className={`${wrap} grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`}>
        <div>
          <h2 className={`${h2} text-white`} data-reveal>Ask Ustad</h2>
          <p className="t-lead mt-4 max-w-[52ch] text-white/70">
            Ustad is the AI coating assistant in the app. Ask about surface preparation, coating systems, testing or defects
            and get a clear first answer in seconds, or look the term up in the built-in coatings glossary.
          </p>

          <div className="t-body mt-10 max-w-lg space-y-3" data-reveal data-reveal-delay="120">
            <p className="text-sm text-white/55">An example question</p>
            <p className="ml-auto w-fit max-w-[85%] rounded-[14px] rounded-br-[3px] bg-[#4C6395] px-4 py-3">
              What causes pinholes in an epoxy coat?
            </p>
            <p className="w-fit max-w-[92%] rounded-[14px] rounded-bl-[3px] bg-white/[0.08] px-4 py-3 text-white/85">
              Usually air or solvent trapped in the film. Common causes are a porous substrate, too thick a coat in one pass,
              and spraying in high heat…
            </p>
          </div>
          <p className="t-small mt-6 max-w-[52ch] text-white/55">
            Ustad gives a first answer, not a sign-off. Check it against the product data sheet, the specification and the
            relevant standard before you act.
          </p>
        </div>

        <div className="lg:pt-3" data-reveal data-reveal-delay="200">
          <h3 className="t-h4 text-white">Learn from the rest of the trade</h3>
          <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {[
              ["Community", "Ask questions and share know-how with people across the industry. Anyone can join a discussion; verified members start new ones."],
              ["Tutorials", "Short videos that show you how to use each tool."],
              ["News", "What's happening in the coatings industry."],
            ].map(([t, d]) => (
              <div key={t} className="py-5">
                <dt className="t-h5">{t}</dt>
                <dd className="t-body mt-1 text-white/65">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ plans */

type Cell = true | false | string;
const PLAN_ROWS: [string, Cell, Cell][] = [
  ["Calculators, all six", true, true],
  ["Bills of quantities and project reports filled in from product data", false, true],
  ["Bills of quantities", "A set number of new BOQs a day", "No daily limit"],
  ["Ustad AI assistant", "Daily allowance", "Five times the free allowance"],
  ["Community, tutorials, news and notes", true, true],
  ["Product details", false, true],
  ["Project reports", false, true],
  ["Instrument records", false, true],
  ["Ads on the Home screen", "A few, always labelled", "None"],
  ["Accounts for your team under your company", false, true],
  ["Your products listed in the app", false, "For manufacturers"],
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check className="h-5 w-5 text-[#23282D]" aria-label="Included" />;
  if (v === false) return <Minus className="h-5 w-5 text-[#A3A8AC]" aria-label="Not included" />;
  return <span>{v}</span>;
}

function Plans({ onCompany }: { onCompany: () => void }) {
  return (
    <section id="plans" className="anchor section-y">
      <div className={wrap}>
        <h2 className={h2} data-reveal>Free for you, ready for your team</h2>
        <p className={lead}>
          Anyone can sign up with a mobile number and use iCOPEDIA at no cost. Companies get the full app for their whole team.
        </p>

        <div className="mt-10 sm:mt-12 sm:overflow-x-auto" data-reveal data-reveal-delay="100">
          <table role="table" className="plans-table w-full border-collapse text-left text-[15px] sm:min-w-[560px]">
            <caption className="sr-only">What free and company accounts include</caption>
            <thead>
              <tr role="row" className="border-b-2 border-[#23282D] align-bottom">
                <th role="columnheader" scope="col" className="w-[44%] py-4 pr-4 font-normal text-[#565D63]">Included</th>
                <th role="columnheader" scope="col" className="w-[28%] bg-[#F3F4F2] px-3 py-3 sm:px-4 sm:py-4">
                  <span className="t-h4 block">Free</span>
                  <span className="num mt-0.5 block text-[13px] font-normal leading-snug text-[#565D63] sm:mt-1 sm:text-[15px]"><span style={{ fontFamily: "system-ui, sans-serif" }}>₹</span>0, for individuals</span>
                </th>
                <th role="columnheader" scope="col" className="w-[28%] bg-[#23282D] px-3 py-3 text-white sm:px-4 sm:py-4">
                  <span className="t-h4 block">Company</span>
                  <span className="mt-0.5 block text-[13px] font-normal leading-snug text-white/70 sm:mt-1 sm:text-[15px]">Pricing on request</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map(([label, free, company]) => (
                <tr role="row" key={label} className="border-b border-[#D6D9D4]">
                  <th role="rowheader" scope="row" className="pt-3.5 pr-4 align-top font-semibold leading-snug sm:py-3.5">{label}</th>
                  <td role="cell" className="px-3 pb-3.5 pt-1.5 align-top leading-snug text-[#3A4046] sm:px-4 sm:py-3.5"><CellView v={free} /></td>
                  <td role="cell" className="bg-white px-3 pb-3.5 pt-1.5 align-top leading-snug text-[#3A4046] sm:px-4 sm:py-3.5"><CellView v={company} /></td>
                </tr>
              ))}
              <tr className="plans-cta hidden sm:table-row">
                <td />
                <td className="px-4 pt-6 align-top">
                  <PrimaryLink href={PLAY_URL}>Download free</PrimaryLink>
                </td>
                <td className="px-4 pt-6 align-top">
                  <SecondaryLink href="/#contact" onClick={onCompany}>Talk to us</SecondaryLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-3 sm:hidden">
          <PrimaryLink href={PLAY_URL}>Download free</PrimaryLink>
          <SecondaryLink href="/#contact" onClick={onCompany}>Talk to us about a company account</SecondaryLink>
        </div>
        <p className="t-small mt-8 max-w-[70ch] text-[#565D63]">
          Ads are marked “Ad” or “Sponsored”, and we never give your personal details to sponsors. The app shows your exact
          limits and when they reset.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- manufacturers */

// A made-up listing, using the fields the app's Product details screen shows.
const SAMPLE = [
  ["Product type", "High-build epoxy primer"],
  ["Volume solids", "80 %"],
  ["DFT range", "100 to 200 µm"],
  ["Mixing ratio", "4 : 1 by volume"],
  ["Pot life", "2 h at 25 °C"],
  ["Touch dry", "3 h at 25 °C"],
  ["Overcoat interval", "8 h minimum"],
  ["Pack size", "20 L"],
];

const SETUP = [
  ["Get in touch", "Tell us about your company and your team, by WhatsApp, email or the form below."],
  ["We set up your company", "We add your company name and logo, approve your company email domain and make your company admins."],
  ["Add products, bring your team", "Your admin publishes your products from the app, and your people sign up under your company."],
];

function Manufacturers({ onCompany }: { onCompany: () => void }) {
  return (
    <section id="manufacturers" className="anchor section-y border-t-2 border-[#23282D] bg-white">
      <div className={`${wrap} grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]`}>
        <div>
          <h2 className={h2} data-reveal>For manufacturers</h2>
          <p className={lead}>
            Put your product data in front of the inspectors, applicators and engineers who choose and use it every day.
          </p>

          <dl className="mt-10 space-y-8">
            {[
              ["Your products, where the job is planned", "Your company and logo appear in Product details alongside other manufacturers. Company teams pick products straight into their bills of quantities and project reports, and the product's data fills in, so an accurate listing puts your products into their paperwork."],
              ["You keep your listings up to date", "Your company admin adds and edits products from the Company Admin Panel in the app. No files to send us."],
              ["Your whole team on one company account", "Your people sign up under your company and get every tool, with no daily limits and no ads. They pick products into BOQs and project reports instead of typing data in, and the reports they log stay with your company."],
              ["Reach coating professionals directly", "Sponsored placements on the app's Home screen carry your name and link straight to your website, WhatsApp or phone."],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="t-h5">{t}</dt>
                <dd className="t-body mt-2 max-w-[60ch] text-[#565D63]">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="self-start lg:sticky lg:top-[calc(var(--header-h)+2rem)]" data-reveal data-reveal-delay="150">
          <div className="border-2 border-[#23282D] bg-[#F3F4F2]">
            <div className="flex items-center justify-between gap-4 bg-[#23282D] px-5 py-4 text-white">
              <div>
                <p className="text-sm text-white/65">Your company</p>
                <p className="t-h5">Your Primer 100</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-white text-xs font-bold text-[#23282D]">Logo</span>
            </div>
            <dl className="num divide-y divide-[#D6D9D4] px-5">
              {SAMPLE.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2.5 text-[15px]">
                  <dt className="text-[#565D63]">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-[#D6D9D4] px-5 py-3 text-sm font-semibold text-[#4C6395]">Product data sheet (PDF)</p>
          </div>
          <figcaption className="mt-3 text-sm text-[#6B7278]">A sample listing, laid out as it appears in the app.</figcaption>
        </figure>
      </div>

      <div className={`${wrap} mt-16 sm:mt-20`}>
        <h3 className="t-h4">How we set up your company</h3>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {SETUP.map(([t, d], i) => (
            <li key={t} data-reveal data-reveal-delay={String(i * 110)} className="border-t-[3px] border-[#23282D] pt-5">
              <p className="num text-sm font-semibold text-[#6B7278]">Step {i + 1}</p>
              <p className="t-h5 mt-1">{t}</p>
              <p className="t-body mt-2 text-[#565D63]">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <SecondaryLink href="/#contact" onClick={onCompany}>Set up your company</SecondaryLink>
          <a
            href={whatsapp("Hello iCOPEDIA team, I'd like to set up our company on iCOPEDIA.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-2 py-3 text-[16px] font-semibold text-[#4C6395] underline underline-offset-4"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- faq */

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is iCOPEDIA really free?",
    a: "Yes. Calculators, bills of quantities, Ustad, the Community, tutorials, news and notes are free, with daily limits on new BOQs and on Ustad. Free accounts see a few ads. If we add paid features later, we'll show the price first and you decide.",
  },
  {
    q: "How do I sign in?",
    a: "With your mobile number. We send you a code; there's no password. An account can be signed in on one phone at a time.",
  },
  {
    q: "Which phones does it work on?",
    a: "Android, from Google Play.",
  },
  {
    q: "Can I rely on Ustad's answers?",
    a: "Treat them as a first answer. AI can be wrong, so check against the product data sheet, the specification and the relevant standard before you act.",
  },
  {
    q: "Who can see my notes and reports?",
    a: (
      <>
        Notes are private unless you share them. On a company account, project reports stay with your company. Our{" "}
        <a href="/privacy-policy" className="font-semibold text-[#4C6395] underline underline-offset-4">Privacy Policy</a> has the details.
      </>
    ),
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        Use Delete account in your Profile, or email{" "}
        <a href={mailto("Delete my account")} className="font-semibold text-[#4C6395] underline underline-offset-4">{EMAIL}</a>.
      </>
    ),
  },
];

function Faq() {
  return (
    <section id="faq" className="anchor section-y">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]`}>
        <div>
          <h2 className={h2} data-reveal>Questions</h2>
          <p className="t-body mt-4 text-[#565D63]">
            More in{" "}
            <a href="/support" className="font-semibold text-[#4C6395] underline underline-offset-4">Help and FAQ</a>.
          </p>
        </div>
        <div className="border-t-2 border-[#23282D]" data-reveal data-reveal-delay="100">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-[#D6D9D4]">
              <summary className="t-h5 flex items-center justify-between gap-6 py-5">
                {f.q}
                <Plus className="faq-sign h-5 w-5 shrink-0 transition-transform duration-200" aria-hidden="true" />
              </summary>
              <div className="t-body max-w-[62ch] pb-6 text-[#3A4046]">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- contact */

function Contact({ role, formKey }: { role: Role; formKey: number }) {
  return (
    <section id="contact" className="anchor section-y border-t-2 border-[#23282D] bg-[#E6E8E4]">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]`}>
        <div>
          <h2 className={h2} data-reveal>Talk to us</h2>
          <p className="t-lead mt-4 max-w-[44ch] text-[#3A4046]">
            Questions about the app, setting up your company or advertising? Send a message, or reach us directly.
          </p>
          <dl className="mt-8 space-y-5 text-[16px]">
            <div>
              <dt className="text-sm text-[#565D63]">WhatsApp</dt>
              <dd>
                <a href={whatsapp("Hello iCOPEDIA team")} target="_blank" rel="noopener noreferrer" className="num text-lg font-bold underline underline-offset-4">
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[#565D63]">Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="text-lg font-bold underline underline-offset-4">{EMAIL}</a>
              </dd>
            </div>
          </dl>
        </div>
        <div data-reveal data-reveal-delay="120"><ContactForm key={formKey} defaultRole={role} /></div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- page */

const Index = () => {
  // "Set up your company" buttons open the contact form with Manufacturer picked.
  const [role, setRole] = useState<Role>("Coating professional");
  const [formKey, setFormKey] = useState(0);
  const contactAsCompany = () => {
    setRole("Manufacturer");
    setFormKey((k) => k + 1);
  };

  useReveal();

  useEffect(() => {
    document.title = seoFor("/").title;
    // Arriving from another page's nav (/#plans etc.): jump to that section.
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  return (
    <div className="ico min-h-screen">
      <SiteNav />
      <main>
        <Hero onCompany={contactAsCompany} />
        <Tools />
        <Ustad />
        <Plans onCompany={contactAsCompany} />
        <Manufacturers onCompany={contactAsCompany} />
        <Faq />
        <Contact role={role} formKey={formKey} />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
