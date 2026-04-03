import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('dibs_token');
  return Response.json({ ok: true });
}
