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
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight">dibs</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          What do you want to name your business?
        </h1>
        <p className="mb-10 text-[var(--muted)]">
          Enter a name and our AI expert will research it for you
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantum, Nomad, Archway..."
              autoFocus
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-lg outline-none placeholder:text-[var(--muted)] focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl bg-accent px-8 py-4 text-lg font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Research
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-[var(--muted)]">
          You'll get a full trademark, domain, and competitive analysis in seconds
        </p>
      </div>
    </div>
  );
}
