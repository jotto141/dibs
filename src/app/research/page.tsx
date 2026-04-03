'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Preview {
  verdict: 'GO' | 'CAUTION' | 'STOP';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
}

const UNLOCKABLE_SECTIONS = [
  {
    title: 'Domain Availability',
    desc: '.com, .io, .ai, .dev, .co, .app — which are actually open',
  },
  {
    title: 'Trademark Conflicts',
    desc: 'Detailed risk analysis across relevant trademark classes',
  },
  {
    title: 'Existing Businesses',
    desc: 'Companies with the same or similar names',
  },
  {
    title: 'Alternative Names',
    desc: 'AI-suggested alternatives if your name has issues',
  },
  {
    title: 'Creative Domains',
    desc: 'Available variations like getname.io, namehq.com',
  },
  {
    title: 'Follow-up Chat',
    desc: 'Ask questions and dig deeper with our research agent',
  },
];

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  CAUTION: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  STOP: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const RISK_STYLES: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[var(--muted)]">Loading...</div>}>
      <ResearchContent />
    </Suspense>
  );
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasStarted = useRef(false);

  useEffect(() => {
    if (name && !hasStarted.current) {
      hasStarted.current = true;
      fetchPreview(name);
    }
  }, [name]);

  async function fetchPreview(n: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n }),
      });
      const data = await res.json();
      setPreview(data);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const signUpUrl = `/sign-up${name ? `?name=${encodeURIComponent(name)}` : ''}`;
  const vs = preview ? VERDICT_STYLES[preview.verdict] || VERDICT_STYLES.CAUTION : null;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            dibs
          </Link>
          <Link
            href={signUpUrl}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Sign up to unlock
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-xl px-4 py-12">
        {/* Name being researched */}
        <div className="mb-8 text-center">
          <p className="mb-1 text-sm text-[var(--muted)]">Results for</p>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
            <p className="text-sm text-[var(--muted)]">Analyzing {name}...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Preview result */}
        {preview && vs && (
          <div className="space-y-6">
            {/* Verdict card */}
            <div className={cn('rounded-2xl border p-6 text-center', vs.bg, vs.border)}>
              <div className={cn('mb-1 text-3xl font-bold tracking-tight', vs.text)}>
                {preview.verdict}
              </div>
              <div className="mb-3 text-sm text-[var(--muted)]">
                Trademark risk: <span className={cn('font-medium', RISK_STYLES[preview.risk])}>{preview.risk}</span>
              </div>
              <p className="text-sm leading-relaxed">{preview.summary}</p>
            </div>

            {/* What's in the full report */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-[var(--muted)]">
                Unlock the full report
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {UNLOCKABLE_SECTIONS.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                  >
                    <div className="mb-0.5 text-sm font-medium">{section.title}</div>
                    <div className="text-xs leading-relaxed text-[var(--muted)]">{section.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center">
              <h2 className="mb-1 text-lg font-bold">See the full analysis</h2>
              <p className="mb-5 text-sm text-[var(--muted)]">
                Create a free account to unlock domains, trademarks, competitors, and more.
              </p>
              <Link
                href={signUpUrl}
                className="inline-block rounded-xl bg-accent px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Create free account
              </Link>
              <p className="mt-3 text-xs text-[var(--muted)]">
                3 full reports free. No credit card required.
              </p>
            </div>

            {/* Try another */}
            <div className="text-center">
              <Link href="/" className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]">
                Try a different name
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
