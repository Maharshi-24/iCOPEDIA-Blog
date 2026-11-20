import { useEffect } from "react";
import "@/components/home/home.css";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";
import { NOT_FOUND } from "@/seo";

// Prerendered to dist/404.html, which Vercel serves with a real 404 status for
// any URL that isn't a page, redirect or file. The head carries noindex.
const NEXT = [
  { href: "/", label: "Home", text: "What the iCOPEDIA app does, and how to get it." },
  { href: "/support", label: "Help and FAQ", text: "Signing in, limits, company accounts and your data." },
  { href: "/#contact", label: "Contact us", text: "WhatsApp, email or the contact form." },
];

const NotFound = () => {
  useEffect(() => {
    document.title = NOT_FOUND.title;
  }, []);

  return (
    <div className="ico min-h-screen">
      <SiteNav />
      <main className="hero-top pb-[var(--section-y)]">
        <div className="wrap">
          <p className="num text-[15px] font-semibold text-[#6B7278]">Error 404</p>
          <h1 className="t-title mt-2 max-w-[14ch]">This page doesn't exist</h1>
          <p className="t-lead mt-5 max-w-[52ch] text-[#3A4046]">
            The link may be old or mistyped. Try one of these instead.
          </p>
          <ul className="mt-10 grid max-w-4xl gap-6 border-t-2 border-[#23282D] pt-6 sm:grid-cols-3">
            {NEXT.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="t-h5 text-[#23282D] underline underline-offset-4 hover:text-[#4C6395]">
                  {n.label}
                </a>
                <p className="t-body mt-1 text-[#565D63]">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
