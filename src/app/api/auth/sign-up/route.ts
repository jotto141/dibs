import { cookies, headers } from 'next/headers';

const API_BASE = process.env.RECURSIV_API_BASE_URL || 'https://api.recursiv.io';
const DIBS_ORG_ID = process.env.DIBS_ORG_ID || '019d541a-d95a-735d-b958-da72dd1171a7';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  const headersList = await headers();
  const origin = headersList.get('origin') || headersList.get('referer') || 'https://dibs.on.recursiv.io';

  try {
    // 1. Sign up
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin,
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      let body;
      try { body = await res.json(); } catch { body = {}; }
      return Response.json(
        { error: body.message || body.error?.message || 'Sign up failed' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data?.session?.token || data?.token;

    if (token) {
      // 2. Set auth cookie
      const cookieStore = await cookies();
      cookieStore.set('dibs_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      // 3. Auto-join Dibs org
      try {
        await fetch(`${API_BASE}/api/v1/organizations/${DIBS_ORG_ID}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `better-auth.session_token=${token}`,
          },
          body: JSON.stringify({ role: 'member' }),
        });
      } catch {
        // Non-fatal — they can still use the app
      }
    }

    return Response.json({ ok: true, user: data.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
