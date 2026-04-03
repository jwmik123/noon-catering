"use client";

import { useState } from "react";

export default function AdminPage() {
  const [downloading, setDownloading] = useState(false);

  async function handleBulkDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/bulk-download-invoices");
      if (!res.ok) throw new Error("Download mislukt");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `facturen-${date}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Er ging iets mis: " + err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin</h1>
        <p className="text-gray-500 mb-8">Beheer tools voor NOON Sandwicherie</p>

        <div className="border rounded-xl p-6 text-left">
          <h2 className="font-semibold text-gray-700 mb-1">Facturen bulk download</h2>
          <p className="text-sm text-gray-500 mb-4">
            Download alle facturen als één ZIP-bestand. Dit kan even duren.
          </p>
          <button
            onClick={handleBulkDownload}
            disabled={downloading}
            className="w-full bg-[#524a98] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#3f3880] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? "Bezig met genereren…" : "Download alle facturen (.zip)"}
          </button>
        </div>
      </div>
    </div>
  );
}
