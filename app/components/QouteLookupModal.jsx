"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PrimaryButton, SecondaryButton } from "@/app/components/order/ui";

export default function QuoteLookupModal({ trigger, onQuoteLoaded }) {
  const [quoteId, setQuoteId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
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

      // Close modal
      setOpen(false);

      // If onQuoteLoaded callback exists, pass the quote data to parent component
      if (typeof onQuoteLoaded === "function") {
        onQuoteLoaded(data.quote);
      } else {
        // If no callback provided, redirect to home page with query param
        router.push("/?restore=true");
      }
    } catch (error) {
      setError("Er ging iets mis bij het ophalen van de offerte");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <SecondaryButton>Bestaande offerte ophalen</SecondaryButton>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offerte ophalen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
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

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <SecondaryButton>Annuleren</SecondaryButton>
            </DialogClose>
            <PrimaryButton type="submit" loading={isLoading}>
              {isLoading ? "Laden..." : "Ophalen"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
