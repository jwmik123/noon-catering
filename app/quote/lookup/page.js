"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, Heading, PrimaryButton } from "@/app/components/order/ui";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QuoteLookup() {
  const [quoteId, setQuoteId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/quotes/${quoteId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Quote niet gevonden");
        return;
      }

      // Store quote data in localStorage for form restoration
      localStorage.setItem("restoreQuote", JSON.stringify(data.quote));

      // Redirect to home page with query param
      router.push("/?restore=true");
    } catch (error) {
      setError("Er ging iets mis bij het ophalen van de offerte");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-12">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Heading title="Offerte ophalen" lead="Vul je offertenummer in om verder te gaan met je bestelling." />
        <Card className="p-5 md:p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="quoteId">Offertenummer</Label>
              <Input
                type="text"
                id="quoteId"
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                placeholder="Bijv. Q12345678"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="px-3 py-2 text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <PrimaryButton type="submit" loading={isLoading} className="w-full">
              {isLoading ? "Laden..." : "Offerte ophalen"}
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
