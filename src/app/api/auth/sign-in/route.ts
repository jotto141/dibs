import { getRecursiv } from '@/lib/recursiv';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const r = getRecursiv();

  try {
    const result = await r.auth.signIn({ email, password });
    const cookieStore = await cookies();
    cookieStore.set('dibs_token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    return Response.json({ error: message }, { status: 400 });
  }
}
