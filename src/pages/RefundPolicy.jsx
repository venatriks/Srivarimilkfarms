import React from 'react';

const sections = [
  {
    title: 'Refund Eligibility',
    body: 'Refunds may be considered only when products are spoiled, damaged during delivery, incorrect, or have quality-related issues at the time of delivery. Due to the perishable nature of dairy products, delivered products are generally non-returnable except in these circumstances.'
  },
  {
    title: 'Reporting Product Issues',
    body: 'Customers must report eligible product issues within 24 hours of delivery. Please provide your order number, a description of the issue and supporting photographs wherever possible.'
  },
  {
    title: 'Refund Verification',
    body: 'All refund requests are subject to verification and approval by Srivari Milk Farms. Additional information may be requested to assess the complaint.'
  },
  {
    title: 'Refund Processing',
    body: 'Approved refunds will be processed within 5–7 business days. For online payments, refunds will be initiated to the original payment method, subject to payment provider and banking processing times. For Cash on Delivery (COD), approved refunds will be transferred through UPI, and the refund process and relevant details will be communicated directly to the customer.'
  },
  {
    title: 'Order Cancellation Policy',
    body: 'Once an order is confirmed, cancellation is not permitted. Customers are requested to verify their products, quantities, delivery details and payment information before confirming an order.'
  },
  {
    title: 'Subscription Deliveries',
    body: 'Customers may manage their subscriptions using the available options in their customer dashboard. Pausing or cancelling future subscription deliveries does not automatically qualify previously delivered products for refunds. Refund requests relating to subscription deliveries are subject to the same eligibility conditions described in this policy.'
  },
  {
    title: 'Non-Refundable Circumstances',
    body: 'Refunds will not ordinarily be provided for a change of mind after order confirmation, customer-requested cancellation of a confirmed order, improper storage of dairy products after delivery, complaints submitted after the 24-hour reporting period, or products without an eligible quality, spoilage, damage or incorrect-delivery issue.'
  },
  {
    title: 'Contact Us',
    body: 'To request a refund or report a product issue, contact Srivari Milk Farms through the contact information available on our website. Please provide your order number and relevant details. Website: https://srivarimilkfarms.com'
  }
];

export const RefundPolicy = () => (
  <section className="min-h-[65vh] bg-[#FDFBF7] px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#997A24]">
          Srivari Milk Farms
        </p>
        <h1 className="text-3xl font-bold text-[#0F3E2E] sm:text-4xl">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          We are committed to delivering fresh, high-quality milk and dairy products.
        </p>
      </div>
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-white p-5 shadow-sm sm:p-9">
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
