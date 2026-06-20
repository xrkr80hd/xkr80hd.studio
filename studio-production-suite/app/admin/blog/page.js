import { cookies } from 'next/headers';
import Link from 'next/link';
import { ADMIN_SESSION_USER_COOKIE, isOwnerUsername } from '../../../lib/admin-auth';
import { getPostsForAdminByUser } from '../../../lib/content';
import { formatDate } from '../../../lib/format';

export const metadata = {
  title: 'Blog Manager | Admin',
};
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const ownerMode = isOwnerUsername(actingUser);
  const posts = await getPostsForAdminByUser(actingUser);

  return (
    <>
      <section className="card hero">
        <h1>Blog Manager</h1>
        <p>{ownerMode ? 'Write, edit, and publish posts for xrkr80hd.studio from admin.' : 'Manage only your own blog posts and share your links.'}</p>
        <div className="actions">
          <Link className="button primary" href="/admin/blog/new" prefetch={false}>
            New Blog Post
          </Link>
          <Link className="button" href="/blog" prefetch={false}>
            View Public Blog
          </Link>
        </div>
      </section>

      <section className="section-space">
        {posts.length ? (
          <div className="grid">
            {posts.map((post) => (
              <article key={post.id} className="card">
                <h3 className="section-title">{post.title}</h3>
                <p className="meta">
                  {post.is_published ? 'Published' : 'Draft'} {post.published_at ? `| ${formatDate(post.published_at)}` : ''}
                </p>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
                <div className="actions">
                  <Link className="button primary" href={`/admin/blog/${post.slug}/edit`} prefetch={false}>
                    Edit Post
                  </Link>
                  <Link className="button" href={`/blog/${post.slug}`} prefetch={false}>
                    View Post
                  </Link>
                  <Link className="button" href={`/your-local-blog/${post.slug}`} prefetch={false}>
                    Share Link
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="card">
            <p className="meta">No blog posts yet.</p>
          </article>
        )}
      </section>
    </>
  );
}
