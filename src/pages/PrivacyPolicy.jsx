import React from 'react';

const sections = [
  {
    "title": "Information We Collect",
    "body": "We may collect full names, mobile numbers, email addresses, delivery addresses, delivery instructions, account and authentication information, order history, product preferences, subscription details, payment references and status, WhatsApp preferences and verification details, and technical information necessary for security and website operation. Guest customers may place one-time orders without creating an account."
  },
  {
    "title": "How We Use Customer Information",
    "body": "We use information to process and deliver orders, manage accounts and subscriptions, generate invoices and receipts, verify payments, communicate order and delivery updates, provide customer support, maintain security, prevent fraud and meet applicable legal obligations."
  },
  {
    "title": "Payment Information",
    "body": "Online payments are processed through Razorpay. We use transaction references and payment status information to confirm orders and maintain payment records. Sensitive credentials such as card PINs and UPI PINs should be entered only through the payment provider's authorized secure interface."
  },
  {
    "title": "WhatsApp Communications",
    "body": "Customers may choose to receive eligible order, payment and delivery notifications through WhatsApp. Where applicable, WhatsApp verification and customer consent authorize subscription-related communications. Customers may withdraw optional consent or opt out, including by replying STOP where supported. Withdrawing optional WhatsApp consent does not prevent website orders."
  },
  {
    "title": "Data Storage and Service Providers",
    "body": "We use Supabase for database and applicable authentication services, Amazon Web Services (AWS) for backend processing, Razorpay for online payment processing, Meta/WhatsApp for eligible customer communications and GitHub Pages for website hosting. These providers may process information necessary to deliver our services, subject to applicable agreements and legal requirements."
  },
  {
    "title": "Information Sharing",
    "body": "We may share relevant customer information with authorized service providers for payment processing, fulfillment, delivery, communications, technical operations or legal compliance. We do not authorize unrelated third parties to use customer information for their own purposes merely because a customer places an order."
  },
  {
    "title": "Data Security",
    "body": "We use technical and organizational safeguards intended to protect customer information against unauthorized access, misuse and disclosure. No internet-based service can guarantee absolute security. Customers should protect account credentials and report suspected unauthorized activity."
  },
  {
    "title": "Data Retention",
    "body": "Information is retained as reasonably necessary to provide services, maintain transaction records, resolve disputes and comply with applicable legal obligations. Retention periods may vary by information category and legal requirements."
  },
  {
    "title": "Customer Privacy Requests",
    "body": "Customers may contact Srivari Milk Farms to request access to, correction of or deletion of their personal information, subject to applicable laws and legitimate retention requirements. Identity verification may be required."
  },
  {
    "title": "Cookies and Website Technologies",
    "body": "Our website may use browser storage and other technologies necessary for authentication, checkout continuity, security and functionality. If additional analytics or optional tracking are introduced, this policy may be updated."
  },
  {
    "title": "Children's Privacy",
    "body": "Our services are intended for customers capable of placing lawful orders or acting through a parent or legal guardian. If we learn that personal information has been collected inappropriately from a child, we will review the situation and take appropriate action."
  },
  {
    "title": "Changes to This Privacy Policy",
    "body": "We may update this policy to reflect changes in our services, technology or applicable legal requirements. The latest version will be published on our website."
  },
  {
    "title": "Contact Us",
    "body": "For privacy questions, concerns or requests, contact Srivari Milk Farms using the contact information available on our website. Website: https://srivarimilkfarms.com."
  }
];

export const PrivacyPolicy = () => (
  <section className="min-h-[65vh] bg-[#FDFBF7] px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#997A24]">
          Srivari Milk Farms
        </p>
        <h1 className="text-3xl font-bold text-[#0F3E2E] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          We respect customer privacy and are committed to handling personal information responsibly.
        </p>
      </div>
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-white p-5 shadow-sm sm:p-9">
        <p className="mb-8 text-sm leading-7 text-stone-600">
          This policy explains how information is collected, used, stored and shared
          when customers visit our website, place orders or subscribe to dairy products.
        </p>
        <ol className="space-y-6">
          {sections.map((section, index) => (
            <li key={section.title} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F3E2E] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="font-bold text-[#0F3E2E]">{section.title}</h2>
                <p className="mt-1 text-sm leading-7 text-stone-600">{section.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);
