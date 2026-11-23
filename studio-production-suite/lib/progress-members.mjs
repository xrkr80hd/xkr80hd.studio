// Shared rules for the admin family-member table: filters, sorting, paging and CSV.

export const MEMBER_STATUSES = ['all', 'active', 'pending', 'removed'];
export const MEMBER_SORTS = { name: 'name', email: 'email', joined: 'created_at', seen: 'last_seen_at' };
export const PAGE_SIZES = [10, 25, 50, 100];

export function parseMemberQuery(params) {
  const get = key => (typeof params.get === 'function' ? params.get(key) : params[key]) || '';
  // Characters that would break the search filter are dropped; the rest is matched as text.
  const q = String(get('q')).replace(/[,()%_*\\"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  const status = MEMBER_STATUSES.includes(get('status')) ? get('status') : 'all';
  const sort = Object.hasOwn(MEMBER_SORTS, get('sort')) ? get('sort') : 'joined';
  const dir = get('dir') === 'asc' ? 'asc' : 'desc';
  const per = PAGE_SIZES.includes(Number(get('per'))) ? Number(get('per')) : 10;
  const page = Math.min(10000, Math.max(1, Math.floor(Number(get('page')) || 1)));
  return { q, status, sort, dir, per, page };
}

export function memberStatus(member) {
  if (member.blocked) return 'removed';
  return member.verified_at ? 'active' : 'pending';
}

function csvCell(value) {
  let text = value == null ? '' : String(value);
  // Stop spreadsheet apps from treating a cell as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function membersCsv(rows) {
  const header = ['Name', 'Email', 'Status', 'Joined', 'Last seen', 'Notes'];
  const lines = rows.map(row => [row.name, row.email, memberStatus(row), row.created_at, row.last_seen_at, row.notes ?? 0].map(csvCell).join(','));
  return [header.join(','), ...lines].join('\r\n');
}
