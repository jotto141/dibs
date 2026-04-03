import { getRecursiv } from '@/lib/recursiv';

const PREVIEW_AGENT_ID = process.env.DIBS_PREVIEW_AGENT_ID || 'f0bb1131-aac4-407c-82be-52472801bede';

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== 'string') {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const r = getRecursiv();

  try {
    const result = await r.agents.chat(PREVIEW_AGENT_ID, {
      message: name,
    });

    const text = result.data?.content || '';

    const verdictMatch = text.match(/VERDICT:\s*(GO|CAUTION|STOP)/i);
    const riskMatch = text.match(/RISK:\s*(LOW|MEDIUM|HIGH)/i);
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);

    return Response.json({
      verdict: verdictMatch?.[1]?.toUpperCase() || 'CAUTION',
      risk: riskMatch?.[1]?.toUpperCase() || 'MEDIUM',
      summary: summaryMatch?.[1]?.trim() || 'Analysis complete — sign up to see full details.',
    });
  } catch {
    return Response.json({
      verdict: 'CAUTION',
      risk: 'MEDIUM',
      summary: 'Could not complete preview — sign up for full analysis.',
    });
  }
}
