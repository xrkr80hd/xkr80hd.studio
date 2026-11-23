import { cookies } from 'next/headers';
import ProgressComments from '../../components/ProgressComments';
import ProgressGallery from '../../components/ProgressGallery';
import ProgressReactions from '../../components/ProgressReactions';
import ProgressShareButton from '../../components/ProgressShareButton';
import ProgressSignIn from '../../components/ProgressSignIn';
import ProgressSignOut from '../../components/ProgressSignOut';
import { isVisitorView } from '../../lib/admin-auth';
import { notFound } from 'next/navigation';
import { emailConfigured, getFamilyMember, getProgressSettings, isOwnerCookies, listProgressPosts, numberPosts } from '../../lib/progress';
import styles from './progress.module.css';

const TIME_ZONE = 'America/Chicago';
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(value));
}

function formatYear(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}

function Sun({ id = 'progressSun' }) {
  const rays = Array.from({ length: 12 }, (_, index) => index * 30);
  return (
    <svg className={styles.sun} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}Core`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fffde0" />
          <stop offset="55%" stopColor="#fff44f" />
          <stop offset="100%" stopColor="#f5d90a" />
        </radialGradient>
      </defs>
      <g className={styles.rays}>
        {rays.map(angle => (
          <rect key={angle} x="96" y="6" width="8" height="34" rx="4" fill="#fff44f" transform={`rotate(${angle} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="44" fill={`url(#${id}Core)`} />
    </svg>
  );
}

function previewSamplePosts() {
  const at = minutes => new Date(Date.now() - minutes * 60000).toISOString();
  const notes = ['Sample note one. Sending love!', 'Sample note two, a little longer, to show how a longer message wraps on a phone screen.', 'Sample note three.', 'Sample note four.'];
  return [{
    id: '00000000-0000-0000-0000-000000000000',
    title: 'Preview sample update',
    body: 'This sample only shows on preview links, so the layout can be checked without the live data.',
    created_at: at(30),
    photos: ['/assets/progress/ashleys-progress-share.jpg', '/assets/progress/ashleys-progress-hero.jpg', '/assets/progress/ashleys-progress-share.jpg', '/assets/progress/ashleys-progress-hero.jpg', '/assets/progress/ashleys-progress-share.jpg'].map((url, index) => ({ path: `sample-${index}`, url })),
    reactions: { counts: { '❤️': 3, '🙏': 2 }, mine: [] },
    comments: notes.map((body, index) => ({ id: `sample-${index}`, post_id: 'sample', member_email: '', author_name: `Sample person ${index + 1}`, body, created_at: at(25 - index * 5) })),
  }, {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Earlier sample update',
    body: 'An older sample, so the update numbers show on preview links.',
    created_at: at(240),
    photos: [],
    reactions: { counts: {}, mine: [] },
    comments: [],
  }];
}

const SIGNIN_NOTICES = {
  expired: 'That link has expired. Just send a text to Trav for a new one.',
  blocked: 'Just send a text to Trav.',
  error: 'Something went wrong signing you in. Please try again.',
};

export default async function ProgressView({ searchParams, focusId = '' }) {
  const jar = cookies();
  const owner = isOwnerCookies(jar) && !isVisitorView(jar);
  const member = owner ? null : await getFamilyMember(jar).catch(() => null);
  let requireSignin = false;
  try { requireSignin = (await getProgressSettings()).require_signin; } catch { requireSignin = false; }
  const canRead = owner || Boolean(member) || !requireSignin;
  const invite = !owner && !member && typeof searchParams?.invite === 'string' ? searchParams.invite.slice(0, 600) : '';
  const signin = String(searchParams?.signin || '');

  let posts = [];
  let unavailable = false;
  if (canRead) {
    try { posts = await listProgressPosts({ withComments: true, viewerEmail: member?.email || '' }); } catch { unavailable = true; }
  }
  // Preview builds have no database, so show sample content there to check the layout.
  if (unavailable && process.env.VERCEL_ENV === 'preview') {
    posts = previewSamplePosts();
    unavailable = false;
  }
  posts = numberPosts(posts);
  const latest = posts[0];
  // A shared update link shows just that update, with a way back to all of them.
  if (focusId && !unavailable && canRead) {
    posts = posts.filter(post => post.id === focusId);
    if (!posts.length) notFound();
  }
  const now = Date.now();

  return (
    <div className={styles.page}>
      <figure className={styles.banner}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/progress/ashleys-progress-hero.jpg" alt="Ashley's Progress, with photos of Ashley and Travis" width={1672} height={941} fetchPriority="high" />
      </figure>
      <header className={styles.hero}>
        <p className={styles.kicker}><span className={styles.dot} aria-hidden="true" />UPDATES FOR FAMILY &amp; FRIENDS</p>
        <h1 className={styles.srOnly}>Ashley&apos;s Progress</h1>
        <p className={styles.intro}>Thank you for checking in. Every update lands here, newest at the top, so you can come back any time and see how things are going.</p>
        <div className={styles.heroMeta}>
          {latest
            ? <p className={styles.updated}><span className={styles.pulse} aria-hidden="true" />Last updated {formatDate(latest.created_at)} at {formatTime(latest.created_at)}</p>
            : <span />}
          <ProgressShareButton />
        </div>
        {member && <ProgressSignOut name={member.name || member.email} />}
        {owner && <p className={styles.who}>You're viewing as the owner · <a href="/admin/progress">Post an update</a></p>}
        {member && signin === 'welcome' && <p className={styles.welcome}>Welcome{member.name ? `, ${member.name.split(' ')[0]}` : ''}!</p>}
      </header>

      {!canRead && <ProgressSignIn invite={invite} emailReady={emailConfigured()} notice={SIGNIN_NOTICES[signin] || ''} />}

      {unavailable && (
        <section className={styles.notice}>
          <strong>Updates will be posted here.</strong>
          <span>Save this page and check back soon.</span>
        </section>
      )}

      {canRead && !unavailable && posts.length === 0 && (
        <section className={styles.notice}>
          <strong>Updates will be posted here.</strong>
          <span>Save this page and check back soon.</span>
        </section>
      )}

      {posts.length > 0 && (
        <ol className={styles.timeline}>
          {posts.map(post => {
            const fresh = post.id === latest?.id && now - new Date(post.created_at).getTime() < DAY_MS;
            return (
              <li key={post.id} id={`update-${post.number}`} className={styles.post}>
                <span className={styles.marker} aria-hidden="true" />
                <article className={styles.card}>
                  <p className={styles.date}>
                    <span className={styles.updateNumber}>Update {post.number}</span>
                    <time dateTime={post.created_at}>{formatDate(post.created_at)}<span className={styles.year}>, {formatYear(post.created_at)}</span></time>
                    <span className={styles.time}>{formatTime(post.created_at)}</span>
                    {fresh && <span className={styles.badge}>Latest</span>}
                  </p>
                  {post.title && <h2>{post.title}</h2>}
                  <ProgressGallery photos={post.photos} label={post.title ? `${post.title} photo` : 'Photo'} />
                  {post.body && <div className={styles.body}>{post.body}</div>}
                  <div className={styles.postShareRow}>
                    <ProgressShareButton path={`/progress/${post.id}`} title={`Ashley's Progress · Update ${post.number}`} label="Share this update" small />
                  </div>
                  {post.reactions && <ProgressReactions postId={post.id} initial={post.reactions} canReact={Boolean(member)} signInHref={!member && !owner ? '#join' : ''} />}
                  <ProgressComments postId={post.id} initial={post.comments.map(({ member_email: author, ...note }) => ({ ...note, mine: Boolean(member) && author === member.email }))} canPost={Boolean(member)} owner={owner} signInHref={!member && !owner ? '#join' : ''} />
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {focusId && posts.length > 0 && (
        <p className={styles.allUpdates}><a href="/progress">See all updates</a></p>
      )}

      {canRead && !owner && !member && (
        <div className={styles.joinLater} id="join">
          <ProgressSignIn invite={invite} emailReady={emailConfigured()} notice={SIGNIN_NOTICES[signin] || ''} compact />
        </div>
      )}

      <footer className={styles.footer}>
        <Sun id="progressSunFooter" />
        <p>Thank you for all the love and prayers.</p>
      </footer>
    </div>
  );
}
