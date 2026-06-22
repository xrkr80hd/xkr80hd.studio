import { cookies } from 'next/headers';
import Link from 'next/link';
import AdminBlogChannelSettings from '../../../components/AdminBlogChannelSettings';
import { ADMIN_SESSION_USER_COOKIE } from '../../../lib/admin-auth';
import { getPostsForAdminByUser } from '../../../lib/content';
import { formatDate } from '../../../lib/format';

export const metadata = {
  title: 'Blog Manager | Admin',
};
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const posts = await getPostsForAdminByUser(actingUser);
  const draftCount = posts.filter((post) => !post.is_published).length;
  const publishedCount = posts.filter((post) => post.is_published).length;

  return (
    <>
      <section className="card hero">
        <h1>Blog Manager</h1>
        <p>Write, edit, and publish posts for your own blog channel from admin.</p>
      </section>

      <section className="section-space">
        <>
          <article className="card section-space">
            <AdminBlogChannelSettings draftCount={draftCount} publishedCount={publishedCount} />
          </article>

          <article className="card section-space admin-blog-posts-shell" style={{ marginTop: '1rem' }}>
            <h2 className="section-title" style={{ marginBottom: '0.7rem' }}>
              <span className="brand-yourlocal"><span className="brand-your">Your</span><span className="brand-local">Local</span></span>{' '}
              <span className="brand-blog">Blog</span>{' '}
              <span>Posts</span>
            </h2>
            {posts.length ? (
              <div className="admin-blog-posts-scroll">
                {posts.map((post) => (
                  <article key={post.id} className="admin-blog-post-row">
                    <div
                      className={`admin-blog-post-thumb ${post.cover_image_url ? '' : 'is-empty'}`.trim()}
                      style={post.cover_image_url ? { backgroundImage: `url('${post.cover_image_url}')` } : undefined}
                    >
                      {!post.cover_image_url ? <span>Blog Post Picture</span> : null}
                    </div>
                    <div className="admin-blog-post-preview">
                      <h3 className="section-title">{post.title}</h3>
                      <p className="meta">
                        {post.is_published ? 'Published' : 'Draft'} {post.published_at ? `| ${formatDate(post.published_at)}` : ''}
                      </p>
                      <p>{post.excerpt || 'No preview yet. Add a short excerpt so readers know what this post is about.'}</p>
                      <div className="actions">
                        <Link className="button primary" href={`/admin/blog/${post.slug}/edit`} prefetch={false}>
                          Edit Post
                        </Link>
                        <Link className="button" href={`/blog/${post.slug}`} prefetch={false}>
                          View Post
                        </Link>
                        <Link className="button" href={`/blog/${post.slug}`} prefetch={false}>
                          Share Link
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="meta">No posts yet. Write your first one!</p>
            )}
          </article>
        </>
      </section>
    </>
  );
}
