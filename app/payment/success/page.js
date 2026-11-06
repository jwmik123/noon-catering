"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { Card, Heading } from "@/app/components/order/ui";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const quoteId = searchParams.get("quoteId");
  const formData = searchParams.get("formData");
  useEffect(() => {
    setLoading(false);
  }, [quoteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-noon" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-xl flex-col items-start gap-8">
        <Image
          src="/images/logo-noon-catering.svg"
          alt="NOON Sandwicherie & Koffie"
          width={96}
          height={80}
          className="h-20 w-auto"
        />
        <Heading
          eyebrow="Bevestiging"
          title="Bedankt voor je bestelling!"
          lead="We hebben je bestelling ontvangen en gaan ermee aan de slag. Je ontvangt een bevestiging per e-mail."
        />
        <Card className="flex w-full items-center justify-between gap-4 p-5">
          <span className="text-sm text-mist">Offertenummer</span>
          <span className="font-semibold text-noon">{quoteId}</span>
        </Card>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-[10px] border border-noon/25 px-5 text-sm font-semibold text-noon transition-colors hover:border-noon/60"
        >
          Terug naar de homepage
        </Link>
      </div>
    </div>
  );
}

// Main component that wraps the SuccessContent with Suspense
export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-noon" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
