import Link from 'next/link';
import { getPublishedPosts } from '../../lib/content';

function normalizeAuthor(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 48);
}

export default async function BlogPage({ searchParams }) {
  const posts = await getPublishedPosts();
  const selectedAuthor = normalizeAuthor(searchParams?.author);

  const channelMap = new Map();
  for (const post of posts) {
    const author = normalizeAuthor(post.author_username);
    if (!author) {
      continue;
    }

    const existing = channelMap.get(author) || { author, count: 0, latestSlug: post.slug };
    existing.count += 1;
    if (!existing.latestSlug) {
      existing.latestSlug = post.slug;
    }
    channelMap.set(author, existing);
  }

  const channels = Array.from(channelMap.values()).sort((a, b) => a.author.localeCompare(b.author));
  const visiblePosts = selectedAuthor ? posts.filter((post) => normalizeAuthor(post.author_username) === selectedAuthor) : posts;

  return (
    <>
      <section className="card hero">
        <h1>YourLocal Blog</h1>
        <p>Thoughts on music, creative process, faith, and building with purpose.</p>
      </section>

      {channels.length ? (
        <section className="card section-space blog-channel-section">
          <h2 className="section-title">Blog Channels</h2>
          <div className="blog-channel-grid">
            {channels.map((channel) => {
              const active = channel.author === selectedAuthor;
              return (
                <article key={channel.author} className={`blog-channel-card ${active ? 'is-active' : ''}`.trim()}>
                  <h3>{channel.author}.blog</h3>
                  <p className="meta">{channel.count} post{channel.count === 1 ? '' : 's'}</p>
                  <div className="actions">
                    <Link className="button" href={`/blog?author=${encodeURIComponent(channel.author)}`} prefetch={false}>
                      Open Channel
                    </Link>
                    <Link className="button" href={`/your-local-blog/${channel.latestSlug}`} prefetch={false}>
                      Latest Post
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {selectedAuthor ? (
            <div className="actions" style={{ marginTop: '0.6rem' }}>
              <Link className="button" href="/blog" prefetch={false}>
                Show All Posts
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="stack-grid section-space">
        {visiblePosts.length ? (
          visiblePosts.map((post) => (
            <article key={post.id} className="card">
              <Link className="blog-card-thumb" href={`/your-local-blog/${post.slug}`}>
                {post.cover_image_url ? <img src={post.cover_image_url} alt={`${post.title} cover`} /> : <span className="image-placeholder">[ Blog Cover ]</span>}
              </Link>
              <h3 className="section-title">
                <Link href={`/your-local-blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="meta">{post.author_username}.blog</p>
            </article>
          ))
        ) : (
          <article className="card">
            <p className="meta">No published posts for this channel yet.</p>
          </article>
        )}
      </section>
    </>
  );
}
