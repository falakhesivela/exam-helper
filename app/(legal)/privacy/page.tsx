import type { Metadata } from "next"
import { LEGAL } from "../legal-config"
import { LegalHeading, LegalSection } from "../legal-prose"

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: `How ${LEGAL.appName} collects, uses, and protects your data.`,
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <article className="legal-doc">
      <LegalHeading title="Privacy Notice" />

      <p>
        This Privacy Notice explains how {LEGAL.companyName} (&ldquo;we&rdquo;)
        collects, uses, and protects your personal information when you use{" "}
        {LEGAL.appName}. We are committed to handling your data responsibly and
        in line with applicable data-protection law.
      </p>

      <LegalSection title="1. Information we collect">
        <p>
          We collect: account details you provide (name, email address);
          authentication data managed by our infrastructure provider; study
          content you upload or generate; usage and progress data (sessions,
          scores, streaks); and limited technical data such as device and
          browser information. Payment details are collected and processed by
          Paddle, not stored by us.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use your information">
        <p>
          We use your information to provide and personalise the service,
          generate study content and feedback, track your progress, process
          subscriptions, communicate service-related messages, maintain
          security, and comply with legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="3. AI processing">
        <p>
          To generate questions, explanations, and tutoring, relevant content
          may be sent to third-party AI providers for processing. We share only
          what is needed to produce your results and do not sell your personal
          information.
        </p>
      </LegalSection>

      <LegalSection title="4. Service providers">
        <p>
          We rely on trusted third parties to operate {LEGAL.appName}, including
          Supabase (authentication and database), Paddle (payments and Merchant
          of Record), AI model providers, and analytics and hosting services.
          These providers process data on our behalf under their own safeguards.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          We use essential cookies and similar technologies to keep you signed
          in and to operate core features. Some providers, such as Paddle and
          our analytics tools, may set their own cookies to enable checkout and
          measure usage.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <p>
          We keep your personal information for as long as your account is
          active or as needed to provide the service and meet legal, tax, and
          accounting requirements. You can request deletion of your account and
          associated data at any time.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct,
          export, or delete your personal information, and to object to or
          restrict certain processing. To exercise these rights, contact us
          using the details below.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use reasonable technical and organisational measures to protect
          your data, including encryption in transit and access controls. No
          system is completely secure, but we work to safeguard your information
          and to respond promptly to any incident.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update this Privacy Notice from time to time. Material changes
          will be communicated through the service or by email.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For privacy questions or requests, email{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="legal-link"
          >
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </article>
  )
}
