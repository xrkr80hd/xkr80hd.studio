import Link from 'next/link';
import { notFound } from 'next/navigation';
import SharePostLinkButton from '../../../../components/SharePostLinkButton';
import { getPublishedBlogChannelFeed } from '../../../../lib/content';
import AutoFitChannelTitle from './AutoFitChannelTitle';

export default async function BlogChannelPage({ params }) {
  const feed = await getPublishedBlogChannelFeed(params.slug);
  if (!feed) {
    notFound();
  }

  const { channel, posts } = feed;

  return (
    <>
      <nav className="blog-breadcrumbs blog-channel-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/blog" prefetch={false} aria-label="Back to Blog Channels">
          ← Back to Blog Channels
        </Link>
      </nav>

      <section className="card blog-channel-top-bar">
        <div className="blog-channel-public-identity">
          <AutoFitChannelTitle title={channel.channel_name} />
        </div>
      </section>

      <section className="card hero band-hero blog-channel-hero">
        {channel.card_image_url ? (
          <img
            className="blog-channel-hero-image"
            src={channel.card_image_url}
            alt={`${channel.channel_name} cover`}
          />
        ) : null}
        {channel.avatar_url ? (
          <img
            className="blog-channel-profile-image"
            src={channel.avatar_url}
            alt={`${channel.channel_name} profile`}
          />
        ) : null}
      </section>

      <section className="blog-channel-post-flow section-space">
        {posts.length ? (
          posts.map((post) => (
            <article key={post.id} className="blog-channel-post-row">
              <Link
                className={`blog-channel-post-media ${post.cover_image_url ? '' : 'blog-channel-post-media-fallback'}`.trim()}
                href={`/blog/${post.slug}`}
                style={post.cover_image_url ? { backgroundImage: `url('${post.cover_image_url}')` } : undefined}
                prefetch={false}
              >
                {!post.cover_image_url ? <span className="blog-channel-post-fallback-text">No Cover Image</span> : null}
              </Link>

              <div className="blog-channel-post-copy">
                <p className="blog-channel-post-kicker">{channel.channel_name}</p>
                <h4>
                  <Link href={`/blog/${post.slug}`} prefetch={false}>{post.title}</Link>
                </h4>
                <p>{post.excerpt || 'Open the post to read the full write-up and latest updates.'}</p>
                <div className="actions blog-channel-post-actions">
                  <Link className="button" href={`/blog/${post.slug}`} prefetch={false}>
                    Open Post
                  </Link>
                  <SharePostLinkButton path={`/blog/${post.slug}`} title={post.title} />
                </div>
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
