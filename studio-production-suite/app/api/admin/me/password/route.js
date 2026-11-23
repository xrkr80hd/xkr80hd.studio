import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, ADMIN_SESSION_COOKIE, getAdminSessionUser } from '../../../../../lib/admin-auth';
import { findAdminUserByUsername, normalizeAdminUsername, updateAdminUserPassword, verifyDatabaseAdminCredentials } from '../../../../../lib/admin-users';

export const runtime = 'nodejs';

export async function PUT(request) {
  const actingUser = normalizeAdminUsername(getAdminSessionUser(request.cookies.get(ADMIN_SESSION_COOKIE)?.value) || '');
  if (!actingUser) {
    return NextResponse.json({ error: 'Missing active admin session.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || '');
  const nextPassword = String(body.newPassword || '');

  if (!currentPassword || !nextPassword) {
    return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
  }

  if (nextPassword.length < 10) {
    return NextResponse.json({ error: 'New password must be at least 10 characters.' }, { status: 400 });
  }

  const lookup = await findAdminUserByUsername(actingUser);
  if (lookup.missingTable) {
    return NextResponse.json({ error: 'Admin users table is missing. Run SQL setup first.' }, { status: 500 });
  }
  if (lookup.error) {
    return NextResponse.json({ error: lookup.error }, { status: 500 });
  }
  if (!lookup.user) {
    return NextResponse.json({ error: 'This admin account is not DB-managed. Owner must reset it from admin users.' }, { status: 400 });
  }

  const check = await verifyDatabaseAdminCredentials(actingUser, currentPassword);
  if (!check.ok) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  const updated = await updateAdminUserPassword(actingUser, nextPassword);
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error || 'Password update failed.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
