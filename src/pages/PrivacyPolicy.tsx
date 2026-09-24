import { useEffect } from "react";

const LAST_UPDATED = "24 September 2026";
const CONTACT_EMAIL = "contact@icopedia.co";

type Section = { id: string; title: string; body: React.ReactNode };

const Mail = ({ subject }: { subject?: string }) => (
  <a
    className="text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e3a8a]"
    href={`mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}
  >
    {CONTACT_EMAIL}
  </a>
);

const DataTable = ({ rows, head = ["Data", "What and why"] }: { rows: string[][]; head?: string[] }) => (
  <div className="my-5 overflow-x-auto rounded-xl border border-[#dbe3f3] bg-white">
    <table className="w-full min-w-[480px] border-collapse text-left text-[0.92rem]">
      <thead>
        <tr className="bg-[#f1f5fd] text-[#1e3a8a]">
          {head.map((h) => (
            <th key={h} className="px-4 py-3 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a} className="border-t border-[#e8edf7] align-top">
            <td className="w-[32%] px-4 py-3 font-medium text-[#0f172a]">{a}</td>
            <td className="px-4 py-3 text-[#334155]">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This Privacy Policy explains how <strong>iCOPEDIA</strong> ("iCOPEDIA", "we", "us")
          collects, uses, shares and protects personal data when you use the iCOPEDIA mobile
          app (package <code>com.icopedia.app</code>) and the website at icopedia.co
          (together, the "Services").
        </p>
        <p>
          iCOPEDIA is a toolkit for coating inspectors and protective-coating professionals:
          calculators, daily inspection reports, instrument calibration records, a technical
          glossary, a community and a professional directory. For the purposes of India's
          Digital Personal Data Protection Act, 2023, iCOPEDIA is the Data Fiduciary for the
          personal data described below.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Personal data we collect",
    body: (
      <>
        <p>We only collect the data needed to run the features you use.</p>
        <DataTable
          rows={[
            [
              "Account details",
              "Mobile number and/or email address, name. Used to sign you in with a one-time password (OTP) and identify your account.",
            ],
            [
              "Profile and company details",
              "Company name, role or designation, address, city, state, PIN code, country, area of service and a company description you enter during onboarding or in your profile.",
            ],
            [
              "Work records you create",
              "Projects, daily visit reports, inspection readings, notes, bills of quantities, instrument and calibration records, and certificates, photos, videos and documents you upload.",
            ],
            [
              "Location",
              "Approximate or precise device location, only when you use the weather auto-fill in a daily report, and only after you grant permission. If GPS is unavailable, your IP address is used to estimate your city. Location is not tracked in the background.",
            ],
            [
              "Device information",
              "Device model and name, and an app-generated device identifier. Used to keep your account signed in on one active device at a time and to show you which device is signed in.",
            ],
            [
              "Payments",
              "Subscription plan, order ID, amount, payment status and receipts. Card, UPI and bank details are entered directly with our payment processor, Razorpay; we never see or store them.",
            ],
            [
              "Content you share",
              "Posts and messages in the Community, your Directory listing, questions you ask the AI glossary assistant, referrals, and messages you send through Contact Us.",
            ],
            [
              "App diagnostics",
              "App version, feature usage counts (for plan limits) and error logs needed to keep the Services working.",
            ],
          ]}
        />
        <p>
          We do not collect your contacts, call logs, SMS messages, microphone recordings or
          health data, and we do not use advertising identifiers.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    body: (
      <ul>
        <li>To create and secure your account, and to send sign-in OTPs.</li>
        <li>To provide the app's features: saving and syncing your reports, records and files, and generating PDFs and exports you request.</li>
        <li>To pre-fill weather conditions in daily reports from your location.</li>
        <li>To process subscription payments, issue receipts and apply plan limits.</li>
        <li>To answer glossary questions with our AI assistant.</li>
        <li>To show your Directory listing and Community posts to other users, where you choose to publish them.</li>
        <li>To send service notices, such as calibration due-date reminders and important updates.</li>
        <li>To prevent fraud and misuse, keep the Services secure, and fix problems.</li>
        <li>To comply with legal obligations, such as tax and accounting records for payments.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    body: (
      <>
        <p>
          <strong>We do not sell your personal data</strong> and we do not share it for
          advertising. We share data only with service providers that process it on our behalf
          to run the Services:
        </p>
        <DataTable
          head={["Provider", "Purpose"]}
          rows={[
            ["Supabase", "Database, file storage, authentication and server functions (hosts your account and records)."],
            ["MSG91", "Delivers sign-in OTPs to your mobile number by SMS."],
            ["Razorpay", "Processes subscription payments."],
            ["Google (Gemini API)", "Generates answers to questions you ask the AI glossary assistant. Only the question text is sent."],
            ["Open-Meteo", "Returns weather for the coordinates of your site. Only coordinates are sent."],
            ["ipapi.co", "Estimates your city from your IP address when GPS location is unavailable."],
            ["India Post PIN code API", "Looks up city and state from the PIN code you enter."],
            ["Render and Vercel", "Host our backend services and website."],
          ]}
        />
        <p>
          <strong>Other users.</strong> Your Directory listing and anything you post in the
          Community are visible to other iCOPEDIA users. Reports and records are private to your
          account unless you export or share them yourself.
        </p>
        <p>
          <strong>Legal reasons.</strong> We may disclose data if required by law, court order
          or a government authority, or to protect the rights and safety of our users or of
          iCOPEDIA.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect your data",
    body: (
      <ul>
        <li>All data is sent over encrypted connections (HTTPS/TLS).</li>
        <li>Sign-in uses one-time passwords, so we never store a password for your account.</li>
        <li>Database access rules limit each account to its own records.</li>
        <li>Only one device can be signed in to an account at a time.</li>
        <li>Screens that show sensitive information, such as payment receipts, are protected from screenshots.</li>
        <li>Access to production systems is limited to people who need it to run the Services.</li>
      </ul>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: (
      <>
        <p>
          We keep your data for as long as your account is active. When you delete your
          account, we delete your profile, records and uploaded files within 30 days.
        </p>
        <p>
          We may keep some data for longer only where the law requires it or for a legitimate
          purpose: payment and invoice records are kept for the period required by Indian tax
          law, and limited logs may be kept to prevent fraud or abuse. Backups are overwritten
          on a rolling basis.
        </p>
      </>
    ),
  },
  {
    id: "delete-account",
    title: "Delete your account and data",
    body: (
      <>
        <p>You can ask us to delete your iCOPEDIA account and all associated data at any time. You do not need the app installed to do this.</p>
        <ol>
          <li>
            Email <Mail subject="Delete my iCOPEDIA account" /> with the subject
            "Delete my iCOPEDIA account".
          </li>
          <li>Send it from the email address on your account, or include the mobile number you sign in with.</li>
          <li>We may ask you to confirm the request to make sure it is really you.</li>
        </ol>
        <p>
          <strong>What is deleted:</strong> your account, profile and company details, projects,
          reports, notes, calibration records, uploaded photos, videos and documents, Directory
          listing, Community posts and glossary chat history.
        </p>
        <p>
          <strong>What is kept:</strong> payment and invoice records, for the period required
          by law.
        </p>
        <p>We complete deletion within 30 days and confirm by email.</p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Digital Personal Data Protection Act, 2023 and other applicable laws, you have the right to:</p>
        <ul>
          <li>access a summary of the personal data we hold about you and how it is used;</li>
          <li>correct, complete or update your data (most of it can be edited in the app);</li>
          <li>have your data erased;</li>
          <li>withdraw consent at any time, for example by turning off location permission;</li>
          <li>nominate another person to exercise your rights in case of death or incapacity;</li>
          <li>raise a grievance with us, and escalate it to the Data Protection Board of India.</li>
        </ul>
        <p>
          To use any of these rights, email <Mail subject="Privacy request" />. Withdrawing
          consent may stop some features from working, such as weather auto-fill without
          location.
        </p>
      </>
    ),
  },
  {
    id: "permissions",
    title: "App permissions",
    body: (
      <ul>
        <li><strong>Location</strong>: weather auto-fill in daily reports, only while you use it.</li>
        <li><strong>Camera, photos and files</strong>: attach site photos, certificates and documents you choose.</li>
        <li><strong>Internet and network state</strong>: sync your data and check connectivity.</li>
      </ul>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The Services are meant for professionals and are not directed at anyone under 18. We
        do not knowingly collect personal data from children. If you believe a child has given
        us data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "Where data is processed",
    body: (
      <p>
        Some of our service providers may store or process data outside India. We use
        providers that protect data with safeguards at least as strong as those in this
        policy, and we follow any restrictions on transfers set by the Government of India.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the Services change. We will post the new version here
        with a new "Last updated" date and, for significant changes, notify you in the app.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievance officer",
    body: (
      <>
        <p>
          For privacy questions, requests or complaints, contact our Grievance Officer:
        </p>
        <p className="rounded-xl border border-[#dbe3f3] bg-white px-5 py-4">
          <strong>Grievance Officer, iCOPEDIA</strong>
          <br />
          Email: <Mail subject="Privacy grievance" />
        </p>
        <p>
          We acknowledge complaints within 7 days and respond within 30 days. If you are not
          satisfied with our response, you may complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
];

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | iCOPEDIA";
    // Deep links such as /privacy-policy#delete-account should land on the section.
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fd] font-sans text-[#334155]">
      <header className="border-b border-[#e2e8f5] bg-[#04070f]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="text-lg font-semibold tracking-wide text-white">
            iCOPEDIA<span className="align-super text-[0.6em]">™</span>
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-[#93c5fd] hover:text-white">
            {CONTACT_EMAIL}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#64748b]">Last updated: {LAST_UPDATED}</p>

        <nav aria-label="Contents" className="mt-8 rounded-xl border border-[#dbe3f3] bg-white px-5 py-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1e3a8a]">Contents</p>
          <ol className="grid list-decimal gap-x-6 gap-y-1 pl-5 text-[0.95rem] sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[#1d4ed8] hover:underline">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy mt-10 space-y-10 leading-relaxed">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="mb-3 text-xl font-semibold text-[#0f172a] sm:text-2xl">
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#e2e8f5] py-6 text-center text-sm text-[#64748b]">
        © {new Date().getFullYear()} iCOPEDIA. All rights reserved.
      </footer>

      <style>{`
        .policy p { margin: 0 0 0.9rem; }
        .policy ul, .policy ol { margin: 0 0 0.9rem; padding-left: 1.25rem; }
        .policy ul { list-style: disc; }
        .policy ol { list-style: decimal; }
        .policy li { margin: 0.3rem 0; }
        .policy strong { color: #0f172a; }
        .policy code { font-size: 0.85em; background: #eef2fb; padding: 0.1rem 0.35rem; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;
