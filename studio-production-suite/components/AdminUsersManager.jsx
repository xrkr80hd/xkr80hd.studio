'use client';

import { useMemo, useState } from 'react';
import { groupManagedUsers, MANAGED_USER_CATEGORIES } from '../lib/admin-user-groups.mjs';
import AdminAccordionSection from './AdminAccordionSection';

function SqlBlock({ sql }) {
  if (!sql) {
    return null;
  }

  return <pre className="admin-users-sql">{sql}</pre>;
}

function UserIdentity({ user }) {
  return (
    <div className="admin-user-card-head">
      <div>
        <h3>{user.username}</h3>
        <p className="meta">{user.display_name || 'No display name'}</p>
      </div>
      <span className={`admin-user-role ${user.protected ? 'owner' : ''}`.trim()}>{user.category}</span>
    </div>
  );
}

function ManagedUserCard({
  user,
  resetPassword,
  passwordVisible,
  deliveryMessage,
  onResetPasswordChange,
  onTogglePassword,
  onCopyLogin,
  onResetAndCopy,
  onDelete,
  onCopyDelivery,
}) {
  const environmentManaged = user.management === 'environment';

  return (
    <article className="admin-user-card">
      <UserIdentity user={user} />
      {environmentManaged ? (
        <p className="admin-user-protected-note">Secure environment account · password and removal are managed through deployment settings.</p>
      ) : (
        <details className="admin-user-tools">
          <summary>Login &amp; account tools</summary>
          <div className="admin-user-tools-body">
          <div className="form-row admin-user-password-row">
            <label htmlFor={`reset-password-${user.username}`}>Temporary password</label>
            <div className="admin-user-inline-control">
              <input
                id={`reset-password-${user.username}`}
                type={passwordVisible ? 'text' : 'password'}
                value={resetPassword}
                onChange={(event) => onResetPasswordChange(event.target.value)}
                placeholder="Leave blank to generate one"
              />
              <button className="button compact" type="button" onClick={onTogglePassword}>
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="actions admin-user-actions">
            <button className="button compact" type="button" onClick={onCopyLogin}>
              Copy Login
            </button>
            <button className="button compact primary" type="button" onClick={onResetAndCopy}>
              Reset + Copy
            </button>
            <button className="button compact danger" type="button" onClick={onDelete}>
              Delete
            </button>
          </div>
          {deliveryMessage ? (
            <div className="form-row admin-user-delivery">
              <label htmlFor={`delivery-${user.username}`}>Login message</label>
              <textarea
                id={`delivery-${user.username}`}
                readOnly
                rows={4}
                value={deliveryMessage}
                onFocus={(event) => event.target.select()}
              />
              <button className="button compact" type="button" onClick={onCopyDelivery}>
                Copy Message
              </button>
            </div>
          ) : null}
          </div>
        </details>
      )}
    </article>
  );
}

export default function AdminUsersManager({ initialUsers, missingTable, initialError, sqlSnippet, ownerUsername, configuredUsernames = [] }) {
  const [users, setUsers] = useState(initialUsers || []);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('blogs');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [resetPasswords, setResetPasswords] = useState({});
  const [showResetPassword, setShowResetPassword] = useState({});
  const [deliveryMessages, setDeliveryMessages] = useState({});
  const [status, setStatus] = useState(initialError || '');
  const [saving, setSaving] = useState(false);
  const groupedUsers = useMemo(
    () => groupManagedUsers({ ownerUsername, users, configuredUsernames }),
    [configuredUsernames, ownerUsername, users]
  );

  const refreshUsers = async () => {
    const response = await fetch('/api/admin/users', { method: 'GET' });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(payload.error || 'Failed to refresh users.');
      return;
    }

    setUsers(payload.users || []);
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = new Uint32Array(18);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 0xffffffff);
      }
    }

    return Array.from(bytes, (value) => chars[value % chars.length]).join('');
  };

  const copyToClipboard = async (text) => {
    if (!text) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const buildLoginMessage = (targetUser, plainPassword = '') => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const lines = [
      'xrkr80hd.studio blog access',
      `Login URL: ${origin}/admin/login`,
      `Username: ${targetUser}`,
    ];

    if (plainPassword) {
      lines.push(`Password: ${plainPassword}`);
      lines.push('You can change this password after signing in.');
    } else {
      lines.push('Password: use your current password (or ask the owner for a reset).');
    }

    return lines.join('\n');
  };

  const setDeliveryMessage = (targetUser, value) => {
    setDeliveryMessages((current) => ({ ...current, [targetUser]: value }));
  };

  const renderManagedUser = (user) => {
    const resetPassword = resetPasswords[user.username] || '';
    const passwordVisible = Boolean(showResetPassword[user.username]);
    const deliveryMessage = deliveryMessages[user.username] || '';

    return (
      <ManagedUserCard
        key={user.username}
        user={user}
        resetPassword={resetPassword}
        passwordVisible={passwordVisible}
        deliveryMessage={deliveryMessage}
        onResetPasswordChange={(value) => setResetPasswords((current) => ({ ...current, [user.username]: value }))}
        onTogglePassword={() => setShowResetPassword((current) => ({ ...current, [user.username]: !current[user.username] }))}
        onCopyLogin={async () => {
          const text = buildLoginMessage(user.username);
          const copied = await copyToClipboard(text);
          setDeliveryMessage(user.username, text);
          setStatus(copied ? `Copied login link for ${user.username}.` : `Use the login message box for ${user.username}.`);
        }}
        onResetAndCopy={async () => {
          let nextPassword = resetPassword;
          if (nextPassword.length < 10) {
            nextPassword = generateTemporaryPassword();
            setResetPasswords((current) => ({ ...current, [user.username]: nextPassword }));
          }

          const response = await fetch(`/api/admin/users/${encodeURIComponent(user.username)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ password: nextPassword }),
          });
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            setStatus(payload.error || 'Password reset failed.');
            return;
          }

          const text = buildLoginMessage(user.username, nextPassword);
          const copied = await copyToClipboard(text);
          setDeliveryMessage(user.username, text);
          setShowResetPassword((current) => ({ ...current, [user.username]: true }));
          setStatus(copied ? `Reset password and copied login for ${user.username}.` : `Password reset for ${user.username}; use the login message box.`);
        }}
        onDelete={async () => {
          const response = await fetch(`/api/admin/users/${encodeURIComponent(user.username)}`, { method: 'DELETE' });
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            setStatus(payload.error || 'Delete failed.');
            return;
          }

          setStatus(`Deleted ${user.username}.`);
          await refreshUsers();
        }}
        onCopyDelivery={async () => {
          const copied = await copyToClipboard(deliveryMessage);
          setStatus(copied ? `Copied message for ${user.username}.` : 'Select the message and copy it manually.');
        }}
      />
    );
  };

  return (
    <div className="admin-users-manager">
      <section className="card section-space admin-users-section">
        <AdminAccordionSection title="Add User" note="Create a scoped login account" defaultOpen>
          <form
            className="admin-add-user-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setStatus('Creating user...');

              const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ username, displayName, password, category }),
              });
              const payload = await response.json().catch(() => ({}));

              if (!response.ok) {
                setStatus(payload.error || 'Create failed.');
                setSaving(false);
                return;
              }

              setUsername('');
              setDisplayName('');
              setPassword('');
              setCategory('blogs');
              setStatus('Blog user created.');
              setSaving(false);
              await refreshUsers();
            }}
          >
            <div className="admin-add-user-grid">
              <div className="form-row">
                <label htmlFor="admin-user-username">Username</label>
                <input
                  id="admin-user-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="jessie_v"
                  required
                />
              </div>
              <div className="form-row">
                <label htmlFor="admin-user-display">Display name</label>
                <input
                  id="admin-user-display"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Jessie V"
                />
              </div>
              <div className="form-row">
                <label htmlFor="admin-user-category">Access category</label>
                <select id="admin-user-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {MANAGED_USER_CATEGORIES.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="admin-user-password">Password</label>
                <div className="admin-user-inline-control">
                  <input
                    id="admin-user-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 10 characters"
                    required
                  />
                  <button className="button compact" type="button" onClick={() => setShowCreatePassword((value) => !value)}>
                    {showCreatePassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <div className="admin-add-user-footer">
              <p className="meta">Blogs users can manage only their own posts and blog channel.</p>
              <button className="button primary" type="submit" disabled={saving || missingTable}>
                {saving ? 'Creating...' : 'Add User'}
              </button>
            </div>
          </form>
          {status ? <p className="admin-users-status">{status}</p> : null}
        </AdminAccordionSection>
      </section>

      <section className="card section-space admin-users-section">
        <AdminAccordionSection
          title={`Existing Admin Users (${groupedUsers.adminUsers.length})`}
          note="Full owner access"
          defaultOpen={false}
        >
          <div className="admin-user-grid">
            {groupedUsers.adminUsers.map((user) => (
              <article key={user.username} className="admin-user-card protected">
                <UserIdentity user={user} />
                <p className="admin-user-protected-note">Protected owner account · managed through secure environment settings.</p>
              </article>
            ))}
          </div>
        </AdminAccordionSection>
      </section>

      <section className="card section-space admin-users-section">
        <AdminAccordionSection
          title={`Existing Users (${groupedUsers.userGroups.reduce((total, group) => total + group.users.length, 0)})`}
          note="Grouped by access category"
          defaultOpen
        >
          {groupedUsers.userGroups.map((group) => (
            <AdminAccordionSection
              key={group.key}
              title={`${group.label} (${group.users.length})`}
              note={group.description}
              defaultOpen={group.users.length > 0}
            >
              {group.users.length ? <div className="admin-user-grid">{group.users.map(renderManagedUser)}</div> : <p className="meta">No users in this category.</p>}
            </AdminAccordionSection>
          ))}
        </AdminAccordionSection>
      </section>

      {missingTable ? (
        <section className="card section-space admin-users-section">
          <h2 className="section-title">One-Time Setup Needed</h2>
          <p className="meta">Run this SQL once in Supabase SQL Editor, then refresh this page.</p>
          <SqlBlock sql={sqlSnippet} />
        </section>
      ) : null}
    </div>
  );
}
