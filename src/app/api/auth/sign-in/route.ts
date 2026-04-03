import { cookies, headers } from 'next/headers';

const API_BASE = process.env.RECURSIV_API_BASE_URL || 'https://api.recursiv.io';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const headersList = await headers();
  const origin = headersList.get('origin') || headersList.get('referer') || 'https://dibs.on.recursiv.io';

  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let body;
      try { body = await res.json(); } catch { body = {}; }
      return Response.json(
        { error: body.message || body.error?.message || 'Sign in failed' },
        { status: res.status }
      );
    }

    const data = await res.json();

    const token = data?.session?.token || data?.token;
    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('dibs_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return Response.json({ ok: true, user: data.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
