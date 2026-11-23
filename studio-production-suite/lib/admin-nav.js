// One source of truth for admin links, shared by the dashboard sections and the top bar menu.
export const ADMIN_GROUPS = [
  {
    key: 'special',
    title: 'Special Pages',
    note: 'Progress, Lets Gleaux',
    items: [
      { href: '/admin/progress', label: "Ashley's Progress", detail: 'Post updates and photos, invite family.', owner: true },
      { href: '/admin/gleaux', label: 'Lets Gleaux', detail: 'Player, free download, and counters.', owner: true },
    ],
  },
  {
    key: 'music',
    title: 'Music & Media',
    note: 'Bands, Podcasts, Tracks, Videos',
    items: [
      { href: '/admin/bands', label: 'Bands', detail: 'Bands, members, and their tracks.' },
      { href: '/admin/podcasts', label: 'Podcasts', detail: 'Podcast profiles and episodes.' },
      { href: '/admin/tracks', label: 'Hub Tracks', detail: 'Your own tracks for the Hub player.', owner: true },
    ],
  },
  {
    key: 'content',
    title: 'Site Content',
    note: 'Blog, Homepage, Businesses, Submissions',
    items: [
      { href: '/admin/blog', label: 'Blog', detail: 'Write and publish posts.', editor: true },
      { href: '/admin/home', label: 'Homepage', detail: 'Profile, welcome message, card photos.', owner: true },
      { href: '/admin/business', label: 'Businesses', detail: 'Local business cards and links.' },
      { href: '/admin/submissions', label: 'Submissions', detail: 'What people sent in from the site.', owner: true },
    ],
  },
  {
    key: 'settings',
    title: 'Settings & Help',
    note: 'Accounts, Password, Guide',
    items: [
      { href: '/admin/users', label: 'Admin Accounts', detail: 'Who can sign in to admin.', owner: true },
      { href: '/admin/password', label: 'My Password', detail: 'Change your login password.', editor: true },
      { href: '/admin/guide', label: 'Image Size Guide', detail: 'Upload sizes and media rules.' },
      { href: '/hub', label: 'XRKR80HD Hub', detail: 'Your private hub page.', owner: true, menuOnly: true },
    ],
  },
];

// Owner sees everything; blog editors only see items marked editor.
export function getAdminGroups(ownerMode) {
  return ADMIN_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => ownerMode || item.editor),
  })).filter((group) => group.items.length);
}

export function getAdminGroup(key) {
  return ADMIN_GROUPS.find((group) => group.key === key);
}
