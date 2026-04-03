'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AppPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    router.push(`/app/research?name=${encodeURIComponent(name.trim())}`);
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <button
        onClick={handleSignOut}
        className="absolute right-4 top-4 text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
      >
        Sign out
      </button>

      <div className="w-full max-w-xl text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          dibs
        </h1>
        <p className="mx-auto mb-10 max-w-sm text-sm text-[var(--muted)]">
          Enter a name and get a full analysis on trademarks, domains, and existing businesses.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="group relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What do you want to name your business?"
              autoFocus
              spellCheck={false}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-5 pr-28 text-lg outline-none placeholder:text-[var(--muted)]/50 transition-colors focus:border-accent/40"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-0"
            >
              Check it
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
