import Link from 'next/link';
import YourLocalHeroNav from '../../components/YourLocalHeroNav';
import { getPublishedBlogChannels } from '../../lib/content';

export default async function YourLocalBlogPage() {
  const channels = await getPublishedBlogChannels();

  return (
    <>
      <YourLocalHeroNav activeKey="blog" />

      {channels.length ? (
        <section className="card section-space blog-channel-section">
          <h2 className="section-title">Blog Channels</h2>
          <div className="home-page-flow blog-channel-home-flow">
            {channels.map((channel) => {
              const mediaStyle = channel.card_image_url ? { backgroundImage: `url('${channel.card_image_url}')` } : undefined;
              return (
                <article key={channel.channel_slug} className="home-feature blog-channel-home-card">
                  <div className={`home-feature-media blog-channel-home-media ${channel.card_image_url ? '' : 'blog-channel-home-media-fallback'}`.trim()} style={mediaStyle}>
                    {!channel.card_image_url ? <span>{channel.channel_name}</span> : null}
                  </div>

                  <div className="home-feature-copy blog-channel-home-copy">
                    <p className="blog-channel-blogger">@{channel.author_username}</p>
                    <h4 className="blog-channel-title">{channel.channel_name}</h4>
                    <p className="blog-channel-description">
                      {channel.count} post{channel.count === 1 ? '' : 's'} published in this channel.
                    </p>
                    <div className="actions blog-channel-actions">
                      <Link className="button" href={`/your-local-blog/channel/${encodeURIComponent(channel.channel_slug)}`} prefetch={false}>
                        Open Channel
                      </Link>
                      <Link className="button" href={`/your-local-blog/${channel.latest_slug}`} prefetch={false}>
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
