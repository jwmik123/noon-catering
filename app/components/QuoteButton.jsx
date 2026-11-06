"use client";

import { useState } from "react";
import { generateQuote } from "@/app/actions/generateQuote";
import { SecondaryButton } from "@/app/components/order/ui";

export default function QuoteButton({
  formData,
  sandwichOptions,
  pricing,
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadQuote = async () => {
    try {
      setIsGenerating(true);

      const result = await generateQuote(formData, sandwichOptions, pricing);

      if (result.success) {
        // Download the PDF
        const pdfResponse = await fetch(result.pdfUrl);
        const pdfBlob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(pdfBlob);

        // Create an invisible iframe for mobile Safari
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        // Write a download link to the iframe and click it
        iframe.contentWindow.document.write(`
          <a id="downloadLink" 
             download="quote-${result.quoteId}.pdf" 
             href="${url}">Download</a>
        `);
        iframe.contentWindow.document.getElementById("downloadLink").click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } else {
        console.error("Failed to generate quote:", result.error);
        // You might want to show an error message to the user
      }
    } catch (error) {
      console.error("Error downloading quote:", error);
      // Handle error (show message to user)
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SecondaryButton onClick={handleDownloadQuote} disabled={isGenerating} className="w-full">
      {isGenerating ? "Bezig met genereren..." : "Offerte downloaden (PDF)"}
    </SecondaryButton>
  );
}
