import {GAME_COOKIE,signGameSession} from '../../../../lib/game-night-session.mjs';
import {isGameOwner,gameOwnerCredentialVersion} from '../../../../lib/game-night-server';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_USER_COOKIE, getAdminConfig, isAdminConfigReady, matchEnvAdminCredentials } from '../../../../lib/admin-auth';
import { normalizeAdminUsername, verifyDatabaseAdminCredentials } from '../../../../lib/admin-users';

export const runtime = 'nodejs';

function getJsonBodySafe(request) {
  return request.json().catch(() => ({}));
}

export async function POST(request) {
  if (!isAdminConfigReady()) {
    return NextResponse.json({ error: 'Admin auth is not configured on the server (missing ADMIN_SESSION_TOKEN).' }, { status: 500 });
  }

  const body = await getJsonBodySafe(request);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const normalizedUsername = normalizeAdminUsername(username);

  let authenticatedUsername = matchEnvAdminCredentials(username, password);

  if (!authenticatedUsername) {
    const dbCheck = await verifyDatabaseAdminCredentials(normalizedUsername, password);
    if (dbCheck.ok) {
      authenticatedUsername = normalizedUsername;
    }
  }

  if (!authenticatedUsername) {
    return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
  }

  const { sessionToken } = getAdminConfig();
  const response = NextResponse.json({ ok: true });
  if(isGameOwner(authenticatedUsername)){try{const credentialVersion=await gameOwnerCredentialVersion(authenticatedUsername);if(credentialVersion)response.cookies.set({name:GAME_COOKIE,value:signGameSession(authenticatedUsername,sessionToken,Date.now(),credentialVersion),httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:7*86400});}catch{/* Game access must not interrupt a successful main-site login. */}}

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set({
    name: ADMIN_SESSION_USER_COOKIE,
    value: authenticatedUsername,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({name:GAME_COOKIE,value:'',httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0});

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: ADMIN_SESSION_USER_COOKIE,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
