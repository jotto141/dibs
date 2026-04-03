'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'agent';
}

export default function FullReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[var(--muted)]">Loading...</div>}>
      <FullReportContent />
    </Suspense>
  );
}

function FullReportContent() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [phase, setPhase] = useState<'welcome' | 'ready' | 'researching' | 'done'>('welcome');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // On mount: show a welcome message from the agent with typing effect
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      showWelcome();
    }
  }, []);

  async function showWelcome() {
    const welcomeMsg: Message = { id: crypto.randomUUID(), content: '', role: 'agent' };
    setMessages([welcomeMsg]);

    const text = initialName
      ? `Hey! Welcome to Dibs. I'm your naming research agent.\n\nI see you want to look into "${initialName}" — I'll run a full analysis on trademarks, domain availability, existing businesses, and more.\n\nReady when you are. Just say the word.`
      : `Hey! Welcome to Dibs. I'm your naming research agent.\n\nI can run deep research on any startup name — trademarks, domains, existing businesses, the works.\n\nWhat name do you want me to look into?`;

    // Type it out character by character
    for (let i = 0; i <= text.length; i++) {
      await new Promise((r) => setTimeout(r, 8));
      setMessages([{ ...welcomeMsg, content: text.slice(0, i) }]);
    }

    setPhase(initialName ? 'ready' : 'done');
  }

  async function sendMessage(text: string) {
    const userMsg: Message = { id: crypto.randomUUID(), content: text, role: 'user' };
    const agentMsg: Message = { id: crypto.randomUUID(), content: '', role: 'agent' };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setIsStreaming(true);
    setPhase('researching');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });

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
            // skip malformed
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
      setPhase('done');
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  }

  function handleStartResearch() {
    sendMessage(`Run a full name analysis on "${initialName}". Check trademarks, domain availability across all major TLDs, existing businesses, phonetic conflicts, and suggest alternatives if there are issues.`);
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Nav */}
      <nav className="shrink-0 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/app" className="text-lg font-bold tracking-tight">dibs</Link>
        </div>
      </nav>

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
                  {((phase === 'welcome') || (isStreaming && i === messages.length - 1 && msg.role === 'agent')) && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[var(--muted)]" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* "Let's go" button after welcome */}
          {phase === 'ready' && (
            <div className="flex justify-end">
              <button
                onClick={handleStartResearch}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Let's do it — research "{initialName}"
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input — only show after initial research is done */}
      {phase === 'done' && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <form onSubmit={handleSend} className="mx-auto flex max-w-2xl gap-3 px-4 py-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up or try another name..."
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
      )}
    </div>
  );
}
