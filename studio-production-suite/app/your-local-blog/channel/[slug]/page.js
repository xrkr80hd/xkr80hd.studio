import Link from 'next/link';
import { notFound } from 'next/navigation';
import SharePostLinkButton from '../../../../components/SharePostLinkButton';
import { getPublishedBlogChannelFeed } from '../../../../lib/content';

export default async function BlogChannelPage({ params }) {
  const feed = await getPublishedBlogChannelFeed(params.slug);
  if (!feed) {
    notFound();
  }

  const { channel, posts } = feed;

  return (
    <>
      <section className="card hero band-hero">
        <span className="tag-badge">Channel Feed</span>
        <h1>{channel.channel_name}</h1>
        <p>Posts published to this dedicated blog channel.</p>
        <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/your-local-blog">YourLocal Blog</Link>
          <span aria-hidden="true">/</span>
          <span>{channel.channel_name}</span>
        </nav>
        <div className="blog-back-wrap">
          <Link className="button blog-back-button" href="/your-local-blog" prefetch={false}>
            Back to Blog Channels
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
              <div className="actions">
                <Link className="button" href={`/your-local-blog/${post.slug}`} prefetch={false}>
                  Open Post
                </Link>
                <SharePostLinkButton path={`/your-local-blog/${post.slug}`} title={post.title} />
              </div>
            </article>
          ))
        ) : (
          <article className="card">
            <p className="meta">No published posts in this channel yet.</p>
          </article>
        )}
      </section>
    </>
  );
}
