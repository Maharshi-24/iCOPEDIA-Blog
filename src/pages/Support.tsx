import { useEffect } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";

// Help for app users, linked from the app's sign-in screen ("Need help?")
// and Settings ("Help & FAQ"). Keep the answers in step with how the app
// actually works.
const EMAIL = "hello@icopedia.co";
const PHONE_DISPLAY = "+91 92747 22707";
const PHONE_TEL = "+919274722707";
const WHATSAPP = "919274722707";

type Faq = { q: string; a: React.ReactNode };

const link = "text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e3a8a]";
const mail = (subject: string) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

const SECTIONS: { id: string; title: string; faqs: Faq[] }[] = [
  {
    id: "signing-in",
    title: "Signing in",
    faqs: [
      {
        q: "I didn't get the code (OTP)",
        a: (
          <>
            Check the mobile number you entered, then wait a minute: codes can take a little while
            to arrive. Make sure the phone has signal and SMS isn't blocked. Then tap resend on the
            code screen. Still nothing? Message us on WhatsApp with your number and we'll check.
          </>
        ),
      },
      {
        q: "My number can't sign in",
        a: (
          <>
            iCOPEDIA is in early access, so sign-in works for numbers that have been given access.
            Message us on WhatsApp or email {EMAIL} with your name, company and mobile number, and
            we'll set you up.
          </>
        ),
      },
      {
        q: "I was signed out on my other phone",
        a: (
          <>
            An account can be signed in on one phone at a time. Signing in on a new phone signs the
            old one out, which keeps your account safe.
          </>
        ),
      },
      {
        q: "Why do I have to tick the Terms box?",
        a: (
          <>
            By signing in you agree to our <a className={link} href="/terms">Terms of Use</a> and{" "}
            <a className={link} href="/privacy-policy">Privacy Policy</a>. Tap either link on the
            sign-in screen to read them first.
          </>
        ),
      },
    ],
  },
  {
    id: "using-the-app",
    title: "Using the app",
    faqs: [
      {
        q: "How many BOQs can I create?",
        a: (
          <>
            Free accounts can create a set number of new BOQs per day or per week. The BOQ screen
            shows how many you have left and when the count resets. You can always open, view and
            share the BOQs you've already made.
          </>
        ),
      },
      {
        q: "Ustad says I've reached my limit",
        a: <>Ustad, the AI assistant, has a daily allowance. It resets automatically; the app shows when.</>,
      },
      {
        q: "How do I start a thread in the Community?",
        a: (
          <>
            Anyone can join discussions. To start a new thread, get verified: complete your profile
            (company, role and contact details) and send a verification request from the Community.
            Our team will verify you shortly.
          </>
        ),
      },
      {
        q: "Why do I see ads?",
        a: (
          <>
            Free accounts see a few ads at the bottom of the Home screen. Ads are marked "Ad" or
            "Sponsored", and we don't share your personal data with sponsors.
          </>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Your account and data",
    faqs: [
      {
        q: "How do I change my name, company or other details?",
        a: <>Open your Profile in the app and edit the details there.</>,
      },
      {
        q: "How do I delete my account?",
        a: (
          <>
            Use Delete account in your Profile, or email us. See{" "}
            <a className={link} href="/privacy-policy#delete-account">how deletion works</a> and
            what is removed. We complete deletion within 30 days.
          </>
        ),
      },
      {
        q: "I want to report a problem, a post or a person",
        a: (
          <>
            Email <a className={link} href={mail("Report")}>{EMAIL}</a> or message us on WhatsApp
            with a screenshot if you can. For privacy complaints, see the{" "}
            <a className={link} href="/privacy-policy#contact">grievance contact</a>.
          </>
        ),
      },
    ],
  },
];

const Support = () => {
  useEffect(() => {
    document.title = "Support | iCOPEDIA";
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello iCOPEDIA team, I need help with the app.")}`;
  const contacts = [
    { icon: MessageCircle, title: "WhatsApp", value: PHONE_DISPLAY, href: wa, note: "Message us any time" },
    { icon: Mail, title: "Email", value: EMAIL, href: mail("iCOPEDIA app support"), note: "For anything in detail" },
    { icon: Phone, title: "Call", value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}`, note: "Talk to the team" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fd] font-sans text-[#334155]">
      <header className="border-b border-[#e2e8f5] bg-[#04070f]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="text-lg font-semibold tracking-wide text-white">
            iCOPEDIA<span className="align-super text-[0.6em]">™</span>
          </a>
          <a href={`mailto:${EMAIL}`} className="text-sm text-[#93c5fd] hover:text-white">
            {EMAIL}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Help &amp; support</h1>
        <p className="mt-2 text-[0.98rem] text-[#64748b]">
          Answers to common questions about the iCOPEDIA app, and how to reach us.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {contacts.map(({ icon: Icon, title, value, href, note }) => (
            <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
              className="rounded-xl border border-[#dbe3f3] bg-white px-4 py-4 transition hover:border-[#93c5fd] hover:shadow-sm">
              <Icon className="h-5 w-5 text-[#1d4ed8]" />
              <div className="mt-2 font-semibold text-[#0f172a]">{title}</div>
              <div className="text-sm text-[#1d4ed8]">{value}</div>
              <div className="mt-1 text-xs text-[#64748b]">{note}</div>
            </a>
          ))}
        </div>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="mb-3 text-xl font-semibold text-[#0f172a] sm:text-2xl">{s.title}</h2>
              <div className="divide-y divide-[#e8edf7] rounded-xl border border-[#dbe3f3] bg-white">
                {s.faqs.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[#0f172a]">
                      {f.q}
                      <span className="text-[#94a3b8] transition group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className="mt-2 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-[#64748b]">
          See also our <a className={link} href="/terms">Terms of Use</a> and{" "}
          <a className={link} href="/privacy-policy">Privacy Policy</a>.
        </p>
      </main>

      <footer className="border-t border-[#e2e8f5] py-6 text-center text-sm text-[#64748b]">
        © {new Date().getFullYear()} iCOPEDIA GLOBAL. All rights reserved.
      </footer>
    </div>
  );
};

export default Support;
