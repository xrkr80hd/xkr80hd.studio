import { cookies } from 'next/headers';
import Link from 'next/link';
import AdminAmbientLibrary from '../../components/AdminAmbientLibrary';
import AdminLogoutButton from '../../components/AdminLogoutButton';
import { ViewAsVisitorButton } from '../../components/AdminViewBar';
import AdminPageSwitches from '../../components/AdminPageSwitches';
import { ADMIN_SESSION_USER_COOKIE, getAdminOwnerUsername, isOwnerUsername } from '../../lib/admin-auth';
import { getSupabaseAdminLinks } from '../../lib/admin-links';
import { PAGE_SWITCHES, PAGE_VISIBILITY_SQL, readPageVisibility } from '../../lib/page-visibility';

export const metadata = {
  title: 'Admin | xrkr80hd Studio',
};

export const dynamic = 'force-dynamic';

const specialPages = [
  { href: '/admin/progress', label: "Ashley's Progress", detail: 'Post updates and photos, invite family.', owner: true },
  { href: '/admin/gleaux', label: 'Lets Gleaux', detail: 'Player, free download, and counters.', owner: true },
];

const musicMedia = [
  { href: '/admin/bands', label: 'Bands', detail: 'Bands, members, and their tracks.' },
  { href: '/admin/podcasts', label: 'Podcasts', detail: 'Podcast profiles and episodes.' },
  { href: '/admin/tracks', label: 'Hub Tracks', detail: 'Your own tracks for the Hub player.', owner: true },
];

const siteContent = [
  { href: '/admin/blog', label: 'Blog', detail: 'Write and publish posts.' },
  { href: '/admin/home', label: 'Homepage', detail: 'Profile, welcome message, card photos.', owner: true },
  { href: '/admin/business', label: 'Businesses', detail: 'Local business cards and links.' },
  { href: '/admin/submissions', label: 'Submissions', detail: 'What people sent in from the site.', owner: true },
];

const settingsHelp = [
  { href: '/admin/users', label: 'Admin Accounts', detail: 'Who can sign in to admin.', owner: true },
  { href: '/admin/password', label: 'My Password', detail: 'Change your login password.' },
  { href: '/admin/guide', label: 'Image Size Guide', detail: 'Upload sizes and media rules.' },
];

const liveSite = [
  { href: '/', label: 'Home' },
  { href: '/local-legends-archive', label: 'Legends' },
  { href: '/your-local-scene', label: 'Scene' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/your-local-business', label: 'Business' },
  { href: '/contact', label: 'Contact' },
];

function Tiles({ items, compact = false }) {
  return (
    <div className={`admin-action-grid ${compact ? 'compact' : ''}`.trim()}>
      {items.map((item) => (
        <Link key={item.href} className={`admin-action-tile ${item.owner ? 'owner' : ''}`.trim()} href={item.href} prefetch={false}>
          <strong>{item.label}</strong>
          {item.detail ? <span>{item.detail}</span> : null}
        </Link>
      ))}
    </div>
  );
}

function Section({ id, title, note, open = false, children }) {
  return (
    <details id={id} className="admin-accordion" open={open}>
      <summary>
        <span className="admin-accordion-title">{title}</span>
        {note ? <span className="admin-accordion-note">{note}</span> : null}
      </summary>
      <div className="admin-accordion-body">{children}</div>
    </details>
  );
}

export default async function AdminPage({ searchParams }) {
  const links = getSupabaseAdminLinks();
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const ownerMode = isOwnerUsername(actingUser);
  const ownerUsername = getAdminOwnerUsername();
  const error = String(searchParams?.error || '');
  const deniedPath = String(searchParams?.from || '');
  const openPages = String(searchParams?.open || '') === 'pages';

  const visibility = ownerMode ? await readPageVisibility() : null;
  const offCount = visibility ? PAGE_SWITCHES.filter((page) => visibility.enabled[page.key] === false).length : 0;

  return (
    <>
      <section className="card hero">
        <div className="actions" style={{ marginTop: 0, marginBottom: '0.65rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="meta" style={{ margin: 0 }}>
            Signed in as: <strong>{actingUser || 'unknown'}</strong>
            {ownerMode ? ' · Owner' : ' · Blog editor'}
          </p>
          <div className="actions" style={{ margin: 0 }}>
            <ViewAsVisitorButton />
            <AdminLogoutButton />
          </div>
        </div>
        <h1>Admin Dashboard</h1>
        <p>Tap a section to open it.</p>
      </section>

      <section className="card section-space">
        {error === 'owner' ? (
          <p className="alert">
            Access denied for <strong>{deniedPath || 'that route'}</strong>. Signed in as <strong>{actingUser || 'unknown'}</strong>. Owner-only routes
            require <strong>{ownerUsername}</strong>.
          </p>
        ) : null}

        {ownerMode ? (
          <>
            <Section id="page-switches" title="Pages On / Off" note={offCount ? `${offCount} off` : 'All on'} open={openPages}>
              <p className="meta" style={{ marginTop: 0 }}>Off hides the page and its menu tab from the public. You can still see it while signed in.</p>
              <AdminPageSwitches
                pages={PAGE_SWITCHES}
                initialEnabled={visibility.enabled}
                ready={visibility.ready}
                setupSql={PAGE_VISIBILITY_SQL}
              />
            </Section>

            <Section title="Special Pages" note="Progress, Lets Gleaux" open={!openPages}>
              <Tiles items={specialPages} compact />
            </Section>

            <Section title="Music & Media" note="Bands, Podcasts, Tracks, Videos">
              <Tiles items={musicMedia} />
              <h3 className="admin-subhead">Ambient Video Library</h3>
              <AdminAmbientLibrary />
            </Section>

            <Section title="Site Content" note="Blog, Homepage, Businesses, Submissions">
              <Tiles items={siteContent} compact />
            </Section>

            <Section title="Settings & Help" note="Accounts, Password, Guide">
              <Tiles items={settingsHelp} />
            </Section>

            <Section title="Supabase (Schema & Data)" note="Table Editor, Storage, Project">
              <div className="admin-action-grid">
                <a className="admin-action-tile" href={links.tableEditor} target="_blank" rel="noreferrer">
                  <strong>Table Editor</strong>
                  <span>Your tables, columns, and rows.</span>
                </a>
                <a className="admin-action-tile" href={links.storage} target="_blank" rel="noreferrer">
                  <strong>Storage</strong>
                  <span>Files and buckets.</span>
                </a>
                <a className="admin-action-tile" href={links.project} target="_blank" rel="noreferrer">
                  <strong>Project</strong>
                  <span>Supabase project settings.</span>
                </a>
              </div>
            </Section>

            <Section title="Check the Live Site" note="Open public pages">
              <Tiles items={liveSite} />
            </Section>
          </>
        ) : (
          <Section title="My Blog" note="Posts, profile, password" open>
            <Tiles
              items={[
                { href: '/admin/blog', label: 'My Blog Space', detail: 'Your posts, profile image, and channel name.' },
                { href: '/admin/password', label: 'My Password', detail: 'Change your login password.' },
              ]}
              compact
            />
          </Section>
        )}
      </section>
    </>
  );
}
