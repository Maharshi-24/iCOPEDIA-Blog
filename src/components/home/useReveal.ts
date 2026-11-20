import { useEffect } from "react";

/**
 * Fades elements marked `data-reveal` in, a little, the first time they
 * scroll into view. Content is only hidden once this has run (the root gets
 * `reveal-ready`), so nothing stays invisible if JavaScript fails, and
 * nothing is hidden at all for people who prefer reduced motion.
 * An optional `data-reveal-delay="120"` staggers neighbours.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ico");
    if (!root) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    els.forEach((el) => {
      const d = el.dataset.revealDelay;
      if (d) el.style.setProperty("--reveal-delay", `${d}ms`);
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    root.classList.add("reveal-ready");
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
