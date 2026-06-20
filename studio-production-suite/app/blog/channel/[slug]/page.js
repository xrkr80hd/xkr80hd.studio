import { redirect } from 'next/navigation';

export default function BlogChannelAliasPage({ params }) {
  redirect(`/your-local-blog/channel/${encodeURIComponent(params.slug)}`);
}
