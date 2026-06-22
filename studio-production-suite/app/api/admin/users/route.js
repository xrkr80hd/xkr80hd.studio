import { NextResponse } from 'next/server';
import { ADMIN_SESSION_USER_COOKIE, getConfiguredAdminUsernames, isOwnerUsername } from '../../../../lib/admin-auth';
import { isConfiguredManagedUsername } from '../../../../lib/admin-user-groups.mjs';
import { adminUsersBootstrapSql, createAdminUser, listAdminUsers, normalizeAdminUsername } from '../../../../lib/admin-users';

export const runtime = 'nodejs';

function ownerGuard(request) {
  const actingUser = request.cookies.get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  return isOwnerUsername(actingUser);
}

export async function GET(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage admin users.' }, { status: 403 });
  }

  const result = await listAdminUsers();

  return NextResponse.json({
    users: result.users,
    missingTable: result.missingTable,
    error: result.error,
    sql: result.missingTable ? adminUsersBootstrapSql() : '',
  });
}

export async function POST(request) {
  if (!ownerGuard(request)) {
    return NextResponse.json({ error: 'Only the owner account can manage admin users.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedUsername = normalizeAdminUsername(body.username);

  if (isConfiguredManagedUsername(requestedUsername, getConfiguredAdminUsernames())) {
    return NextResponse.json({ error: 'That username already exists as a secure environment account.' }, { status: 400 });
  }

  const result = await createAdminUser({
    username: requestedUsername,
    password: body.password,
    displayName: body.displayName,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        missingTable: result.missingTable,
        sql: result.missingTable ? adminUsersBootstrapSql() : '',
      },
      { status: result.missingTable ? 500 : 400 }
    );
  }

  return NextResponse.json({ ok: true, channel: result.channel || null });
}
