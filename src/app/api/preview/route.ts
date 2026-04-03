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

    const takeMatch = text.match(/TAKE:\s*(.+)/i);
    const verdictMatch = text.match(/VERDICT:\s*(GO|CAUTION|STOP)/i);
    const riskMatch = text.match(/RISK:\s*(LOW|MEDIUM|HIGH)/i);
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);

    if (verdictMatch && summaryMatch) {
      return Response.json({
        take: takeMatch?.[1]?.trim() || null,
        verdict: verdictMatch[1].toUpperCase(),
        risk: riskMatch?.[1]?.toUpperCase() || 'MEDIUM',
        summary: summaryMatch[1].trim(),
      });
    }

    // Agent responded but not in expected format — use raw text
    if (text.trim().length > 10) {
      const firstSentence = text.split(/[.!?]\s/)[0] + '.';
      return Response.json({
        take: null,
        verdict: 'CAUTION',
        risk: 'MEDIUM',
        summary: firstSentence.length > 200 ? firstSentence.slice(0, 197) + '...' : firstSentence,
      });
    }

    return Response.json({
      take: null,
      verdict: 'CAUTION',
      risk: 'MEDIUM',
      summary: `"${name}" has potential but needs deeper analysis to assess the full landscape.`,
    });
  } catch {
    const len = name.length;
    const isShort = len <= 5;
    const isReal = /^[a-z]+$/i.test(name);

    let hint: string;
    if (isShort && isReal) {
      hint = `Short real-word names like "${name}" are highly contested — the .com is almost certainly taken, but alternatives may be open.`;
    } else if (isShort) {
      hint = `"${name}" is short and memorable, which is great for branding but means more competition for domains and trademarks.`;
    } else if (isReal) {
      hint = `"${name}" is a real word, which makes it easy to remember but increases the chance of trademark conflicts across industries.`;
    } else {
      hint = `"${name}" appears to be a coined term, which is strong for trademarks but you'll want to verify no one has claimed it first.`;
    }

    return Response.json({
      take: null,
      verdict: 'CAUTION',
      risk: 'MEDIUM',
      summary: hint,
    });
  }
}
