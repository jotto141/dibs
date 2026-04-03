'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'agent';
}

const FREE_LIMIT = 3;

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[var(--muted)]">Loading...</div>}>
      <ResearchContent />
    </Suspense>
  );
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialName = searchParams.get('name') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [searchCount, setSearchCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialName && !hasStarted.current) {
      hasStarted.current = true;
      sendMessage(`Research the startup name: ${initialName}`);
    }
  }, [initialName]);

  async function sendMessage(text: string) {
    const currentCount = searchCount + (messages.length === 0 ? 1 : 0);

    // Check if this is a new name research (not a follow-up)
    const isNewResearch = text.startsWith('Research the startup name:');
    if (isNewResearch) {
      const stored = parseInt(localStorage.getItem('dibs_searches') || '0');
      if (stored >= FREE_LIMIT) {
        setShowUpgrade(true);
        return;
      }
      localStorage.setItem('dibs_searches', String(stored + 1));
      setSearchCount(stored + 1);
    }

    const userMsg: Message = { id: crypto.randomUUID(), content: text, role: 'user' };
    const agentMsg: Message = { id: crypto.randomUUID(), content: '', role: 'agent' };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });

      if (res.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(line.slice(6));

            if (chunk.type === 'text_delta' && chunk.delta) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1]!;
                updated[updated.length - 1] = { ...last, content: last.content + chunk.delta };
                return updated;
              });
            } else if (chunk.type === 'done') {
              if (chunk.conversation_id) {
                setConversationId(chunk.conversation_id);
              }
            } else if (chunk.type === 'error') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1]!;
                updated[updated.length - 1] = { ...last, content: `Error: ${chunk.error}` };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1]!;
        updated[updated.length - 1] = {
          ...last,
          content: `Error: ${err instanceof Error ? err.message : 'Connection failed'}`,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  }

  function handleNewSearch() {
    const stored = parseInt(localStorage.getItem('dibs_searches') || '0');
    if (stored >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    router.push('/app');
  }

  async function handleSignOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
  }

  const searchesRemaining = FREE_LIMIT - (parseInt(typeof window !== 'undefined' ? localStorage.getItem('dibs_searches') || '0' : '0'));

  return (
    <div className="flex h-screen flex-col">
      {/* Nav */}
      <nav className="shrink-0 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">dibs</span>
            <button
              onClick={handleNewSearch}
              className="rounded-md bg-accent-subtle px-3 py-1 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              New search
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--muted)]">
              {searchesRemaining > 0
                ? `${searchesRemaining} free search${searchesRemaining !== 1 ? 'es' : ''} left`
                : 'Free searches used'}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <div className="mb-4 text-4xl">
              &#x1F680;
            </div>
            <h2 className="mb-2 text-xl font-bold">You've used your free searches</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              Upgrade to Dibs Pro for unlimited name research, priority analysis,
              and real-time domain monitoring.
            </p>
            <button className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
              Upgrade to Pro — $9/mo
            </button>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-3 w-full py-2 text-sm text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--fg)]'
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'agent' && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[var(--muted)]" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
        <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-3 px-4 py-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={isStreaming}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={cn(
              'rounded-xl px-6 py-3 text-sm font-medium transition-colors',
              input.trim() && !isStreaming
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            )}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
