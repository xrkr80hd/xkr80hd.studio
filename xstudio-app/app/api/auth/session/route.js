import { json, requireOwner } from '../../../../lib/xstudio-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const context = await requireOwner();
  if (context.response) return context.response;
  return json({ user: { id: context.user.id, email: context.user.email } });
}
