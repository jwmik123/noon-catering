import React from "react";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full mb-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
          >
            ← Back to Home
          </a>
        </div>
      </div>
      <h1 className="mb-8 text-3xl font-bold">Terms and Conditions - NOON Sandwicherie & Koffie</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 1 - Definitions</h2>
        <p className="mb-4">
          NOON Sandwicherie: provider of catering services. <br />
          Client: contracting party of NOON Sandwicherie.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 2 - Applicability</h2>
        <p className="mb-4">
          These terms and conditions apply to all offers, quotations, and agreements.
          Deviations are only valid if agreed upon in writing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 3 - Quotations and Orders</h2>
        <p className="mb-4">
          Quotations are non-binding and valid for 14 days unless otherwise stated.
          Acceptance must be confirmed in writing within this period.
          <br />
          Catering orders must be confirmed in writing at least two working days in advance,
          specifying the correct number of participants. Prices are based on this number,
          with additional consumption invoiced afterward.
          <br />
          If no updated number is provided, the most recent known number will be used.
          <br />
          NOON Sandwicherie reserves the right to reject orders that have not been confirmed
          in writing at least two working days prior. Naturally, we are happy to discuss this if needed.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 4 - Delivery & Courier Services</h2>
        <p className="mb-4">
          NOON Sandwicherie is not responsible for delays caused by external delivery services.
          We strive to deliver all orders at the agreed time but cannot guarantee this.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 5 - Timely Presence</h2>
        <p className="mb-4">
          We ask clients to ensure that agreed-upon times are respected to allow smooth execution.
          In case of delay, NOON Sandwicherie may provide adjusted service,
          and any additional costs will be invoiced after consultation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 6 - Payment</h2>
        <p className="mb-4">
          Invoices must be paid within 30 days of the invoice date.
          Late payment incurs an interest rate of 2% per month on the total amount.
          <br />
          For amounts from €500 and above, a 50% deposit is required upon confirmation, payable electronically.
          The remaining balance must be paid after the service, electronically as well.
          <br />
          Failure to meet payment obligations allows NOON Sandwicherie to cancel the agreement
          without compensation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 7 - Cancellation</h2>
        <p className="mb-4">
          In case of cancellation, the client is charged as follows:
        </p>
        <ul className="list-disc list-inside mt-2 mb-4">
          <li>Within 24 hours before delivery: 50% of the total amount + €25 administrative fee</li>
          <li>24 hours to 3 days before delivery: 25% of the total amount + €25 administrative fee</li>
          <li>Up to 3 days before delivery: €25 administrative fee</li>
        </ul>
        <p className="mb-4">
          Cancellations must be made via email, preferably preceded by a phone call.
          The date of the email counts as the official cancellation date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 8 - Change in Number of Participants</h2>
        <p className="mb-4">
          Changes to the number of participants must be communicated in writing at least 24 hours in advance,
          preferably preceded by a phone call. Changes within this period can no longer be processed;
          the full amount remains due.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Article 9 - Complaints</h2>
        <p className="mb-4">
          Complaints must be reported in writing on the day of delivery.
          Liability is limited to the invoice amount.
        </p>
      </section>

    </div>
  );
}


