import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL } from "../legal-config"
import { LegalHeading, LegalSection } from "../legal-prose"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund and cancellation policy for ${LEGAL.appName}.`,
}

export default function RefundPage() {
  return (
    <article className="legal-doc">
      <LegalHeading title="Refund Policy" />

      <p>
        This Refund Policy explains how refunds and cancellations work for{" "}
        {LEGAL.appName}, operated by {LEGAL.companyName}. Payments are processed
        by Paddle, our Merchant of Record, and approved refunds are issued
        through Paddle to your original payment method.
      </p>

      <LegalSection title="1. Subscriptions">
        <p>
          {LEGAL.appName} is sold as a recurring subscription. Your plan renews
          automatically at the end of each billing period until you cancel. You
          can cancel at any time from your account settings; your subscription
          remains active until the end of the period you have already paid for,
          and you will not be charged again after that.
        </p>
      </LegalSection>

      <LegalSection title="2. 14-day refund window">
        <p>
          If you are not satisfied, you may request a full refund within 14 days
          of your first payment for a new subscription. Renewal payments for
          subsequent periods are generally non-refundable, but we review every
          request in good faith and will consider refunds for billing errors,
          duplicate charges, or technical issues that prevented you from using
          the service.
        </p>
      </LegalSection>

      <LegalSection title="3. How to request a refund">
        <p>
          Email{" "}
          <a
            href={`mailto:${LEGAL.contactEmail}`}
            className="legal-link"
          >
            {LEGAL.contactEmail}
          </a>{" "}
          from the address on your account, including the date of the charge and
          the reason for your request. We aim to respond within 5 business days.
          You may also contact Paddle directly via the receipt email you
          received at purchase.
        </p>
      </LegalSection>

      <LegalSection title="4. Processing time">
        <p>
          Once a refund is approved, Paddle processes it to your original
          payment method. The time for the funds to appear depends on your bank
          or card provider, typically within 5–10 business days.
        </p>
      </LegalSection>

      <LegalSection title="5. Statutory rights">
        <p>
          Nothing in this policy limits any non-waivable rights you may have
          under the consumer-protection laws of your country. This policy should
          be read together with our{" "}
          <Link
            href="/terms"
            className="legal-link"
          >
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </article>
  )
}
