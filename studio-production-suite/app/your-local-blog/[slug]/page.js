import { permanentRedirect } from 'next/navigation';

export default function YourLocalBlogPostAliasPage({ params }) {
  permanentRedirect(`/blog/${encodeURIComponent(params.slug)}`);
}
