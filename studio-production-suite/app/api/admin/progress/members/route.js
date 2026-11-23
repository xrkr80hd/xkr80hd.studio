import { NextResponse } from 'next/server';
import { getProgressDb, progressOwner, sameOrigin } from '../../../../../lib/progress';
import { normalizeEmail } from '../../../../../lib/progress-family.mjs';
import { MEMBER_SORTS, membersCsv, parseMemberQuery } from '../../../../../lib/progress-members.mjs';

export const dynamic = 'force-dynamic';

const COLUMNS = 'email, name, verified_at, last_seen_at, blocked, created_at';
const CSV_LIMIT = 5000;

function applyFilters(query, { q, status }) {
  let next = query;
  if (q) next = next.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (status === 'active') next = next.eq('blocked', false).not('verified_at', 'is', null);
  if (status === 'pending') next = next.eq('blocked', false).is('verified_at', null);
  if (status === 'removed') next = next.eq('blocked', true);
  return next;
}

async function countWhere(db, status) {
  const { count } = await applyFilters(db.from('progress_members').select('email', { count: 'exact', head: true }), { q: '', status });
  return count || 0;
}

async function noteCounts(db, emails) {
  const counts = new Map(emails.map(email => [email, 0]));
  if (!emails.length) return counts;
  const { data } = await db.from('progress_comments').select('member_email').in('member_email', emails).limit(10000);
  for (const row of data || []) counts.set(row.member_email, (counts.get(row.member_email) || 0) + 1);
  return counts;
}

// Paged, searchable, sortable family list for the owner. ?format=csv exports every match.
export async function GET(request) {
  if (!progressOwner(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const options = parseMemberQuery(params);
  const column = MEMBER_SORTS[options.sort];

  let query = applyFilters(db.from('progress_members').select(COLUMNS, { count: 'exact' }), options)
    .order(column, { ascending: options.dir === 'asc', nullsFirst: false })
    .order('email', { ascending: true });

  if (params.get('format') === 'csv') {
    const { data, error } = await query.range(0, CSV_LIMIT - 1);
    if (error) return NextResponse.json({ error: 'Could not export.' }, { status: 503 });
    const counts = await noteCounts(db, (data || []).map(row => row.email));
    const csv = membersCsv((data || []).map(row => ({ ...row, notes: counts.get(row.email) || 0 })));
    return new NextResponse(`﻿${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="progress-family.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

  const from = (options.page - 1) * options.per;
  const [{ data, error, count }, all, active, pending, removed] = await Promise.all([
    query.range(from, from + options.per - 1),
    countWhere(db, 'all'),
    countWhere(db, 'active'),
    countWhere(db, 'pending'),
    countWhere(db, 'removed'),
  ]);
  if (error) return NextResponse.json({ error: 'Could not load family list.' }, { status: 503 });
  const counts = await noteCounts(db, (data || []).map(row => row.email));
  return NextResponse.json({
    items: (data || []).map(row => ({ ...row, notes: counts.get(row.email) || 0 })),
    total: count || 0,
    page: options.page,
    per: options.per,
    summary: { all, active, pending, removed },
  });
}

// Block or unblock a member. Blocking ends their access on the next page load.
export async function PATCH(request) {
  if (!progressOwner(request) || !sameOrigin(request)) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const raw = await request.json().catch(() => ({}));
  const email = normalizeEmail(raw.email);
  if (!email || typeof raw.blocked !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const db = getProgressDb();
  if (!db) return NextResponse.json({ error: 'Storage unavailable.' }, { status: 503 });
  const { error } = await db.from('progress_members').update({ blocked: raw.blocked }).eq('email', email);
  return error ? NextResponse.json({ error: 'Could not update.' }, { status: 500 }) : NextResponse.json({ ok: true });
}
