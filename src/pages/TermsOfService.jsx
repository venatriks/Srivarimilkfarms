import React from 'react';

const terms = [
  {
    title: 'Product Availability',
    description: 'All milk and dairy products are supplied fresh and are subject to availability.'
  },
  {
    title: 'Delivery Verification',
    description: 'Customers are requested to verify the products and quantities at the time of delivery.'
  },
  {
    title: 'Payment Terms',
    description: 'Customers must complete payments within the stipulated time.'
  },
  {
    title: 'Billing Discrepancies',
    description: 'Any billing discrepancies must be reported within 24 hours of receiving the invoice.'
  },
  {
    title: 'Returns',
    description: 'Once delivered, products are non-returnable, except in cases involving product quality issues.'
  },
  {
    title: 'Product Quality and Storage',
    description: 'Product quality and freshness are our priority. Customers are advised to store dairy products under appropriate refrigeration conditions to maintain freshness and quality.'
  },
  {
    title: 'Pricing',
    description: 'All product prices are displayed in Indian Rupees (INR).'
  },
  {
    title: 'Dispute Resolution',
    description: 'Any disputes shall be subject to applicable laws and jurisdiction.'
  }
];

export const TermsOfService = () => (
  <section className="min-h-[65vh] bg-[#FDFBF7] px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#997A24]">
          Srivari Milk Farms
        </p>
        <h1 className="text-3xl font-bold text-[#0F3E2E] sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Welcome to Srivari Milk Farms. By purchasing our products or
          using our services, you agree to the following terms and conditions.
        </p>
      </div>

      <div className="rounded-2xl border border-[#D4AF37]/30 bg-white p-5 shadow-sm sm:p-9">
        <ol className="space-y-6">
          {terms.map((term, index) => (
            <li key={term.title} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F3E2E] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="font-bold text-[#0F3E2E]">{term.title}</h2>
                <p className="mt-1 text-sm leading-7 text-stone-600">
                  {term.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 border-t border-stone-200 pt-6 text-sm leading-7 text-stone-600">
          By placing an order or subscribing to our products, you
          acknowledge these Terms of Service.
        </p>
      </div>
    </div>
  </section>
);
