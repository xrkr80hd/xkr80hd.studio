import Link from 'next/link';
import SharePostLinkButton from '../../components/SharePostLinkButton';
import { getPublishedPosts } from '../../lib/content';
import { formatDate } from '../../lib/format';

export default async function YourLocalBlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">Stories and Updates</span>
        <h1>
          <span className="hero-accent">YourLocal</span> Blog
        </h1>
        <p>News, stories, and updates from the artists, businesses, and creators around your local scene.</p>
        <div className="actions">
          <Link className="button" href="/local-legends-archive">
            YourLocal Legends
          </Link>
          <Link className="button" href="/your-local-scene">
            YourLocal Scene
          </Link>
          <Link className="button" href="/your-local-artists">
            YourLocal Artists
          </Link>
          <Link className="button primary" href="/your-local-blog">
            YourLocal Blog
          </Link>
          <Link className="button" href="/podcast">
            YourLocal Podcast
          </Link>
          <Link className="button" href="/your-local-business">
            YourLocal Business
          </Link>
        </div>
      </section>

      <section className="stack-grid section-space">
        {posts.length ? (
          posts.map((post) => (
            <article key={post.id} className="card">
              <Link className="blog-card-thumb" href={`/your-local-blog/${post.slug}`}>
                {post.cover_image_url ? <img src={post.cover_image_url} alt={`${post.title} cover`} /> : <span className="image-placeholder">[ Blog Cover ]</span>}
              </Link>
              <h3 className="section-title">
                <Link href={`/your-local-blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="meta">{formatDate(post.published_at)}</p>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
              <div className="actions">
                <Link className="button" href={`/your-local-blog/${post.slug}`}>
                  Read Post
                </Link>
                <SharePostLinkButton path={`/your-local-blog/${post.slug}`} title={post.title} />
              </div>
            </article>
          ))
        ) : (
          <article className="card">
            <p className="meta">No published posts yet.</p>
          </article>
        )}
      </section>
    </>
  );
}
