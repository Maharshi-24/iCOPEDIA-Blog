import { Fragment, useEffect } from "react";
import { LegalLayout } from "@/components/home/LegalLayout";
import { seoFor } from "@/seo";

// Terms of Use, word for word from store_assets/TOU/iCOPEDIA_Terms_of_Use_and_Privacy_Policy_Final_Draft.docx
// (part A). Do not edit the wording here; change the Word file and copy it across.
const EFFECTIVE = "20 November 2026";
const VERSION = "1.0";
const CONTACT_EMAIL = "hello@icopedia.co";

type Terms = { intro: string[]; sections: { n: number; title: string; clauses: string[] }[] };

const TERMS: Terms = {
  "intro": [
    "These General Terms and Conditions of Use (“Terms”) govern access to and use of the iCOPEDIA™ digital platform, including its mobile application, website, associated services, features and content.",
    "The platform is operated by iCOPEDIA GLOBAL, a partnership firm registered under the Indian Partnership Act, 1932, having its address at 505, Neptune Prime, OP Road, Vadodara – 390020, Gujarat, India (“iCOPEDIA™”, “Firm”, “we”, “us” or “our”). The User should refer to the firm’s exact registered firm name and address as displayed in the final published version."
  ],
  "sections": [
    {
      "n": 1,
      "title": "PURPOSE AND NATURE OF THE PLATFORM",
      "clauses": [
        "1.1 iCOPEDIA™ is a digital knowledge, information, learning and productivity platform intended to support professionals and stakeholders associated with protective coatings, industrial paints, corrosion protection and allied industries.",
        "1.2 The platform is intended to facilitate access to technical knowledge, digital tools, educational resources, professional interactions and industry-related information through a common digital ecosystem.",
        "1.3 Depending on availability, access category and applicable conditions, the platform may provide calculators and digital tools; digital notes; Ustad, an AI-enabled technical assistance facility; verified community participation; tutorials and educational material; product or manufacturer information; and other features introduced from time to time.",
        "1.4 Availability of a feature may depend on registration, verification, access category, usage limits, device compatibility or additional conditions notified by iCOPEDIA™.",
        "1.5 iCOPEDIA™ facilitates information access and professional collaboration. It does not replace independent professional judgement, engineering assessment, manufacturer recommendations, statutory duties or project-specific technical review."
      ]
    },
    {
      "n": 2,
      "title": "ACCEPTANCE AND ELECTRONIC AGREEMENT",
      "clauses": [
        "2.1 These Terms form an agreement between iCOPEDIA™ and the individual accepting them (“User”, “you” or “your”).",
        "2.2 The User must be given access to these Terms and the Privacy Policy before completing registration or accessing features that require acceptance.",
        "2.3 The User must actively select an unticked acceptance control to confirm agreement to these Terms. Downloading or installing the application alone shall not be treated as acceptance.",
        "2.4 By selecting the acceptance control and proceeding, the User agrees to these Terms through electronic means, subject to applicable Indian law.",
        "2.5 If the User does not agree, the User must not complete registration or use the relevant services.",
        "2.6 iCOPEDIA™ may retain evidence of acceptance, including the account identifier, document version, date and time, and relevant technical audit information, in accordance with the Privacy Policy and applicable law.",
        "2.7 Privacy notices and consent requests shall be presented separately where required. Optional marketing consent shall not be a condition of using the core platform."
      ]
    },
    {
      "n": 3,
      "title": "ACCESS, AVAILABILITY AND CHANGES TO SERVICES",
      "clauses": [
        "3.1 iCOPEDIA™ shall make reasonable efforts to maintain the availability and proper functioning of the platform, but does not guarantee uninterrupted, continuous, secure or error-free access.",
        "3.2 Access may be interrupted, restricted or suspended for maintenance, updates, security measures, technical issues, network or hosting failures, third-party service disruptions, legal requirements or circumstances beyond the reasonable control of iCOPEDIA™.",
        "3.3 iCOPEDIA™ may modify, upgrade, introduce, restrict or discontinue features, subject to applicable law and any notice or consent requirements.",
        "3.4 The User is responsible for maintaining a compatible device, operating system, internet connection and other technical requirements.",
        "3.5 Certain features may require registration, identity or professional verification, additional permissions or separate terms."
      ]
    },
    {
      "n": 4,
      "title": "REGISTRATION AND USER ACCOUNT",
      "clauses": [
        "4.1 Registration may be required to access some or all platform features. The User shall provide complete, accurate and current information requested during registration.",
        "4.2 The User shall update information when it changes and shall not impersonate another person or misrepresent identity, profession, employer or organisational affiliation.",
        "4.3 iCOPEDIA™ may use email, mobile number, identity, professional or organisational verification procedures, particularly for community participation.",
        "4.4 Verification establishes only that the information or evidence submitted has met the applicable verification process. It is not professional certification, endorsement, accreditation or a guarantee of competence, experience or conduct.",
        "4.5 Accounts are personal and non-transferable. Users must not sell, rent, assign, share or otherwise transfer accounts or credentials.",
        "4.6 Users must take reasonable steps to protect their credentials and promptly notify iCOPEDIA™ at hello@icopedia.co if they suspect unauthorised access or account compromise.",
        "4.7 The platform is intended for individuals aged 18 years or older. Individuals below 18 must not independently register or use the platform unless iCOPEDIA™ introduces an expressly compliant access arrangement.",
        "4.8 Users may request account closure or deletion through any in-app facility made available or by contacting hello@icopedia.co. Requests will be handled under the Privacy Policy and applicable law.",
        "4.9 The User remains responsible for material submitted through the account, subject to applicable law and the responsibilities of iCOPEDIA™."
      ]
    },
    {
      "n": 5,
      "title": "SUPPORT AND COMMUNICATION",
      "clauses": [
        "5.1 Users may contact iCOPEDIA™ for support, suggestions, complaints or platform-related queries at hello@icopedia.co.",
        "5.2 iCOPEDIA™ will endeavour to acknowledge and address support requests within a reasonable period, taking account of their nature and urgency. Statutory grievance timelines, where applicable, will be followed.",
        "5.3 Service announcements, security notices, account communications, policy updates and other essential operational messages may be sent through the contact details or communication channels associated with the User’s account.",
        "5.4 Promotional or marketing communications will be handled separately from essential service communications and will be sent where the required permission or other lawful basis exists. Users may opt out of marketing communications."
      ]
    },
    {
      "n": 6,
      "title": "USER RESPONSIBILITIES AND PROHIBITED CONDUCT",
      "clauses": [
        "6.1 The User shall use the platform lawfully and in accordance with these Terms, applicable policies and applicable law.",
        "6.2 The User shall not: (a) provide materially false or misleading information; (b) impersonate any person or organisation; (c) harass, threaten, defame, discriminate against or abuse another person; (d) upload unlawful, harmful, misleading, obscene, infringing or otherwise prohibited material; (e) publish another person’s personal information without authority; (f) disclose confidential, proprietary or commercially sensitive information without the necessary permission; (g) introduce malware, malicious links or harmful code; (h) attempt unauthorised access, interfere with platform security or disrupt services; (i) scrape, harvest or extract platform data through unauthorised automated means; (j) reverse engineer or copy platform software except to the extent such restriction is prohibited by law; (k) use the platform for fraud, spam, unlawful solicitation or unauthorised commercial exploitation; or (l) circumvent usage limits, verification controls or security mechanisms.",
        "6.3 Users shall respect the intellectual property, privacy, confidentiality and other legal rights of iCOPEDIA™ and third parties.",
        "6.4 Users must ensure they have the necessary rights and permissions before uploading or sharing documents, photographs, product information, technical material or other content.",
        "6.5 Users must independently verify information and outputs before relying on them for technical, commercial, operational, safety-critical or regulatory decisions."
      ]
    },
    {
      "n": 7,
      "title": "INTELLECTUAL PROPERTY RIGHTS",
      "clauses": [
        "7.1 All rights in the iCOPEDIA™ platform, including its software, source code, architecture, database structure, trademarks, logos, trade names, graphics, layouts, designs, original calculators, original content, videos, educational materials and other proprietary assets, belong to iCOPEDIA™ or the relevant lawful rights holder.",
        "7.2 Subject to these Terms, iCOPEDIA™ grants the User a limited, non-exclusive, non-transferable, revocable and non-sublicensable permission to access and use the platform for personal, professional and lawful purposes.",
        "7.3 Registration, download or use does not transfer ownership or intellectual property rights in the platform to the User.",
        "7.4 Users shall not copy, reproduce, modify, distribute, commercially exploit, publish, create derivative works from or otherwise use proprietary platform materials except as permitted by these Terms, the relevant rights holder or applicable law.",
        "7.5 Third-party trademarks, product names, manufacturer content and other third-party materials remain the property of their respective owners. Their appearance on the platform does not imply endorsement or transfer of ownership."
      ]
    },
    {
      "n": 8,
      "title": "USER CONTENT, NOTES AND OPTIONAL SHARING",
      "clauses": [
        "8.1 “User Content” means material submitted, created, uploaded, stored or shared by a User through the platform, including notes, comments, discussions, documents, images and other contributions.",
        "8.2 Subject to third-party rights, the User retains ownership of original content created by the User and submitted through the platform. The User is responsible for ensuring that they have the rights and permissions necessary to submit it.",
        "8.3 Notes are private to the relevant User by default. iCOPEDIA™ shall not treat private notes as publicly available community content merely because they are stored through the platform.",
        "8.4 Where the User voluntarily chooses to share a note or other content using a sharing feature, the User authorises iCOPEDIA™ to host, store, reproduce, display and transmit that content to the extent reasonably necessary to provide the selected sharing feature and operate the platform.",
        "8.5 The User should review the intended recipients, visibility and sharing settings before sharing content. Once shared, content may be copied, retained or further disclosed by recipients, subject to the platform’s available controls and applicable law.",
        "8.6 The User must not store or share passwords, financial credentials, trade secrets, confidential employer or client information, personal data of third parties or other sensitive material unless authorised and the relevant feature is appropriate for that purpose.",
        "8.7 iCOPEDIA™ may remove, restrict or disable access to User Content where reasonably necessary to enforce these Terms, respond to a complaint or lawful direction, protect users or comply with applicable law.",
        "8.8 When a User deletes content or closes an account, iCOPEDIA™ will handle the content in accordance with the Privacy Policy, technical feasibility, lawful retention requirements and the rights of recipients where content has been shared."
      ]
    },
    {
      "n": 9,
      "title": "COMMUNITY PARTICIPATION AND VERIFICATION",
      "clauses": [
        "9.1 Participation in the iCOPEDIA™ Community is restricted to Users who have completed the verification process prescribed by iCOPEDIA™.",
        "9.2 Verification may involve confirmation of identity, profession, employment, organisational association or other relevant information. The information required will be described during the verification process or in the Privacy Policy.",
        "9.3 Verification is an eligibility and authenticity measure only. It does not amount to professional certification, qualification recognition, endorsement or guarantee of expertise, conduct or services.",
        "9.4 Users shall not publish false, misleading, defamatory, abusive, threatening, unlawful or infringing material; harass or impersonate others; disclose confidential or personal information without authority; spam or mislead participants; or misrepresent personal views as official statements of iCOPEDIA™ or a manufacturer.",
        "9.5 Community discussions and opinions are those of their respective contributors and do not necessarily represent the views, recommendations or technical position of iCOPEDIA™.",
        "9.6 iCOPEDIA™ may review reports, moderate content and restrict, suspend or remove participation in accordance with these Terms, Community Guidelines and applicable law.",
        "9.7 Users may report content or conduct through the reporting or grievance mechanism displayed in the application or by contacting hello@icopedia.co.",
        "9.8 iCOPEDIA™ does not guarantee that community content is accurate, complete, current or professionally validated."
      ]
    },
    {
      "n": 10,
      "title": "USTAD – AI-ENABLED SERVICES",
      "clauses": [
        "10.1 Ustad is an AI-enabled assistance feature made available through iCOPEDIA™ using Google Gemini technology or associated Google AI services, as configured by iCOPEDIA™ from time to time.",
        "10.2 To generate responses, prompts, questions, text, attachments and other inputs submitted by Users may be transmitted to and processed by Google or relevant third-party technology providers. The exact provider entity, service, processing locations, retention settings and applicable contractual terms depend on the service and configuration used by iCOPEDIA™.",
        "10.3 Ustad outputs may be inaccurate, incomplete, outdated, misleading or unsuitable for a particular project, product, environment or application. Outputs may not reflect manufacturer-approved recommendations, current standards or project-specific conditions.",
        "10.4 Ustad is an informational and productivity support facility. It does not provide certified technical advice, engineering approval, legal advice, safety approval, manufacturer authorisation or a guarantee of project performance.",
        "10.5 Users must independently verify AI-generated information with relevant manufacturers, qualified technical professionals, applicable standards, project specifications and other authoritative sources before acting on it.",
        "10.6 Users should not submit confidential business information, trade secrets, proprietary manufacturer information, personal information of third parties or other sensitive material unless they are authorised to do so and have reviewed the relevant service disclosures.",
        "10.7 Ustad may be subject to daily token allowances, usage restrictions, fair-use controls and reset intervals displayed in the application. The daily allowance will reset according to the mechanism and time interval specified in the application. The precise allowance may be changed with appropriate notice where practicable.",
        "10.8 iCOPEDIA™ may change the AI provider, model, configuration or availability of Ustad, subject to applicable law and relevant notice requirements."
      ]
    },
    {
      "n": 11,
      "title": "CALCULATORS AND TECHNICAL INFORMATION DISCLAIMER",
      "clauses": [
        "11.1 Calculators and other computational tools are intended to provide indicative results based on inputs, assumptions, formulas and parameters used by the tool.",
        "11.2 Results depend on the accuracy and completeness of User inputs and the suitability of the assumptions and parameters for the User’s circumstances.",
        "11.3 Users are responsible for independently checking calculations, quantities, coverage, consumption estimates, coating specifications and other outputs before procurement, tendering, execution or commercial reliance.",
        "11.4 Product information, technical data, safety data, specifications, certificates and other material may originate from manufacturers, Users or other third parties. iCOPEDIA™ does not automatically certify or independently verify all such information.",
        "11.5 No information or output from the platform guarantees product compatibility, coating performance, corrosion protection, service life, regulatory compliance or project success.",
        "11.6 Final decisions concerning coating selection, surface preparation, application, inspection, health and safety, environmental compliance and project execution remain with the relevant qualified professionals and responsible parties."
      ]
    },
    {
      "n": 12,
      "title": "FREE ACCESS, USAGE LIMITS AND FUTURE PAID SERVICES",
      "clauses": [
        "12.1 From the launch date, iCOPEDIA™ intends to make selected features available without an initial subscription charge. The initial free offering is expected to include calculators, digital notes, Ustad with a specified daily token allowance and verified community participation.",
        "12.2 The actual features, availability and usage limits applicable to a User will be those displayed in the application.",
        "12.3 Free access does not create a permanent entitlement to any particular feature, functionality, token allowance or service arrangement.",
        "12.4 iCOPEDIA™ may introduce additional features, premium facilities, subscriptions or paid services in the future.",
        "12.5 A feature that becomes chargeable shall be subject to clear disclosure of applicable charges and the User’s affirmative acceptance of the relevant commercial terms before activation or payment.",
        "12.6 iCOPEDIA™ may modify the scope, availability and limits of free features with appropriate notice where reasonably practicable and as required by law."
      ]
    },
    {
      "n": 13,
      "title": "THIRD-PARTY SERVICES AND EXTERNAL LINKS",
      "clauses": [
        "13.1 The platform may rely on third-party services for AI, hosting, analytics, communication, verification, payment, security or other technical functions.",
        "13.2 Third-party services may be governed by their own terms, privacy policies and service arrangements. Where a User accesses a third-party service directly, the third party’s applicable terms may also apply.",
        "13.3 iCOPEDIA™ is not responsible for the independent acts, omissions, content, availability or privacy practices of third parties beyond its reasonable control, without limiting any responsibility imposed on iCOPEDIA™ by applicable law.",
        "13.4 External links are provided for convenience or information and do not necessarily imply endorsement."
      ]
    },
    {
      "n": 14,
      "title": "SUSPENSION, RESTRICTION AND TERMINATION",
      "clauses": [
        "14.1 iCOPEDIA™ may warn a User, restrict a feature, remove content, suspend an account or terminate access where the User materially breaches these Terms, violates applicable law, provides materially false information, engages in fraud or abuse, infringes third-party rights, compromises platform security or misuses community facilities.",
        "14.2 The nature and duration of action may depend on the seriousness, frequency and urgency of the conduct and any legal or security requirements.",
        "14.3 Where reasonably practicable and legally permissible, iCOPEDIA™ will notify the User of the reason for action and provide an appropriate channel to seek review or respond.",
        "14.4 Immediate action may be taken where reasonably necessary to prevent harm, protect security, preserve evidence, comply with a lawful direction or address serious or urgent violations.",
        "14.5 Users may stop using the platform and request account closure. Closure and deletion of personal information will be handled under the Privacy Policy and applicable law.",
        "14.6 Termination does not affect accrued rights or obligations or provisions which by their nature are intended to survive termination."
      ]
    },
    {
      "n": 15,
      "title": "LIMITATION OF LIABILITY",
      "clauses": [
        "15.1 The platform is provided to facilitate access to digital tools, information, educational resources, AI assistance and professional interaction.",
        "15.2 To the extent permitted by applicable law, iCOPEDIA™ is not responsible for decisions, actions or omissions taken by Users or third parties solely on the basis of AI-generated responses, calculator outputs, community discussions or third-party material, where the User has failed to undertake appropriate independent verification.",
        "15.3 To the extent permitted by law, iCOPEDIA™ shall not be liable for indirect, incidental, special, exemplary or consequential loss, including loss of profits, business opportunity, anticipated savings or data, arising from use of the platform.",
        "15.4 Nothing in these Terms excludes or limits liability for fraud, wilful misconduct or any liability that cannot lawfully be excluded or limited under Indian law. Nothing in these Terms restricts statutory consumer rights or other mandatory legal protections.",
        "15.5 The platform’s disclaimers do not relieve iCOPEDIA™ of duties that applicable law imposes on it."
      ]
    },
    {
      "n": 16,
      "title": "USER INDEMNITY",
      "clauses": [
        "16.1 To the extent permitted by applicable law, the User shall be responsible for third-party claims and reasonable losses or expenses directly arising from the User’s unlawful conduct, infringement of third-party rights or material breach of these Terms.",
        "16.2 This clause does not apply to the extent a claim or loss is caused by iCOPEDIA™’s own breach, negligence, wilful misconduct or other liability that cannot lawfully be shifted to the User."
      ]
    },
    {
      "n": 17,
      "title": "CHANGES TO THESE TERMS",
      "clauses": [
        "17.1 iCOPEDIA™ may amend these Terms to reflect changes in features, services, operational requirements, business arrangements or applicable law.",
        "17.2 The revised Terms will be made available through the application or official website with an updated effective date.",
        "17.3 Where a change materially affects User rights, obligations or consent, iCOPEDIA™ will provide appropriate notice and obtain renewed acceptance where required by applicable law.",
        "17.4 If a User does not agree to a material change, the User may discontinue use and request account closure, subject to applicable law."
      ]
    },
    {
      "n": 18,
      "title": "GOVERNING LAW, JURISDICTION AND GENERAL",
      "clauses": [
        "18.1 These Terms are governed by the laws of India.",
        "18.2 Subject to mandatory statutory rights and the jurisdiction of competent forums, courts having competent jurisdiction at Vadodara, Gujarat, India shall have jurisdiction over disputes arising from these Terms.",
        "18.3 If any provision is held invalid or unenforceable, the remaining provisions shall continue to the extent legally permissible.",
        "18.4 A failure or delay in enforcing a provision does not waive the right to enforce it later.",
        "18.5 These Terms, together with the Privacy Policy and any feature-specific terms expressly incorporated, form the agreement between the User and iCOPEDIA™ concerning use of the platform.",
        "18.6 For notices and general queries, contact hello@icopedia.co. The authorised signatory identified for the firm is Gaurav Desai, Founder & Managing Partner."
      ]
    }
  ]
};

const slug = (n: number) => `section-${n}`;

/** Clause text with its number in a hanging margin and the contact email as a link. */
function Clause({ text }: { text: string }) {
  const m = text.match(/^(\d+\.\d+)\s+(.*)$/);
  const [num, rest] = m ? [m[1], m[2]] : [null, text];
  const parts = rest.split(CONTACT_EMAIL);
  const body = parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 && <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
    </Fragment>
  ));
  if (!num) return <p>{body}</p>;
  return (
    <p className="clause">
      <span className="clause-no">{num}</span>
      <span>{body}</span>
    </p>
  );
}

const TermsOfUse = () => {
  useEffect(() => {
    document.title = seoFor("/terms").title;
  }, []);

  return (
    <LegalLayout
      title="Terms of Use"
      meta={<>Effective {EFFECTIVE}. Version {VERSION}.</>}
      intro={
        <>
          {TERMS.intro.map((p) => <p key={p} className="mb-4">{p}</p>)}
          <p>
            Read these Terms together with our{" "}
            <a href="/privacy-policy" className="font-semibold text-[#4C6395] underline underline-offset-4">Privacy Policy</a>.
          </p>
        </>
      }
      toc={TERMS.sections.map((s) => ({ id: slug(s.n), label: s.title }))}
    >
      {TERMS.sections.map((s) => (
        <section key={s.n} id={slug(s.n)} data-reveal>
          <h2>
            <span className="sec-no">Section {s.n}</span>
            {s.title}
          </h2>
          {s.clauses.map((c) => <Clause key={c} text={c} />)}
        </section>
      ))}
    </LegalLayout>
  );
};

export default TermsOfUse;
