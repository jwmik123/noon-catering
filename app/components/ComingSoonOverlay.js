"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ComingSoonOverlay() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const CORRECT_PASSWORD = 'Sd12dsx1';
  const STORAGE_KEY = 'site_access_granted';

  // Only show if NEXT_PUBLIC_SITE_OFFLINE is set to 'true'
  const isOffline = process.env.NEXT_PUBLIC_SITE_OFFLINE === 'true';

  useEffect(() => {
    // Check if user has already unlocked in this session
    const hasAccess = sessionStorage.getItem(STORAGE_KEY) === 'true';
    setIsUnlocked(hasAccess);
    setIsLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Onjuist wachtwoord');
      setPassword('');
    }
  };

  // Studio has its own Sanity login, so leave it reachable
  if (pathname?.startsWith('/studio')) return null;

  if (!isOffline || isUnlocked) return null;

  // Show nothing during loading to prevent flash
  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream">
      <div className="text-center px-4 max-w-md w-full">
        {/* Logo or branding */}
        <h1 className="font-display font-normal text-4xl md:text-5xl tracking-[0.02em] text-noon mb-4">
          Noon Sandwicherie & Koffie
        </h1>

        {/* Maintenance message */}
        <p className="font-lead text-xl md:text-2xl text-noon mb-2">
          We zijn even in onderhoud
        </p>
        <p className="text-mist mb-8">
          Binnenkort zijn we weer bereikbaar. Bedankt voor je geduld!
        </p>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Wachtwoord"
              className="w-full px-4 py-3 border border-input bg-paper rounded-[10px] focus:outline-none focus:border-noon focus:ring-1 focus:ring-noon text-center"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-coral text-white px-6 py-3 rounded-[10px] text-[13px] font-bold uppercase tracking-[0.1em] hover:brightness-95 transition-[filter]"
            >
              Naar de site
            </button>
          </div>
        </form>

        {/* Decorative element */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
