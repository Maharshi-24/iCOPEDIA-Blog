import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const TITLE = "COMING SOON";
const WHATSAPP_NUMBER = "919274722707";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi iCOPEDIA, I'd like to know more.",
)}`;
const MARQUEE = [
  "Industrial Coatings",
  "Protective Systems",
  "Inspection",
  "Digitised Workflows",
  "Surface Integrity",
  "Asset Longevity",
];

const ComingSoon = () => {
  const [mounted, setMounted] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Pointer-tracked glow. Written straight to the transform so it never
  // re-renders the tree on mouse move.
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        el.style.transform = `translate3d(${e.clientX - 320}px, ${e.clientY - 320}px, 0)`;
        frame = 0;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={`cs-root ${mounted ? "is-ready" : ""}`}>
      <style>{`
        .cs-root {
          --ink:       #04070f;
          --blue-950:  #050b1c;
          --blue-900:  #081538;
          --blue-800:  #0d2260;
          --blue-600:  #2563eb;
          --blue-500:  #3b82f6;
          --blue-400:  #60a5fa;
          --blue-200:  #c3d8ff;
          --paper:     #eaf1ff;

          position: relative;
          min-height: 100svh;
          width: 100%;
          overflow: hidden;
          background: var(--ink);
          color: var(--paper);
          font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          isolation: isolate;
        }

        /* ---------- atmosphere ---------- */

        .cs-field {
          position: absolute;
          inset: -30%;
          z-index: 0;
          pointer-events: none;
        }
        .cs-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0;
          transition: opacity 2.4s ease;
        }
        .is-ready .cs-orb { opacity: 1; }
        .cs-orb-a {
          width: 46vw; height: 46vw;
          left: 4%; top: 8%;
          background: radial-gradient(circle, var(--blue-600) 0%, transparent 68%);
          animation: drift-a 22s ease-in-out infinite;
        }
        .cs-orb-b {
          width: 38vw; height: 38vw;
          right: 6%; top: 26%;
          background: radial-gradient(circle, var(--blue-800) 0%, transparent 70%);
          animation: drift-b 28s ease-in-out infinite;
        }
        .cs-orb-c {
          width: 30vw; height: 30vw;
          left: 38%; bottom: 2%;
          background: radial-gradient(circle, var(--blue-500) 0%, transparent 72%);
          opacity: 0;
          animation: drift-c 25s ease-in-out infinite;
        }
        .is-ready .cs-orb-c { opacity: .55; }

        @keyframes drift-a {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(8%, 6%, 0) scale(1.12); }
        }
        @keyframes drift-b {
          0%,100% { transform: translate3d(0,0,0) scale(1.08); }
          50%     { transform: translate3d(-7%, -5%, 0) scale(1); }
        }
        @keyframes drift-c {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50%     { transform: translate3d(-6%, -8%, 0) scale(1.18); }
        }

        /* fine engineering grid */
        .cs-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(96,165,250,.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(96,165,250,.07) 1px, transparent 1px);
          background-size: 76px 76px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 45%, #000 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 45%, #000 30%, transparent 100%);
          opacity: 0;
          transition: opacity 1.8s ease .3s;
        }
        .is-ready .cs-grid { opacity: 1; }

        /* pointer glow */
        .cs-glow {
          position: fixed;
          top: 0; left: 0;
          width: 640px; height: 640px;
          z-index: 2;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,.20) 0%, transparent 62%);
          will-change: transform;
        }

        /* grain */
        .cs-grain {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          opacity: .32;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
        }

        /* ---------- layout ---------- */

        .cs-shell {
          position: relative;
          z-index: 4;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 100svh;
          padding: clamp(1.5rem, 4vw, 3.25rem);
          gap: 2rem;
        }

        .cs-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .cs-logo {
          height: clamp(56px, 7.5vw, 86px);
          width: auto;
          display: block;
          user-select: none;
        }

        .cs-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: clamp(1.25rem, 2.4vw, 2rem);
          max-width: 1400px;
        }

        /* staged reveal */
        .cs-rise {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity .95s cubic-bezier(.16,1,.3,1),
                      transform .95s cubic-bezier(.16,1,.3,1);
        }
        .is-ready .cs-rise { opacity: 1; transform: none; }

        .cs-eyebrow {
          font-size: clamp(.62rem, 1.15vw, .76rem);
          letter-spacing: .38em;
          text-transform: uppercase;
          color: var(--blue-400);
          transition-delay: .15s;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .cs-eyebrow::before {
          content: "";
          width: clamp(28px, 5vw, 64px);
          height: 1px;
          background: linear-gradient(90deg, var(--blue-400), transparent);
        }

        .cs-title {
          font-size: clamp(2.5rem, 9vw, 8.5rem);
          line-height: .88;
          font-weight: 800;
          letter-spacing: -.035em;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0 .3em;
        }
        /* a word is an atomic unit - characters inside it never break apart */
        .cs-word {
          display: inline-flex;
          white-space: nowrap;
        }
        .cs-char {
          display: inline-block;
          opacity: 0;
          transform: translateY(.42em) rotate(4deg);
          background: linear-gradient(180deg, var(--paper) 12%, var(--blue-400) 96%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: opacity .8s cubic-bezier(.16,1,.3,1),
                      transform .8s cubic-bezier(.16,1,.3,1);
        }
        .is-ready .cs-char { opacity: 1; transform: none; }

        .cs-contact {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: clamp(1.25rem, 3vw, 2.5rem);
          transition-delay: 1.05s;
        }

        .cs-wa {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          padding: .7rem 1.1rem .7rem .7rem;
          border: 1px solid rgba(96,165,250,.28);
          border-radius: 16px;
          background: rgba(8,21,56,.45);
          backdrop-filter: blur(8px);
          color: var(--paper);
          text-decoration: none;
          transition: border-color .4s ease, transform .4s cubic-bezier(.16,1,.3,1);
        }
        .cs-wa:hover {
          border-color: rgba(96,165,250,.6);
          transform: translateY(-2px);
        }
        .cs-qr {
          display: block;
          padding: 6px;
          border-radius: 10px;
          background: #fff;
          line-height: 0;
        }
        .cs-wa-text {
          display: flex;
          flex-direction: column;
          gap: .3rem;
        }
        .cs-wa-label {
          font-size: clamp(.6rem, 1vw, .68rem);
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--blue-400);
        }
        .cs-wa-tap { display: none; }
        .cs-link {
          font-family: 'Poppins', system-ui, sans-serif;
          font-size: clamp(.82rem, 1.35vw, .95rem);
          color: var(--paper);
          text-decoration: none;
          position: relative;
          padding-bottom: 3px;
        }
        .cs-link::after {
          content: "";
          position: absolute;
          left: 0; bottom: 0;
          width: 100%; height: 1px;
          background: var(--blue-400);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform .5s cubic-bezier(.16,1,.3,1);
        }
        .cs-link:hover::after { transform: scaleX(1); transform-origin: left; }

        /* ---------- marquee ---------- */

        .cs-foot {
          position: relative;
          z-index: 4;
          border-top: 1px solid rgba(96,165,250,.14);
          padding-top: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          opacity: 0;
          transition: opacity 1s ease 1.5s;
        }
        .is-ready .cs-foot { opacity: 1; }

        .cs-track {
          display: flex;
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        }
        .cs-lane {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: 2.5rem;
          padding-right: 2.5rem;
          animation: slide 34s linear infinite;
        }
        @keyframes slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
        .cs-tag {
          display: inline-flex;
          align-items: center;
          gap: 2.5rem;
          white-space: nowrap;
          font-size: clamp(.62rem, 1vw, .72rem);
          letter-spacing: .3em;
          text-transform: uppercase;
          color: rgba(195,216,255,.38);
        }
        .cs-tag::after {
          content: "";
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(96,165,250,.35);
        }

        .cs-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          font-size: clamp(.6rem, .95vw, .68rem);
          letter-spacing: .2em;
          text-transform: uppercase;
          color: rgba(195,216,255,.34);
        }

        @media (max-width: 640px) {
          .cs-contact { flex-direction: column; align-items: flex-start; }
          /* on a phone the QR can't be scanned from itself, so it becomes a tap target */
          .cs-qr { display: none; }
          .cs-wa { padding: .75rem 1.1rem; }
          .cs-wa-scan { display: none; }
          .cs-wa-tap { display: inline; }
          .cs-meta { flex-direction: column; align-items: flex-start; gap: .5rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-root *,
          .cs-root *::before,
          .cs-root *::after {
            animation: none !important;
            transition-duration: .01ms !important;
          }
          .cs-char, .cs-rise, .cs-foot, .cs-grid, .cs-orb { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="cs-field" aria-hidden="true">
        <div className="cs-orb cs-orb-a" />
        <div className="cs-orb cs-orb-b" />
        <div className="cs-orb cs-orb-c" />
      </div>
      <div className="cs-grid" aria-hidden="true" />
      <div className="cs-glow" ref={glowRef} aria-hidden="true" />
      <div className="cs-grain" aria-hidden="true" />

      <div className="cs-shell">
        <header className="cs-head">
          <img
            src="/icopedia-logo.png"
            alt="iCOPEDIA — Coatings Simplified"
            className="cs-logo cs-rise"
            width={483}
            height={489}
            draggable={false}
          />
        </header>

        <main className="cs-main">
          <p className="cs-eyebrow cs-rise">Digitising the Coatings Ecosystem</p>

          <h1 className="cs-title" aria-label={TITLE}>
            {TITLE.split(" ").map((word, wordIndex, words) => {
              // running char count so the stagger stays continuous across words
              const offset = words
                .slice(0, wordIndex)
                .reduce((n, w) => n + w.length + 1, 0);

              return (
                <span className="cs-word" key={word} aria-hidden="true">
                  {word.split("").map((ch, i) => (
                    <span
                      key={i}
                      className="cs-char"
                      style={{ transitionDelay: `${0.35 + (offset + i) * 0.045}s` }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              );
            })}
          </h1>

          <div className="cs-contact cs-rise">
            <a className="cs-link" href="mailto:contact@icopedia.co">
              contact@icopedia.co
            </a>
            <a
              className="cs-wa"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with iCOPEDIA on WhatsApp"
            >
              <span className="cs-qr">
                <QRCodeSVG value={WHATSAPP_URL} size={88} level="M" fgColor="#04070f" />
              </span>
              <span className="cs-wa-text">
                <span className="cs-wa-label">
                  <span className="cs-wa-scan">Scan to WhatsApp us</span>
                  <span className="cs-wa-tap">Chat on WhatsApp</span>
                </span>
              </span>
            </a>
          </div>
        </main>

        <footer className="cs-foot">
          <div className="cs-track" aria-hidden="true">
            {[0, 1].map((lane) => (
              <div className="cs-lane" key={lane}>
                {MARQUEE.map((word) => (
                  <span className="cs-tag" key={word}>
                    {word}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="cs-meta">
            <span>© {new Date().getFullYear()} iCOPEDIA</span>
            <span>Launching Soon</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ComingSoon;
