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
          <div className="blog-channel-flow">
            {channels.map((channel) => {
              return (
                <article key={channel.channel_slug} className="blog-channel-feature">
                  <div className="blog-channel-feature-media-wrap">
                    {channel.card_image_url ? (
                      <img className="blog-channel-feature-media" src={channel.card_image_url} alt={`${channel.channel_name} channel graphic`} />
                    ) : (
                      <div className="blog-channel-feature-media blog-channel-feature-media-fallback" aria-hidden="true">
                        {channel.channel_name}
                      </div>
                    )}
                  </div>

                  <div className="blog-channel-feature-copy">
                    <p className="blog-channel-blogger">@{channel.author_username}</p>
                    <h3 className="blog-channel-title">{channel.channel_name}</h3>
                    <p className="meta">{channel.count} post{channel.count === 1 ? '' : 's'}</p>
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
