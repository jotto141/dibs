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

const RESEARCH_STEPS = [
  'Analyzing name structure...',
  'Checking trademark databases...',
  'Scanning existing businesses...',
  'Testing domain availability...',
  'Evaluating phonetic conflicts...',
  'Generating report...',
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

function StepItem({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-3 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      </div>
      <span className="text-sm text-[var(--muted)]">{text}</span>
    </div>
  );
}

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
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (name && !hasStarted.current) {
      hasStarted.current = true;
      startResearch(name);
    }
  }, [name]);

  async function startResearch(n: string) {
    setLoading(true);
    setError('');
    setVisibleSteps([]);
    setShowResult(false);

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < RESEARCH_STEPS.length) {
        setVisibleSteps((prev) => [...prev, RESEARCH_STEPS[stepIndex]]);
        stepIndex++;
      }
    }, 1200);

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
    }

    const waitForSteps = () =>
      new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (stepIndex >= RESEARCH_STEPS.length) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

    await waitForSteps();
    clearInterval(stepInterval);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setShowResult(true);
  }

  const signUpUrl = `/sign-up${name ? `?name=${encodeURIComponent(name)}` : ''}`;
  const vs = preview ? VERDICT_STYLES[preview.verdict] || VERDICT_STYLES.CAUTION : null;

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">dibs</Link>
        </div>
      </nav>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="mb-1 text-lg font-bold">Pay as you go</h2>
            <p className="mb-5 text-sm text-[var(--muted)]">
              No monthly fee. Add a credit card and pay for what you actually use.
            </p>
            <Link
              href={signUpUrl}
              className="block w-full rounded-xl bg-accent py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Add credit card
            </Link>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-3 w-full py-2 text-center text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-8 text-center">
          <p className="mb-1 text-sm text-[var(--muted)]">
            {loading ? 'Researching' : 'Results for'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        </div>

        {/* Processing animation */}
        {loading && (
          <div className="space-y-3">
            {visibleSteps.map((step, i) => (
              <StepItem key={i} text={step} />
            ))}
            {visibleSteps.length < RESEARCH_STEPS.length && (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {showResult && preview && vs && (
          <div className="space-y-6">
            {/* Verdict */}
            <div className={cn('rounded-2xl border p-6 text-center', vs.bg, vs.border)}>
              <div className={cn('mb-1 text-3xl font-bold tracking-tight', vs.text)}>
                {preview.verdict}
              </div>
              <div className="mb-3 text-sm text-[var(--muted)]">
                Trademark risk: <span className={cn('font-medium', RISK_STYLES[preview.risk])}>{preview.risk}</span>
              </div>
              <p className="text-sm leading-relaxed">{preview.summary}</p>
            </div>

            {/* Unlock CTA */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <button
                onClick={() => setShowUpgrade(true)}
                className="mb-4 w-full rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Unlock full report
              </button>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Domain availability across .com, .io, .ai, .dev, .co, .app
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Detailed trademark conflict analysis
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Existing businesses using similar names
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Creative domain suggestions that are available
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Alternative name recommendations
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  Follow-up chat with our research agent
                </li>
              </ul>
            </div>

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
