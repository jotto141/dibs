import { getRecursiv, AGENT_ID } from '@/lib/recursiv';

export async function POST(request: Request) {
  const { message, conversation_id } = await request.json();
  const r = getRecursiv();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of r.agents.chatStream(AGENT_ID, {
          message,
          conversation_id,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          if (chunk.type === 'done') break;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Stream failed';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
