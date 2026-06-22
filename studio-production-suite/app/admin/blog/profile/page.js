import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Edit Blog Profile | Admin',
};

export const dynamic = 'force-dynamic';

export default function AdminBlogProfilePage() {
  redirect('/admin/blog');
}
