"use client";
import React, { useState } from "react";
import { CreditCard, Tag, X } from "lucide-react";
import { generateQuote } from "@/app/actions/generateQuote";
import { calculateTotalWithVAT, formatVATBreakdown } from "@/lib/vat-calculations";

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
    <div className="space-y-6">
      <div className="flex gap-2 items-center text-lg font-medium text-gray-700">
        <CreditCard className="w-5 h-5" />
        <h2 className="text-gray-700">Betaling</h2>
      </div>

      {/* Coupon Code */}
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex gap-2 items-center mb-3">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Kortingscode</span>
        </div>

        {appliedCoupon ? (
          <div className="flex justify-between items-center px-3 py-2 bg-green-50 rounded-md border border-green-200">
            <div>
              <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
              <span className="ml-2 text-sm text-green-600">
                {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discountValue}% korting`
                  : `€${appliedCoupon.discountValue.toFixed(2)} korting`}
              </span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Verwijder kortingscode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              placeholder="Voer kortingscode in"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {couponLoading ? "..." : "Toepassen"}
            </button>
          </div>
        )}

        {couponError && (
          <p className="mt-2 text-sm text-red-600">{couponError}</p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="p-6 rounded-lg border border-gray-200 bg-custom-gray/10">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotaal:</span>
            <span className="font-medium">€{totalAmount.toFixed(2)}</span>
          </div>

          {appliedCoupon && discountAmount > 0 && (
            <div className="flex justify-between items-center text-green-700">
              <span>
                Korting ({appliedCoupon.code}
                {appliedCoupon.discountType === "percentage"
                  ? ` −${appliedCoupon.discountValue}%`
                  : ""}
                ):
              </span>
              <span className="font-medium">−€{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {deliveryCost !== null ? (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bezorging:</span>
              <span className="font-medium">
                {deliveryCost === 0 ? "Gratis" : `€${deliveryCost.toFixed(2)}`}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bezorging:</span>
              <span className="font-medium text-green-600">Gratis</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600">BTW Eten (6%):</span>
            <span className="font-medium">{vatBreakdown.foodVAT}</span>
          </div>

          {deliveryCost > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BTW Bezorging (21%):</span>
              <span className="font-medium">{vatBreakdown.deliveryVAT}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-gray-600">Totaal BTW:</span>
            <span className="font-medium">{vatBreakdown.totalVAT}</span>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Totaal:</span>
              <span className="text-lg font-bold">{vatBreakdown.total}</span>
            </div>
          </div>
        </div>

        {deliveryError && (
          <div className="p-3 mt-4 rounded-md border bg-accent border-accent">
            <p className="text-sm text-accent-foreground">{deliveryError}</p>
          </div>
        )}
      </div>

      {/* Payment Method Selection - Only show for non-company orders */}
      {!formData.isCompany && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Kies je betaalmethode:</p>

          <div className="space-y-3">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === "online"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
              onClick={() => setPaymentMethod("online")}
            >
              <div className="flex gap-3 items-center">
                <input
                  type="radio"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="font-medium">Betaal direct online</p>
                  <p className="text-sm text-gray-500">
                    Bancontact, creditcard, etc.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === "invoice"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
              onClick={() => setPaymentMethod("invoice")}
            >
              <div className="flex gap-3 items-center">
                <input
                  type="radio"
                  checked={paymentMethod === "invoice"}
                  onChange={() => setPaymentMethod("invoice")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium">Betaal via factuur (Peppol e-factuur)</p>
                  <p className="text-sm text-gray-500">
                    Binnen 14 dagen na factuurdatum
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium
          hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
          focus:ring-offset-2 transition-colors
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex gap-2 justify-center items-center">
          {isProcessing ? (
            <>
              <div className="w-5 h-5 rounded-full border-t-2 border-white animate-spin" />
              <span>Verwerken...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>
                {formData.isCompany || paymentMethod === "online"
                  ? "Ga naar betaling"
                  : "Plaats bestelling"}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default PaymentStep;
