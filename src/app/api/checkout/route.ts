import { getRecursiv } from '@/lib/recursiv';
import { cookies, headers } from 'next/headers';

const API_BASE = process.env.RECURSIV_API_BASE_URL || 'https://api.recursiv.io';
const DIBS_ORG_ID = process.env.DIBS_ORG_ID || '019d541a-d95a-735d-b958-da72dd1171a7';

export async function POST(request: Request) {
  const { name } = await request.json();
  const cookieStore = await cookies();
  const token = cookieStore.get('dibs_token')?.value;

  // If not signed in, sign them up first then create checkout
  if (!token) {
    return Response.json({ error: 'Sign up first', redirect: `/sign-up?name=${encodeURIComponent(name || '')}` }, { status: 401 });
  }

  const r = getRecursiv();

  // Verify session
  const session = await r.auth.getSession(token);
  if (!session) {
    return Response.json({ error: 'Session expired', redirect: '/sign-in' }, { status: 401 });
  }

  try {
    // Create checkout session scoped to Dibs org (uses platform Stripe)
    const returnUrl = name
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://dibs.on.recursiv.io'}/app/research?name=${encodeURIComponent(name)}`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'https://dibs.on.recursiv.io'}/app`;

    const result = await r.billing.createCheckoutSession({
      user_id: session.user.id,
      return_url: returnUrl,
    });

    return Response.json({ url: result.data.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
