"use client";

export default function ComingSoonOverlay() {
  // Only show if NEXT_PUBLIC_SITE_OFFLINE is set to 'true'
  const isOffline = process.env.NEXT_PUBLIC_SITE_OFFLINE === 'true';

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center px-4">
        {/* Logo or branding - adjust as needed */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Noon Sandwicherie & Koffie
        </h1>

        {/* Coming soon message */}
        <p className="text-2xl md:text-3xl text-gray-600 mb-8">
          Binnenkort online
        </p>

        {/* Optional decorative element */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
