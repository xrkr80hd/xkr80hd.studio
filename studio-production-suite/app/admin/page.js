import { cookies } from 'next/headers';
import Link from 'next/link';
import AdminAmbientLibrary from '../../components/AdminAmbientLibrary';
import AdminLogoutButton from '../../components/AdminLogoutButton';
import { ADMIN_SESSION_USER_COOKIE, getAdminOwnerUsername, isOwnerUsername } from '../../lib/admin-auth';
import { getSupabaseAdminLinks } from '../../lib/admin-links';

export const metadata = {
  title: 'Admin | xrkr80hd Studio',
};

export default function AdminPage({ searchParams }) {
  const links = getSupabaseAdminLinks();
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const ownerMode = isOwnerUsername(actingUser);
  const ownerUsername = getAdminOwnerUsername();
  const error = String(searchParams?.error || '');
  const deniedPath = String(searchParams?.from || '');
  const ownerActions = [
    { href: '/admin/users', label: 'Admin Manager', detail: 'Owner-only manager for admin accounts and access control.' },
    { href: '/admin/home', label: 'Homepage Controls', detail: 'Landing profile and Site Guide card photos.' },
    { href: '/admin/tracks', label: 'XRKR Hub Tracks', detail: 'Upload and manage owner-only tracks for the Hub player.' },
    { href: '/admin/submissions', label: 'Submissions Inbox', detail: 'Review public submissions by type — bands, artists, podcasts, blog, and more.' },
  ];
  const editorActions = [
    { href: '/admin/blog', label: 'My Blog Space', detail: 'Manage your own posts, profile image, channel name, and share links.' },
  ];
  const publicQaLinks = [
    { href: '/', label: 'Home', detail: 'Confirm hero content, radio, and cards.' },
    { href: '/local-legends-archive', label: 'Legends', detail: 'Confirm archive band cards and details.' },
    { href: '/your-local-scene', label: 'Scene', detail: 'Confirm active band listings.' },
    { href: '/podcast', label: 'Podcast', detail: 'Confirm podcast profile changes and latest episodes.' },
    { href: '/your-local-business', label: 'Business', detail: 'Confirm public business page content.' },
    { href: '/contact', label: 'Contact', detail: 'Confirm public contact flow.' },
  ];
  const commonActions = [
    { href: '/admin/guide', label: 'Admin Guide', detail: 'Image sizes and media upload standards.' },
    { href: '/admin/blog', label: 'Blog Manager', detail: 'Write and publish blog posts.' },
    { href: '/admin/bands', label: 'Band Manager', detail: 'Create/edit bands, members, and each band track library.' },
    { href: '/admin/podcasts', label: 'Podcast Manager', detail: 'Create podcast profiles and manage parent-owned episodes.' },
    { href: '/admin/business', label: 'Business Manager', detail: 'Create/edit local business cards with logos and links.' },
    { href: '/admin/password', label: 'My Password', detail: 'Update your own login password.' },
  ];

  return (
    <>
      <section className="card hero">
        <div className="actions" style={{ marginTop: 0, marginBottom: '0.65rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="meta" style={{ margin: 0 }}>
            Signed in as: <strong>{actingUser || 'unknown'}</strong>
            {ownerMode ? ' · Owner tools enabled' : ' · Standard admin mode'}
          </p>
          <AdminLogoutButton />
        </div>
        <h1>Admin Dashboard</h1>
        <p>Use this panel to manage uploads and open your Supabase admin tools.</p>
      </section>

      <section className="card section-space">
        {error === 'owner' ? (
          <p className="alert">
            Access denied for <strong>{deniedPath || 'that route'}</strong>. Signed in as <strong>{actingUser || 'unknown'}</strong>. Owner-only routes
            require <strong>{ownerUsername}</strong>.
          </p>
        ) : null}

        <details className="admin-accordion" open>
          <summary>
            <span className="admin-accordion-title">Edit Panels</span>
            <span className="admin-accordion-note">{ownerMode ? 'Admin Guide, Blog, Bands, Podcasts, Business, Password' : 'Blog only access'}</span>
          </summary>
          <div className="admin-accordion-body">
            <div className="admin-action-grid">
              {(ownerMode ? commonActions : editorActions).map((item) => (
                <Link key={item.href} className="admin-action-tile" href={item.href} prefetch={false}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
              {ownerMode
                ? ownerActions.map((item) => (
                  <Link key={item.href} className="admin-action-tile owner" href={item.href} prefetch={false}>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))
                : null}
            </div>
          </div>
        </details>

        {ownerMode ? (
          <details className="admin-accordion">
            <summary>
              <span className="admin-accordion-title">Supabase Tools</span>
              <span className="admin-accordion-note">Table Editor, Storage, Project</span>
            </summary>
            <div className="admin-accordion-body">
              <div className="admin-action-grid compact">
                <a className="admin-action-tile" href={links.tableEditor} target="_blank" rel="noreferrer">
                  <strong>Table Editor</strong>
                  <span>Open DB rows/columns.</span>
                </a>
                <a className="admin-action-tile" href={links.storage} target="_blank" rel="noreferrer">
                  <strong>Storage</strong>
                  <span>Open files and buckets.</span>
                </a>
                <a className="admin-action-tile" href={links.project} target="_blank" rel="noreferrer">
                  <strong>Project</strong>
                  <span>Open Supabase project settings.</span>
                </a>
              </div>
            </div>
          </details>
        ) : null}

        {ownerMode ? (
          <details className="admin-accordion">
            <summary>
              <span className="admin-accordion-title">Ambient Video Library</span>
              <span className="admin-accordion-note">Background videos that cycle while writing posts</span>
            </summary>
            <div className="admin-accordion-body">
              <AdminAmbientLibrary />
            </div>
          </details>
        ) : null}

        {ownerMode ? (
          <details className="admin-accordion">
            <summary>
              <span className="admin-accordion-title">Public QA Links</span>
              <span className="admin-accordion-note">Home, Legends, Scene, Podcast, Business, Contact</span>
            </summary>
            <div className="admin-accordion-body">
              <div className="admin-action-grid compact">
                {publicQaLinks.map((item) => (
                  <Link key={item.href} className="admin-action-tile" href={item.href} prefetch={false}>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
          </details>
        ) : null}
      </section>
    </>
  );
}
