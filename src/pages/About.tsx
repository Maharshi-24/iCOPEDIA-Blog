import { useEffect } from "react";
import { Check } from "lucide-react";
import "@/components/home/home.css";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";
import { useReveal } from "@/components/home/useReveal";
import { arriveAtSection } from "@/components/home/site";
import { seoFor } from "@/seo";

// About us. Copy is the approved company text (Nov 2026). The aspirations are
// drawn as a coating system in cross-section: topcoat at the top, substrate at
// the bottom, each layer a different coat colour from home.css.

const ASPIRATIONS = [
  {
    name: "A connected industry",
    text: "Bringing together manufacturers, channel partners, consultants, applicators, inspectors, project owners and other industry participants into a common ecosystem that encourages meaningful connections and collaboration.",
    coat: "#F2A900",
  },
  {
    name: "A knowledge-driven community",
    text: "Encouraging the seamless exchange of knowledge, experience and practical insights, ensuring essential information reaches the last mile effectively.",
    coat: "#4C6395",
  },
  {
    name: "Shared opportunities and growth",
    text: "Creating avenues for industry interaction, awareness, innovation and opportunities that contribute to collective progress.",
    coat: "#6B7278",
  },
  {
    name: "A level playing ground",
    text: "Promoting wider access to essential information and knowledge, empowering professionals across the industry to participate, perform and progress with greater confidence.",
    coat: "#A4442E",
  },
  {
    name: "Smarter resource optimisation",
    text: "Encouraging better utilisation of time, energy, manpower and materials while minimising information gaps, inefficiencies and avoidable project losses.",
    coat: "#23282D",
  },
];

const COMMITMENTS = [
  "Connects people and strengthens professional relationships.",
  "Encourages collaboration and knowledge sharing.",
  "Enables seamless and effective last-mile information flow.",
  "Promotes transparency and informed decisions.",
  "Creates opportunities for learning, interaction and growth.",
  "Optimises resources and minimises avoidable losses.",
  "Advances the industry through collective participation and progress.",
];

function Hero() {
  return (
    <section className="hero-top pb-[var(--section-y)]">
      <div className="wrap">
        <h1 className="t-title max-w-[15ch]">
          <span className="block">Building an ecosystem.</span>
          <span className="block text-[#6B7278]">Empowering a community.</span>
        </h1>
        <p className="load-in t-h4 mt-8 max-w-[38ch] text-[#3A4046] sm:mt-10" style={{ ["--load-delay" as string]: "100ms" }}>
          Connecting people, knowledge and opportunities to create a more connected, collaborative and progressive
          protective coatings industry.
        </p>
      </div>
    </section>
  );
}

function Vision() {
  return (
    <section id="vision" className="anchor section-y border-t-2 border-[#23282D] bg-white">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-16">
        <h2 className="t-h2" data-reveal>Our vision</h2>
        <div className="space-y-6" data-reveal data-reveal-delay="100">
          <p className="t-h4 font-semibold text-[#23282D]">
            The protective coatings and corrosion protection industry thrives on the collective contribution of diverse
            participants, expertise and resources.
          </p>
          <p className="t-lead text-[#3A4046]">
            We envision a connected ecosystem that brings the industry closer, creating an environment where people
            connect, knowledge flows seamlessly, ideas evolve and opportunities emerge.
          </p>
          <p className="t-lead text-[#3A4046]">
            An ecosystem that goes beyond individual interests to encourage collaboration, strengthen professional
            relationships and create a level playing ground for collective growth and progress.
          </p>
        </div>
      </div>
    </section>
  );
}

function Aspirations() {
  return (
    <section className="section-y">
      <div className="wrap">
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-16">
          <h2 className="t-h2" data-reveal>What we aspire to build</h2>
          <p className="t-lead max-w-[48ch] text-[#565D63] md:pt-2" data-reveal>
            Like a coating system, each layer does its own job, and the protection comes from all of them working
            together.
          </p>
        </div>

        {/* The cross-section: one continuous column of coats down the left edge. */}
        <ul className="mt-10 sm:mt-14" aria-label="What we aspire to build">
          {ASPIRATIONS.map((a, i) => (
            <li key={a.name} className="grid grid-cols-[0.75rem_minmax(0,1fr)] sm:grid-cols-[4.5rem_minmax(0,1fr)]">
              <div aria-hidden="true" style={{ background: a.coat }} />
              <div
                data-reveal
                className={`py-7 pl-5 sm:py-9 sm:pl-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-x-12 lg:pl-10 ${
                  i < ASPIRATIONS.length - 1 ? "border-b border-[#D6D9D4]" : ""
                }`}
              >
                <h3 className="t-h3 max-w-[18ch]">{a.name}</h3>
                <p className="t-body mt-3 max-w-[56ch] text-[#565D63] lg:mt-1.5">{a.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Commitment() {
  return (
    <section className="section-y border-t-2 border-[#23282D] bg-white">
      <div className="wrap grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-16">
        <div>
          <h2 className="t-h2" data-reveal>Our commitment</h2>
          <p className="t-lead mt-5 max-w-[36ch] text-[#3A4046]" data-reveal>
            We believe the true strength of an industry lies in the strength of its ecosystem and the collective
            capability of its community.
          </p>
        </div>
        <div data-reveal data-reveal-delay="100">
          <p className="t-h5 text-[#23282D]">We are committed to continuously nurturing an environment that:</p>
          <ul className="mt-5">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex gap-4 border-t border-[#D6D9D4] py-4">
                <Check className="mt-[0.2rem] h-5 w-5 shrink-0 text-[#A4442E]" strokeWidth={2.5} aria-hidden="true" />
                <span className="t-body text-[#23282D]">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Belief() {
  return (
    <section className="section-y relative bg-[#23282D] text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#F2A900]" aria-hidden="true" />
      <div className="wrap">
        <h2 className="text-[17px] font-semibold text-[#F2A900]" data-reveal>Our belief</h2>
        <p className="t-title mt-6 max-w-[18ch] text-white" data-reveal>
          An industry moves forward when its people move forward together.
        </p>
        <p className="t-lead mt-8 max-w-[52ch] text-white/80" data-reveal>
          We believe in the power of connections, the value of shared knowledge and the possibilities created through
          collective participation.
        </p>

        <div className="mt-16 border-t border-white/15 pt-10 sm:mt-20">
          <p className="semi-wide text-xl font-extrabold">
            iCOPEDIA<span className="align-super text-[0.5em]">™</span>
          </p>
          <p className="t-h4 mt-4 text-white/90">
            <span className="block">Connecting the ecosystem.</span>
            <span className="block">Empowering the community.</span>
            <span className="block">Advancing the industry.</span>
          </p>
          <a
            href="/"
            className="lift mt-10 inline-flex items-center justify-center rounded-[3px] bg-[#F2A900] px-6 py-3.5 text-[16px] font-bold text-[#23282D] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] hover:bg-[#FFB914]"
          >
            See the iCOPEDIA™ app
          </a>
        </div>
      </div>
    </section>
  );
}

const About = () => {
  useReveal();

  useEffect(() => {
    document.title = seoFor("/about").title;
    // The nav's "Vision" link (/about#vision): jump there, drop the hash.
    if (!arriveAtSection()) window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ico min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <Vision />
        <Aspirations />
        <Commitment />
        <Belief />
      </main>
      <SiteFooter />
    </div>
  );
};

export default About;
