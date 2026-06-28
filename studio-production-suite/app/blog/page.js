import Link from 'next/link';
import { getPublishedBlogChannels } from '../../lib/content';

export default async function BlogPage() {
  const channels = await getPublishedBlogChannels();

  return (
    <>
      <section className="card hero">
        <h1><span className="brand-yourlocal"><span className="brand-your">Your</span><span className="brand-local">Local</span></span> Blog</h1>
        <p>Thoughts on music, creative process, faith, and building with purpose.</p>
      </section>

      {channels.length ? (
        <section className="card section-space blog-channel-section">
          <h2 className="section-title">Blog Channels</h2>
          <div className="blog-channel-grid">
            {channels.map((channel) => {
              return (
                <article key={channel.channel_slug} className="public-listing-card public-listing-card--wide blog-channel-card">
                  <div className="public-listing-card-media blog-channel-card-media">
                    {channel.card_image_url ? (
                      <img className="blog-channel-card-image" src={channel.card_image_url} alt={`${channel.channel_name} channel graphic`} />
                    ) : (
                      <div className="blog-channel-card-image blog-channel-card-image-fallback" aria-hidden="true">
                        {channel.channel_name}
                      </div>
                    )}
                  </div>
                  <div className="public-listing-card-content blog-channel-card-content">
                    <h3>{channel.channel_name}</h3>
                    <p className="meta">{channel.count} post{channel.count === 1 ? '' : 's'}</p>
                    <div className="actions">
                      <Link className="button" href={`/blog/channel/${encodeURIComponent(channel.channel_slug)}`} prefetch={false}>
                        Open Channel
                      </Link>
                      <Link className="button" href={`/blog/${channel.latest_slug}`} prefetch={false}>
                        Latest Post
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
