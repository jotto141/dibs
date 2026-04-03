'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    router.push(`/research?name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-[-200px] h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-xl text-center">
        <h1 className="mb-3 text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05] tracking-tight">
          dibs
        </h1>

        <p className="mx-auto mb-12 max-w-sm text-base leading-relaxed text-[var(--muted)]">
          Enter a name. Our agent checks trademarks, existing
          businesses, and real domain availability.
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

        <p className="mt-6 text-[13px] text-[var(--muted)]/60">
          Free to try. No account needed to start.
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-[13px] text-[var(--muted)]/40">
        Built on{' '}
        <a href="https://recursiv.io" className="transition-colors hover:text-[var(--muted)]">
          Recursiv
        </a>
      </div>
    </div>
  );
}
