// The hero visual: real screenshots of the app (public/screens, resized to 600 px
// wide from store_assets/raw) in phone frames, standing on a steel band.

const SCREENS = [
  {
    src: "/screens/calculators.jpg",
    alt: "The Calculators screen: coverage estimation, quantity estimation, part quantity, DFT to WFT, unit converter and dew point",
    title: "Calculators",
    text: "Six calculators for the numbers you work out on every job.",
    delay: 120,
  },
  {
    src: "/screens/home.jpg",
    alt: "The iCOPEDIA Home screen with tiles for calculators, product details, bill of quantities, project report, instruments, community, tutorials, news and notes",
    title: "Home",
    text: "Every tool one tap away, from BOQs to project reports.",
    delay: 0,
    raised: true,
  },
  {
    src: "/screens/ustad.jpg",
    alt: "The Ustad screen: AI chat and glossary topics such as general terms, types and systems, surface preparation, testing and QC, and defects",
    title: "Ustad",
    text: "Ask the AI assistant, or look it up in the coatings glossary.",
    delay: 240,
  },
];

function Phone({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="rounded-[2.4rem] bg-[#3A4046] p-[7px] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)] ring-1 ring-black/40">
      <img
        src={src}
        alt={alt}
        width={600}
        height={1333}
        loading="eager"
        decoding={priority ? "sync" : "async"}
        // The middle phone is the likeliest Largest Contentful Paint on phones.
        {...{ fetchpriority: priority ? "high" : "auto" }}
        className="block aspect-[9/20] w-full rounded-[2rem] bg-white object-cover object-top"
      />
    </div>
  );
}

export function AppScreens() {
  return (
    <div className="relative mt-16 sm:mt-20">
      {/* The steel band starts halfway up the phones, so they stand on it. */}
      <div className="absolute inset-x-0 bottom-0 top-[38%] bg-[#23282D]" aria-hidden="true">
        <div className="h-1 bg-[#F2A900]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-16">
        <ul className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 lg:gap-14">
          {SCREENS.map((s) => (
            <li
              key={s.title}
              className={`w-[68%] shrink-0 snap-center sm:w-auto ${s.raised ? "sm:-translate-y-8" : "sm:translate-y-4"}`}
            >
              <div className="rise mx-auto max-w-[290px]" style={{ animationDelay: `${s.delay}ms` }}>
                <Phone src={s.src} alt={s.alt} priority={s.raised} />
                <p className="semi-wide mt-6 text-lg font-bold text-white">{s.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-white/70">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
