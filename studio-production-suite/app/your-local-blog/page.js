import { permanentRedirect } from 'next/navigation';

export default function YourLocalBlogAliasPage() {
  permanentRedirect('/blog');
}
