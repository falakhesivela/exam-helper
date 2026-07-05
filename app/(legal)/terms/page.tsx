import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL } from "../legal-config"
import { LegalHeading, LegalSection } from "../legal-prose"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${LEGAL.appName}.`,
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <article className="legal-doc">
      <LegalHeading title="Terms of Service" />

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of {LEGAL.appName}, a study and exam-preparation service operated by{" "}
        {LEGAL.companyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
        &ldquo;our&rdquo;). By creating an account or using {LEGAL.appName}, you
        agree to these Terms. If you do not agree, do not use the service.
      </p>

      <LegalSection title="1. The service">
        <p>
          {LEGAL.appName} generates practice questions, explanations, study
          plans, and progress tracking for certification exams using automated
          and AI-assisted tools. The content is provided for study purposes
          only. We do not guarantee any particular exam result, and {LEGAL.appName}{" "}
          is not affiliated with, endorsed by, or an official provider of any
          certification body.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts">
        <p>
          You must provide accurate information when registering and are
          responsible for keeping your login credentials secure and for all
          activity under your account. You must be old enough to form a binding
          contract in your jurisdiction. Notify us promptly of any unauthorised
          use of your account.
        </p>
      </LegalSection>

      <LegalSection title="3. Subscriptions and billing">
        <p>
          Paid plans are billed on a recurring basis through our payment
          provider, Paddle, who acts as the Merchant of Record for all
          purchases. By subscribing, you authorise recurring charges to your
          payment method until you cancel. Prices, plan features, and billing
          cycles are shown at checkout. You can cancel at any time from your
          account settings; cancellation takes effect at the end of the current
          billing period. Refunds are handled under our{" "}
          <Link
            href="/refund"
            className="legal-link"
          >
            Refund Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          You agree not to misuse the service, including by: reselling or
          redistributing generated content without permission; attempting to
          reverse-engineer, scrape, or overload the service; sharing your
          account with others outside the terms of your plan; or uploading
          unlawful, infringing, or harmful material. We may suspend or terminate
          accounts that violate these Terms.
        </p>
      </LegalSection>

      <LegalSection title="5. Your content">
        <p>
          You retain ownership of files and materials you upload. You grant us a
          limited licence to process that content solely to provide the service
          to you (for example, to generate questions or feedback). You are
          responsible for ensuring you have the right to upload any material you
          submit.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>
          The {LEGAL.appName} platform, including its software, branding, and
          original content, is owned by {LEGAL.companyName} and protected by
          applicable laws. We grant you a personal, non-transferable,
          non-exclusive licence to use the service in accordance with these
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers and liability">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any
          kind. AI-generated content may contain errors and should not be relied
          upon as the sole source of exam preparation. To the maximum extent
          permitted by law, our total liability arising from the service is
          limited to the amount you paid us in the twelve months before the
          claim.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes and termination">
        <p>
          We may update these Terms from time to time. Material changes will be
          notified through the service or by email, and continued use after the
          changes take effect constitutes acceptance. You may stop using the
          service and close your account at any time.
        </p>
      </LegalSection>

      <LegalSection title="9. Governing law">
        <p>
          These Terms are governed by the laws of {LEGAL.governingLaw}, without
          regard to conflict-of-law rules.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these Terms? Email us at{" "}
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
