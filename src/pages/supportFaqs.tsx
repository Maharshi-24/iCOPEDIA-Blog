// The Help page's questions, also used for its FAQPage structured data
// (entry-server.tsx). Keep the answers in step with how the app actually
// works. Section ids are linked to from the app: keep them stable.
import { EMAIL, mailto } from "@/components/home/site";

export type Faq = { q: string; a: React.ReactNode; keywords?: string };

const link = "font-semibold text-[#4C6395] underline underline-offset-4 hover:text-[#2E3D5C]";

export const FAQ_SECTIONS: { id: string; title: string; faqs: Faq[] }[] = [
  {
    id: "signing-in",
    title: "Signing in",
    faqs: [
      {
        q: "I didn't get the code (OTP)",
        keywords: "sms otp code resend",
        a: (
          <>
            Check the mobile number you entered, then wait a minute: codes can take a little while to arrive. Make sure the
            phone has signal and SMS isn't blocked. Then tap resend on the code screen. Still nothing? Message us on WhatsApp
            with your number and we'll check.
          </>
        ),
      },
      {
        q: "My number can't sign in",
        keywords: "early access blocked",
        a: (
          <>
            iCOPEDIA is in early access, so sign-in works for numbers that have been given access. Message us on WhatsApp or
            email {EMAIL} with your name, company and mobile number, and we'll set you up.
          </>
        ),
      },
      {
        q: "I was signed out on my other phone",
        keywords: "device logout",
        a: (
          <>
            An account can be signed in on one phone at a time. Signing in on a new phone signs the old one out, which keeps
            your account safe.
          </>
        ),
      },
      {
        q: "Why do I have to tick the Terms box?",
        keywords: "terms privacy agree",
        a: (
          <>
            By signing in you agree to our <a className={link} href="/terms">Terms of Use</a> and{" "}
            <a className={link} href="/privacy-policy">Privacy Policy</a>. Tap either link on the sign-in screen to read
            them first.
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
        keywords: "bill of quantities limit",
        a: (
          <>
            Free accounts can create a set number of new BOQs per day or per week. The BOQ screen shows how many you have
            left and when the count resets. You can always open, view and share the BOQs you've already made.
          </>
        ),
      },
      {
        q: "Ustad says I've reached my limit",
        keywords: "ai assistant tokens allowance",
        a: <>Ustad, the AI assistant, has a daily allowance. It resets automatically; the app shows when.</>,
      },
      {
        q: "How do I start a thread in the Community?",
        keywords: "verified verification post discussion",
        a: (
          <>
            Anyone can join discussions. To start a new thread, get verified: complete your profile (company, role and
            contact details) and send a verification request from the Community. Our team will verify you shortly.
          </>
        ),
      },
      {
        q: "Why do I see ads?",
        keywords: "advertising sponsored",
        a: (
          <>
            Free accounts see a few ads at the bottom of the Home screen. Ads are marked “Ad” or “Sponsored”, and we don't
            share your personal data with sponsors.
          </>
        ),
      },
    ],
  },
  {
    id: "company",
    title: "Company accounts",
    faqs: [
      {
        q: "Why can't I see Product details, Project report or Instruments?",
        keywords: "missing tiles hidden free",
        a: (
          <>
            These are part of company accounts, so a free account may not show them. Free accounts include the calculators,
            bills of quantities, Ustad, the Community, tutorials, news and notes. If your company would like the full app,{" "}
            <a className={link} href={mailto("Company account")}>get in touch</a>.
          </>
        ),
      },
      {
        q: "How do I get my team onto a company account?",
        keywords: "members users invite add team",
        a: (
          <>
            Contact us. We set up your company, approve your company email domain and make your company admins. Your team
            then signs up under your company.
          </>
        ),
      },
      {
        q: "How do I add or update my company's products?",
        keywords: "manufacturer listing product data admin panel",
        a: (
          <>
            Company admins open Settings, then Company Admin Panel, and add or edit products there. Changes show in Product
            details for everyone.
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
        keywords: "profile edit",
        a: <>Open your Profile in the app and edit the details there.</>,
      },
      {
        q: "How do I delete my account?",
        keywords: "remove close erase",
        a: (
          <>
            Use Delete account in your Profile, or email us. See{" "}
            <a className={link} href="/privacy-policy#delete-account">how deletion works</a> and what is removed. We complete
            deletion within 30 days.
          </>
        ),
      },
      {
        q: "I want to report a problem, a post or a person",
        keywords: "complaint abuse bug grievance",
        a: (
          <>
            Email <a className={link} href={mailto("Report")}>{EMAIL}</a> or message us on WhatsApp with a screenshot if you
            can. For privacy complaints, see the <a className={link} href="/privacy-policy#contact">grievance contact</a>.
          </>
        ),
      },
    ],
  },
];
