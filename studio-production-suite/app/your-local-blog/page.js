import Link from 'next/link';
import { getPublishedBlogChannels } from '../../lib/content';

export default async function YourLocalBlogPage() {
  const channels = await getPublishedBlogChannels();

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

      {channels.length ? (
        <section className="card section-space blog-channel-section">
          <h2 className="section-title">Blog Channels</h2>
          <div className="blog-channel-grid">
            {channels.map((channel) => {
              return (
                <article key={channel.channel_slug} className="blog-channel-card">
                  {channel.card_image_url ? (
                    <img className="blog-channel-card-image" src={channel.card_image_url} alt={`${channel.channel_name} channel graphic`} />
                  ) : (
                    <div className="blog-channel-card-image blog-channel-card-image-fallback" aria-hidden="true">
                      {channel.channel_name}
                    </div>
                  )}
                  <h3>{channel.channel_name}</h3>
                  <p className="meta">{channel.count} post{channel.count === 1 ? '' : 's'}</p>
                  <div className="actions">
                    <Link className="button" href={`/your-local-blog/channel/${encodeURIComponent(channel.channel_slug)}`} prefetch={false}>
                      Open Channel
                    </Link>
                    <Link className="button" href={`/your-local-blog/${channel.latest_slug}`} prefetch={false}>
                      Latest Post
                    </Link>
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
