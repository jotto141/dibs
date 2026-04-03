import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight">dibs</span>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm text-[var(--muted)]">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          3 free name searches
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Call <span className="text-accent">dibs</span> on your
          <br />startup name
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Naming a startup is hard. An expert AI agent researches trademarks,
          scans existing businesses, and checks which domains are actually
          available — so you don't have to.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Start researching — it's free
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-24 grid w-full max-w-3xl gap-8 md:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Enter a name',
              desc: 'Type in the startup name you're considering.',
            },
            {
              step: '2',
              title: 'AI deep research',
              desc: 'Our agent checks trademarks, domains, and existing businesses instantly.',
            },
            {
              step: '3',
              title: 'Get a verdict',
              desc: 'Clear GO / CAUTION / STOP recommendation with available domains.',
            },
          ].map((item) => (
            <div key={item.step} className="text-left">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-sm font-bold text-accent">
                {item.step}
              </div>
              <h3 className="mb-1 font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted)]">
        Built on{' '}
        <a href="https://recursiv.io" className="text-accent hover:underline">
          Recursiv
        </a>
      </footer>
    </div>
  );
}
