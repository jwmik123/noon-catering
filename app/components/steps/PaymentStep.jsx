"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { generateQuote } from "@/app/actions/generateQuote";
import { calculateTotalWithVAT, formatVATBreakdown } from "@/lib/vat-calculations";
import { getInvoiceChannel } from "@/lib/invoice-channel";
import { Card, Heading, Notice, OptionCard, PrimaryButton, SecondaryButton, formatEuro } from "@/app/components/order/ui";
import { Input } from "@/components/ui/input";

const PriceLine = ({ label, value, className }) => (
  <div className={`flex items-baseline justify-between gap-4 text-sm ${className || ""}`}>
    <span className="text-mist">{label}</span>
    <span className="font-medium tabular-nums text-noon">{value}</span>
  </div>
);

const PaymentStep = ({
  formData,
  totalAmount,
  deliveryCost,
  deliveryError,
  appliedCoupon,
  setAppliedCoupon,
  discountAmount,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const invoiceChannel = getInvoiceChannel(formData);

  // Paying on invoice is only possible when the invoice can actually be delivered
  useEffect(() => {
    if (!invoiceChannel && paymentMethod === "invoice") {
      setPaymentMethod("online");
    }
  }, [invoiceChannel, paymentMethod]);

  const vatBreakdown = formatVATBreakdown(totalAmount, deliveryCost || 0, discountAmount || 0);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
        });
        setCouponInput("");
      } else {
        setCouponError(data.error || "Ongeldige kortingscode.");
      }
    } catch {
      setCouponError("Kon kortingscode niet valideren. Probeer opnieuw.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      const result = await generateQuote({
        ...formData,
        deliveryCost: deliveryCost || 0,
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountAmount || 0,
      });

      if (result.success) {
        const totalWithVAT = calculateTotalWithVAT(totalAmount, deliveryCost || 0, discountAmount || 0);
        const enrichedOrderDetails = {
          ...formData,
          deliveryCost: deliveryCost || 0,
          couponCode: appliedCoupon?.code || null,
          discountAmount: discountAmount || 0,
        };

        if (paymentMethod === "invoice") {
          const invoiceResponse = await fetch("/api/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteId: result.quoteId,
              amount: totalWithVAT,
              orderDetails: enrichedOrderDetails,
              couponCode: appliedCoupon?.code || null,
              discountAmount: discountAmount || 0,
            }),
          });

          const invoiceData = await invoiceResponse.json();

          if (invoiceData.success) {
            window.location.href = `/payment/success?quoteId=${result.quoteId}&type=invoice`;
          }
        } else {
          const paymentResponse = await fetch("/api/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteId: result.quoteId,
              amount: totalWithVAT,
              orderDetails: enrichedOrderDetails,
            }),
          });

          const paymentData = await paymentResponse.json();

          if (paymentData.success) {
            window.location.href = paymentData.checkoutUrl;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Heading title="Betaling" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {/* Payment Method Selection - Only show for non-company orders */}
          {!formData.isCompany && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[15px] font-semibold text-noon">Kies je betaalmethode</span>
              <div role="radiogroup" aria-label="Betaalmethode" className="flex flex-col gap-2">
                <OptionCard
                  active={paymentMethod === "online"}
                  title="Betaal direct online"
                  subtitle="Bancontact, creditcard, etc."
                  onClick={() => setPaymentMethod("online")}
                />
                {invoiceChannel ? (
                  <OptionCard
                    active={paymentMethod === "invoice"}
                    title={
                      invoiceChannel === "peppol"
                        ? "Betaal via factuur (Peppol e-factuur)"
                        : "Betaal via factuur (per e-mail)"
                    }
                    subtitle="Binnen 14 dagen na factuurdatum"
                    onClick={() => setPaymentMethod("invoice")}
                  />
                ) : (
                  <p className="m-0 px-1 text-sm text-mist">
                    Betalen via factuur is niet mogelijk: jullie organisatie is
                    niet bereikbaar via Peppol.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Coupon Code */}
          <div className="flex flex-col gap-2.5">
            <label htmlFor="couponCode" className="text-[15px] font-semibold text-noon">
              Kortingscode
            </label>

            {appliedCoupon ? (
              <Notice tone="success" className="flex items-center justify-between gap-3">
                <span>
                  <strong className="font-semibold">{appliedCoupon.code}</strong>{" "}
                  {appliedCoupon.discountType === "percentage"
                    ? `${appliedCoupon.discountValue}% korting`
                    : `${formatEuro(appliedCoupon.discountValue)} korting`}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="transition-opacity hover:opacity-70"
                  aria-label="Verwijder kortingscode"
                >
                  <X className="h-4 w-4" />
                </button>
              </Notice>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="couponCode"
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Voer kortingscode in"
                  className="h-12"
                />
                <SecondaryButton
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0"
                >
                  {couponLoading ? "..." : "Toepassen"}
                </SecondaryButton>
              </div>
            )}

            {couponError && <p className="m-0 text-sm text-destructive">{couponError}</p>}
          </div>
        </div>

        {/* Price Breakdown */}
        <Card className="flex flex-col gap-3 self-start p-5 md:p-6">
          <PriceLine label="Subtotaal" value={formatEuro(totalAmount)} />

          {appliedCoupon && discountAmount > 0 && (
            <PriceLine
              label={`Korting (${appliedCoupon.code}${
                appliedCoupon.discountType === "percentage"
                  ? ` −${appliedCoupon.discountValue}%`
                  : ""
              })`}
              value={`−${formatEuro(discountAmount)}`}
            />
          )}

          <PriceLine
            label="Bezorging"
            value={deliveryCost ? formatEuro(deliveryCost) : "Gratis"}
          />
          <PriceLine label="BTW eten (6%)" value={vatBreakdown.foodVAT} />
          {deliveryCost > 0 && (
            <PriceLine label="BTW bezorging (21%)" value={vatBreakdown.deliveryVAT} />
          )}
          <PriceLine
            label="Totaal BTW"
            value={vatBreakdown.totalVAT}
            className="border-t border-noon/10 pt-3"
          />

          <div className="flex items-baseline justify-between border-t border-noon/10 pt-4">
            <span className="text-base font-bold text-noon">Totaal</span>
            <span className="text-2xl font-bold tabular-nums text-noon">{vatBreakdown.total}</span>
          </div>

          {deliveryError && <Notice tone="warning">{deliveryError}</Notice>}

          {/* Payment Button */}
          <PrimaryButton onClick={handlePayment} loading={isProcessing} className="mt-2 w-full">
            {isProcessing
              ? "Verwerken..."
              : formData.isCompany || paymentMethod === "online"
                ? "Ga naar betaling"
                : "Plaats bestelling"}
          </PrimaryButton>
        </Card>
      </div>
    </div>
  );
};

export default PaymentStep;
