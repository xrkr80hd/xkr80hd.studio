import Link from 'next/link';
import PublicDirectoryControls from '../../components/PublicDirectoryControls';
import { getPublishedBlogChannels } from '../../lib/content';
import { filterAndSortPublicListings, getPublicListingCategories } from '../../lib/public-directory-listing.mjs';

export default async function BlogPage({ searchParams = {} }) {
  const channels = await getPublishedBlogChannels();
  const sort = ['az', 'za', 'category'].includes(searchParams.sort) ? searchParams.sort : 'az';
  const category = String(searchParams.category || 'all').trim() || 'all';
  const listingOptions = {
    getName: (channel) => channel.channel_name,
    getCategory: (channel) => channel.category || 'Blog Channel',
  };
  const categories = getPublicListingCategories(channels, listingOptions);
  const visibleChannels = filterAndSortPublicListings(channels, { ...listingOptions, sort, category });

  return (
    <>
      <section className="card hero">
        <h1><span className="brand-yourlocal"><span className="brand-your">Your</span><span className="brand-local">Local</span></span> Blog</h1>
        <p>Thoughts on music, creative process, faith, and building with purpose.</p>
      </section>

      {channels.length ? (
        <section className="card section-space blog-channel-section">
          <h2 className="section-title">Blog Channels</h2>
          <PublicDirectoryControls sort={sort} category={category} categories={categories} label="Sort and filter blog channels" />
          <div className="blog-channel-grid">
            {visibleChannels.length ? visibleChannels.map((channel) => {
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
                    <Link className="button" href={`/blog/channel/${encodeURIComponent(channel.channel_slug)}`} prefetch={false}>
                      Open Channel
                    </Link>
                    <Link className="button" href={`/blog/${channel.latest_slug}`} prefetch={false}>
                      Latest Post
                    </Link>
                  </div>
                </article>
              );
            }) : (
              <article className="card">
                <p className="meta">No blog channels match this category.</p>
              </article>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
