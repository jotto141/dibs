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
  'Analyzing name structure',
  'Searching trademark databases',
  'Scanning existing businesses',
  'Checking domain availability',
  'Evaluating phonetic conflicts',
  'Compiling results',
];

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  GO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  CAUTION: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
  STOP: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-500/10' },
};

const RISK_STYLES: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

function StepItem({ text, done }: { text: string; done: boolean }) {
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
        {done ? (
          <span className="text-xs text-accent">&#10003;</span>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        )}
      </div>
      <span className={cn('text-sm', done ? 'text-[var(--fg)]' : 'text-[var(--muted)]')}>{text}</span>
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
  const [completedSteps, setCompletedSteps] = useState<number>(0);
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
    setCompletedSteps(0);
    setShowResult(false);

    // Progressive steps — each one appears then gets a checkmark
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep <= RESEARCH_STEPS.length) {
        setCompletedSteps(currentStep);
      }
    }, 1100);

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

    // Wait for all steps to complete
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (currentStep >= RESEARCH_STEPS.length) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });

    clearInterval(stepInterval);
    await new Promise((r) => setTimeout(r, 500));
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
            <h2 className="mb-2 text-xl font-bold">Ready to claim {name}?</h2>
            <p className="mb-1 text-sm text-[var(--muted)]">
              Add a credit card. Pay only for what you use.
            </p>
            <p className="mb-5 text-sm text-[var(--muted)]">
              No subscription. No monthly fees. Ever.
            </p>
            <Link
              href={signUpUrl}
              className="block w-full rounded-xl bg-accent py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get started
            </Link>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-3 w-full py-2 text-center text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
            >
              Not yet
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
            {RESEARCH_STEPS.slice(0, completedSteps + 1).map((step, i) => (
              <StepItem key={step} text={step} done={i < completedSteps} />
            ))}
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
            <div className={cn('rounded-2xl border p-6 text-center shadow-lg', vs.bg, vs.border, vs.glow)}>
              <div className={cn('mb-1 text-3xl font-bold tracking-tight', vs.text)}>
                {preview.verdict}
              </div>
              <div className="mb-3 text-sm text-[var(--muted)]">
                Trademark risk: <span className={cn('font-medium', RISK_STYLES[preview.risk])}>{preview.risk}</span>
              </div>
              <p className="text-sm leading-relaxed">{preview.summary}</p>
            </div>

            {/* Unlock */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-sm text-[var(--muted)]">
                We found a lot more. Unlock the full report to see:
              </p>
              <ul className="mb-5 space-y-2.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Real domain availability — .com, .io, .ai, .dev, .co, .app</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Full trademark conflict breakdown by class</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Every existing business using a similar name</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Creative domains that are actually available</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Alternative name suggestions from our agent</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-accent">&#10003;</span>
                  <span>Unlimited follow-up questions with the research agent</span>
                </li>
              </ul>
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Unlock full report for {name}
              </button>
              <p className="mt-3 text-center text-xs text-[var(--muted)]">
                Pay as you go — no subscription
              </p>
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
