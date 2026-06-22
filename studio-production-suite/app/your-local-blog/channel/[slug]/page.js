import { permanentRedirect } from 'next/navigation';

export default function YourLocalBlogChannelAliasPage({ params }) {
  permanentRedirect(`/blog/channel/${encodeURIComponent(params.slug)}`);
}
