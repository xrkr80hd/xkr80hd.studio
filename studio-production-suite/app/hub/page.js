import Link from 'next/link';
import HubMediaGallery from '../../components/HubMediaGallery';
import HubTracksPlayer from '../../components/HubTracksPlayer';
import SharePostLinkButton from '../../components/SharePostLinkButton';
import { getHubData } from '../../lib/content';
import { formatDate, stripHtml, truncate } from '../../lib/format';

export default async function HubPage() {
  const { tracks, posts, photos, videos, counts } = await getHubData();

  return (
    <>
      <section className="card hero">
        <h1>
          <span className="hero-accent">
            <span className="split-cool">XRKR</span>
            <span className="split-80">80</span>
            <span className="split-cool">HD</span>Local
          </span>{' '}
          Hub
        </h1>
        <p>Everything in one place: music, photos, videos, projects, blog updates, and media drops.</p>
      </section>

      <section className="card section-space hub-player">
        <div className="hub-player-head">
          <h3 className="section-title">XRKR80HD Tracks</h3>
          <span className="meta">{counts.tracks} total</span>
        </div>
        <HubTracksPlayer tracks={tracks} />
      </section>

      <HubMediaGallery photos={photos.slice(0, 8)} videos={videos.slice(0, 8)} />

      <section className="card section-space hub-blog-section">
        <div className="hub-player-head">
          <h3 className="section-title">YourLocal Blog</h3>
          <span className="meta">{counts.posts} published</span>
        </div>
        {posts.length ? (
          <div className="hub-blog-grid">
            {posts.slice(0, 8).map((post) => {
              const preview = truncate(stripHtml(post.excerpt || post.content || ''), 340);

              return (
                <article key={post.id} className="hub-blog-entry card">
                  <Link className="hub-blog-thumb" href={`/your-local-blog/${post.slug}`}>
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={`${post.title} cover`} />
                    ) : (
                      <span className="image-placeholder">[ Blog Cover ]</span>
                    )}
                  </Link>
                  <h4>
                    <Link href={`/your-local-blog/${post.slug}`}>{post.title}</Link>
                  </h4>
                  <p className="meta">{formatDate(post.published_at)}</p>
                  <p>{preview || 'No preview text available yet.'}</p>
                  <div className="actions">
                    <Link className="hub-blog-read" href={`/your-local-blog/${post.slug}`}>
                      Read full post
                    </Link>
                    <SharePostLinkButton path={`/your-local-blog/${post.slug}`} title={post.title} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="meta">No posts yet.</p>
        )}
      </section>
    </>
  );
}
