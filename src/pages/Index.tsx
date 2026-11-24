import { useEffect } from "react";
import { BookOpenText, Calculator, NotebookPen, Users } from "lucide-react";
import "@/components/home/home.css";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";
import { AppScreens } from "@/components/home/AppScreens";
import { ContactForm } from "@/components/home/ContactForm";
import { StoreButtons } from "@/components/home/StoreButtons";
import { useReveal } from "@/components/home/useReveal";
import { EMAIL, PHONE_DISPLAY, arriveAtSection, whatsapp } from "@/components/home/site";
import { seoFor } from "@/seo";

// Home page: the iCOPEDIA Individual App. Copy is the approved app text
// (Nov 2026); the company story lives on /about. Design tokens are in
// components/home/home.css.

/* -------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="hero-top">
      <div className="wrap">
        <h1 className="t-display max-w-[13ch]">The industry in your pocket.</h1>
        <p className="load-in t-h4 mt-6 max-w-[30ch] text-[#23282D] sm:mt-8" style={{ ["--load-delay" as string]: "80ms" }}>
          Your everyday digital companion for the protective coatings industry.
        </p>
        <p className="load-in t-lead mt-4 max-w-[56ch] text-[#3A4046]" style={{ ["--load-delay" as string]: "140ms" }}>
          Bringing useful digital tools, practical knowledge and industry connections closer to the professionals who
          need them.
        </p>
        <div className="load-in mt-8 sm:mt-9" style={{ ["--load-delay" as string]: "200ms" }}>
          <StoreButtons />
        </div>
      </div>
      <AppScreens />
    </section>
  );
}

/* ------------------------------------------------------------------ intro */

function Intro() {
  return (
    <section className="section-y bg-white">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-16">
        <h2 className="t-h2 max-w-[16ch]" data-reveal>
          Everyday tasks, made simpler.
        </h2>
        <div className="t-lead space-y-5 text-[#3A4046]" data-reveal data-reveal-delay="100">
          <p>
            The iCOPEDIA™ Individual App is designed to simplify everyday industry-related tasks through accessible
            digital tools and a growing professional community.
          </p>
          <p>
            Free to download, it offers a convenient mobile experience for professionals associated with the
            protective coatings and corrosion protection industry.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- features */

const FEATURES = [
  {
    icon: Calculator,
    name: "Practical calculators",
    text: "Simplify everyday coating-related calculations with a range of useful digital tools designed for practical industry requirements.",
    coat: "#A4442E",
  },
  {
    icon: NotebookPen,
    name: "Digital notes",
    text: "Capture important observations, thoughts and everyday work-related information in one convenient place.",
    coat: "#6B7278",
  },
  {
    icon: Users,
    name: "Industry community",
    text: "Be part of a growing professional community centred around the protective coatings industry. Explore community discussions and participate through verified membership.",
    coat: "#4C6395",
  },
  {
    icon: BookOpenText,
    name: "Ustad, your digital learning companion",
    text: "Explore AI-powered assistance for general coating-related queries and enhance your everyday learning experience.",
    coat: "#F2A900",
  },
];

function Features() {
  return (
    <section id="features" className="anchor section-y border-t-2 border-[#23282D]">
      <div className="wrap">
        <h2 className="t-h2 max-w-[18ch]" data-reveal>Designed around your everyday needs</h2>

        <ul className="mt-10 grid gap-x-12 sm:mt-14 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <li
              key={f.name}
              data-reveal
              data-reveal-delay={String((i % 2) * 100)}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-[#D6D9D4] py-8 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-x-5 sm:py-10"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-[3px] sm:h-[3.25rem] sm:w-[3.25rem]"
                style={{ background: f.coat, color: f.coat === "#F2A900" ? "#23282D" : "#fff" }}
                aria-hidden="true"
              >
                <f.icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              </span>
              <div>
                <h3 className="t-h4 max-w-[22ch]">{f.name}</h3>
                <p className="t-body mt-2 max-w-[46ch] text-[#565D63]">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- more than app */

function MoreThanAnApp() {
  return (
    <section className="section-y relative bg-[#23282D] text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#F2A900]" aria-hidden="true" />
      <div className="wrap">
        <h2 className="t-title max-w-[12ch] text-white" data-reveal>More than just an app</h2>
        <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-2 md:gap-16">
          <p className="t-lead text-white/85" data-reveal>
            iCOPEDIA™ is envisioned as a digital companion for an industry that depends on accurate information,
            practical knowledge and effective execution.
          </p>
          <p className="t-lead text-white/85" data-reveal data-reveal-delay="100">
            Our approach is simple: make useful digital capabilities accessible, reduce everyday complexities and
            encourage a more connected professional community.
          </p>
        </div>
        <p className="t-h3 mt-14 max-w-[30ch] border-l-4 border-[#F2A900] pl-5 text-white sm:mt-20 sm:pl-6" data-reveal>
          Whether you are at a project site, in an office or on the move, iCOPEDIA™ aims to keep essential digital tools
          within reach.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ about teaser */

function Ecosystem() {
  return (
    <section className="section-y bg-white">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-16">
        <h2 className="t-h2 max-w-[16ch]" data-reveal>Part of a wider ecosystem</h2>
        <div data-reveal data-reveal-delay="100">
          <p className="t-lead text-[#3A4046]">
            The app is one part of iCOPEDIA™, an effort to connect people, knowledge and opportunities and create a more
            connected, collaborative and progressive protective coatings industry.
          </p>
          <a
            href="/about"
            className="mt-6 inline-block text-[17px] font-semibold text-[#4C6395] underline underline-offset-4 hover:text-[#2E3D5C]"
          >
            Read about our vision
          </a>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- download */

function Download() {
  return (
    <section id="download" className="anchor section-y border-t-2 border-[#23282D]">
      <div className="wrap">
        <h2 className="t-title max-w-[16ch]" data-reveal>Start your iCOPEDIA™ experience</h2>
        <p className="t-h3 mt-8 text-[#23282D]" data-reveal>
          <span className="block">Simplify.</span>
          <span className="block">Connect.</span>
          <span className="block">Empower.</span>
        </p>
        <p className="t-lead mt-8 max-w-[52ch] text-[#3A4046]" data-reveal>
          Your industry. Your tools. Your community. Download the iCOPEDIA™ Individual App and become part of a growing
          digital ecosystem for the protective coatings industry.
        </p>
        <div className="mt-8" data-reveal>
          <p className="mb-3 text-[15px] font-semibold text-[#23282D]">Available for free download</p>
          <StoreButtons />
        </div>
        <p className="t-small mt-12 max-w-[72ch] border-t border-[#D6D9D4] pt-6 text-[#6B7278]">
          The iCOPEDIA™ Individual App offers selected features at no cost. Certain community participation and
          additional capabilities may require verification or fulfilment of applicable access requirements. Features and
          capabilities may evolve progressively.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- contact */

function Contact() {
  return (
    <section id="contact" className="anchor section-y border-t-2 border-[#23282D] bg-[#E6E8E4]">
      <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="t-h2" data-reveal>Talk to us</h2>
          <p className="t-lead mt-4 max-w-[44ch] text-[#3A4046]">
            Questions about the app or iCOPEDIA™? Send a message, or reach us directly.
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
        <div data-reveal data-reveal-delay="120"><ContactForm /></div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- page */

const Index = () => {
  useReveal();

  useEffect(() => {
    document.title = seoFor("/").title;
    // Arriving from another page's link (/#contact): jump there, drop the hash.
    arriveAtSection();
  }, []);

  return (
    <div className="ico min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <Intro />
        <Features />
        <MoreThanAnApp />
        <Ecosystem />
        <Download />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
