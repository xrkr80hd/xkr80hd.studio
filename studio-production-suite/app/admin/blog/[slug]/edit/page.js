import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import AdminBlogCrudForm from '../../../../../components/AdminBlogCrudForm';
import { ADMIN_SESSION_USER_COOKIE } from '../../../../../lib/admin-auth';
import { getPostBySlugForAdminByUser } from '../../../../../lib/content';

export const metadata = {
  title: 'Edit Blog Post | Admin',
};

export default async function AdminEditBlogPostPage({ params }) {
  const actingUser = cookies().get(ADMIN_SESSION_USER_COOKIE)?.value || '';
  const post = await getPostBySlugForAdminByUser(params.slug, actingUser);
  if (!post) {
    notFound();
  }

  return (
    <>
      <section className="card hero">
        <h1>Edit Blog Post</h1>
        <p>Update content and publish settings from admin.</p>
      </section>
      <AdminBlogCrudForm mode="edit" initialPost={post} />
    </>
  );
}
