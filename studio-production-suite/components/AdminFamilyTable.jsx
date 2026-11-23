'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../app/admin/progress/admin-family.module.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Signed in' },
  { key: 'pending', label: 'Pending' },
  { key: 'removed', label: 'Removed' },
];

const SORTS = [
  { value: 'joined:desc', label: 'Newest' },
  { value: 'joined:asc', label: 'Oldest' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'name:desc', label: 'Name Z–A' },
  { value: 'seen:desc', label: 'Recently seen' },
];

const PER_PAGE = 10;

function statusOf(member) {
  if (member.blocked) return 'removed';
  return member.verified_at ? 'active' : 'pending';
}

function ago(value) {
  if (!value) return '—';
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function AdminFamilyTable() {
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('joined:desc');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, summary: null });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const request = useRef(0);

  // Wait for a short pause in typing before searching.
  useEffect(() => {
    const timer = window.setTimeout(() => { setQ(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useCallback(extra => {
    const [field, dir] = sort.split(':');
    return new URLSearchParams({ q, status, sort: field, dir, per: String(PER_PAGE), page: String(page), ...extra }).toString();
  }, [q, status, sort, page]);

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/progress/members?${params()}`, { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (id !== request.current) return;
      if (!response.ok) throw new Error(body.error || 'Could not load the family list.');
      setData({ items: body.items || [], total: body.total || 0, summary: body.summary || null });
      setMessage('');
    } catch (error) {
      if (id === request.current) setMessage(error.message);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  async function setBlocked(member, blocked) {
    if (blocked && !window.confirm(`Remove access for ${member.name || member.email}?`)) return;
    const response = await fetch('/api/admin/progress/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: member.email, blocked }) });
    if (!response.ok) { setMessage('Could not update. Please try again.'); return; }
    setMessage(blocked ? `${member.name || member.email} removed.` : `${member.name || member.email} restored.`);
    load();
  }

  const pages = Math.max(1, Math.ceil(data.total / PER_PAGE));
  const first = data.total ? (page - 1) * PER_PAGE + 1 : 0;
  const last = Math.min(data.total, page * PER_PAGE);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h3>Family list</h3>
        <a className={styles.export} href={`/api/admin/progress/members?${params({ format: 'csv', page: '1' })}`}>Export CSV</a>
      </div>

      <div className={styles.filters} role="tablist" aria-label="Filter family list">
        {FILTERS.map(filter => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={status === filter.key}
            className={status === filter.key ? styles.filterOn : styles.filter}
            onClick={() => { setStatus(filter.key); setPage(1); }}
          >
            {filter.label}<span>{data.summary ? data.summary[filter.key] : '·'}</span>
          </button>
        ))}
      </div>

      <div className={styles.tools}>
        <input type="search" className={styles.search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or email" aria-label="Search name or email" />
        <select className={styles.sort} value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} aria-label="Sort">
          {SORTS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <div className={styles.table} role="table" aria-label="Family members" aria-busy={loading}>
        <div className={styles.headRow} role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader" className={styles.wide}>Last seen</span>
          <span role="columnheader" className={styles.wide}>Notes</span>
          <span role="columnheader"><span className={styles.srOnly}>Action</span></span>
        </div>
        {data.items.map(member => {
          const state = statusOf(member);
          return (
            <div key={member.email} role="row" className={`${styles.row} ${state === 'removed' ? styles.rowOff : ''}`}>
              <div role="cell" className={styles.who}>
                <span className={`${styles.dot} ${styles[state]}`} title={state === 'active' ? 'Signed in' : state === 'pending' ? 'Pending' : 'Removed'} aria-label={state === 'active' ? 'Signed in' : state === 'pending' ? 'Pending' : 'Removed'} />
                <div className={styles.names}>
                  <strong>{member.name || 'No name'}</strong>
                  <span>{member.email}</span>
                </div>
              </div>
              <span role="cell" className={styles.wide}>{ago(member.last_seen_at)}</span>
              <span role="cell" className={styles.wide}>{member.notes || 0}</span>
              <span role="cell" className={styles.act}>
                {member.blocked
                  ? <button type="button" className={styles.restore} onClick={() => setBlocked(member, false)}>Restore</button>
                  : <button type="button" className={styles.remove} onClick={() => setBlocked(member, true)} aria-label={`Remove ${member.name || member.email}`}>Remove</button>}
              </span>
            </div>
          );
        })}
        {!loading && data.items.length === 0 && <p className={styles.empty}>{q ? 'No one matches that search.' : 'No one here yet.'}</p>}
      </div>

      <div className={styles.foot}>
        <span>{loading ? 'Loading…' : `${first}–${last} of ${data.total}`}</span>
        <div className={styles.pager}>
          <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1 || loading} aria-label="Previous page">‹</button>
          <span>{page} / {pages}</span>
          <button type="button" onClick={() => setPage(value => Math.min(pages, value + 1))} disabled={page >= pages || loading} aria-label="Next page">›</button>
        </div>
      </div>
      <p role="status" className={styles.message}>{message}</p>
    </div>
  );
}
