import { getRecursiv } from '@/lib/recursiv';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  const r = getRecursiv();

  try {
    const session = await r.auth.signUp({ name, email, password });
    const cookieStore = await cookies();
    cookieStore.set('dibs_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return Response.json({ ok: true, user: session.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed';
    return Response.json({ error: message }, { status: 400 });
  }
}
