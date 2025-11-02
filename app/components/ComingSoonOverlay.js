"use client";

import { useState, useEffect } from 'react';

export default function ComingSoonOverlay() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (!isOffline || isUnlocked) return null;

  // Show nothing during loading to prevent flash
  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-md w-full">
        {/* Logo or branding */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Noon Sandwicherie & Koffie
        </h1>

        {/* Coming soon message */}
        <p className="text-2xl md:text-3xl text-gray-600 mb-8">
          Binnenkort online
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
              placeholder="Enter password to preview"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Access Site
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
