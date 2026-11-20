import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { EMAIL, ROLES, type Role } from "./site";

/** Posts to /api/contact (Vercel function), which takes only name, email and message. */
export function ContactForm({ defaultRole = "Coating professional" }: { defaultRole?: Role }) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it.
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const lines = [`I am a: ${role}`];
    if (company.trim()) lines.push(`Company: ${company.trim()}`);
    const body = [...lines, "", message.trim()].join("\n");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: body, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
      setName(""); setEmail(""); setCompany(""); setMessage("");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="border-l-4 border-[#23282D] bg-white p-8" role="status">
        <p className="semi-wide text-xl font-bold">Message sent</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#565D63]">We'll reply to the email address you gave.</p>
        <button onClick={() => setState("idle")} className="mt-5 text-[15px] font-semibold text-[#4C6395] underline underline-offset-4">
          Send another message
        </button>
      </div>
    );
  }

  const field =
    "w-full rounded-[3px] border border-[#BFC4BE] bg-white px-3.5 py-2.5 text-[16px] text-[#23282D] placeholder:text-[#8A9095] focus:border-[#4C6395] focus:outline-none focus:ring-2 focus:ring-[#4C6395]/25";
  const label = "mb-1.5 block text-sm font-semibold text-[#23282D]";

  return (
    <form onSubmit={submit} className="relative -mx-4 bg-white px-4 py-6 sm:mx-0 sm:p-8">
      <fieldset>
        <legend className={label}>You are</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-2.5 rounded-[3px] border px-3 py-2.5 text-[15px] ${
                role === r ? "border-[#23282D] bg-[#F3F4F2] font-semibold" : "border-[#D6D9D4] hover:border-[#8A9095]"
              }`}
            >
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-[#23282D]" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={label}>Name</label>
          <input id="c-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-email" className={label}>Email</label>
          <input id="c-email" type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="c-company" className={label}>Company <span className="font-normal text-[#6B7278]">(optional)</span></label>
        <input id="c-company" maxLength={150} value={company} onChange={(e) => setCompany(e.target.value)} className={field} autoComplete="organization" />
      </div>
      <div className="mt-4">
        <label htmlFor="c-message" className={label}>Message</label>
        <textarea
          id="c-message"
          required
          rows={4}
          maxLength={4500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${field} resize-y`}
          placeholder={role === "Manufacturer" ? "Your company, your products and how many people would use the app" : "Your question or feedback"}
        />
      </div>

      {state === "error" && (
        <p className="mt-4 border-l-4 border-[#A4442E] bg-[#F8ECE8] px-4 py-3 text-[15px] text-[#6E2A1B]" role="alert">
          The message didn't send. Check your connection and send it again, or email{" "}
          <a href={`mailto:${EMAIL}`} className="font-semibold underline underline-offset-2">{EMAIL}</a>.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#23282D] px-6 py-3.5 text-[16px] sm:w-auto sm:py-3 sm:text-[15px] font-semibold text-white hover:bg-[#3A4046] disabled:opacity-70"
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
