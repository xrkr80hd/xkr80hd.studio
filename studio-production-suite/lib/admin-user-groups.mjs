export const MANAGED_USER_CATEGORIES = [
  {
    key: 'blogs',
    label: 'Blogs',
    description: 'Can manage only their own blog posts and blog channel.',
  },
];

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function isConfiguredManagedUsername(username, configuredUsernames = []) {
  const safeUsername = normalizeUsername(username);
  return Boolean(safeUsername) && configuredUsernames.some((candidate) => normalizeUsername(candidate) === safeUsername);
}

export function groupManagedUsers({ ownerUsername, users = [], configuredUsernames = [] }) {
  const safeOwner = normalizeUsername(ownerUsername);
  const databaseUsers = users
    .filter((user) => normalizeUsername(user?.username) && normalizeUsername(user?.username) !== safeOwner)
    .map((user) => ({
      ...user,
      username: normalizeUsername(user.username),
      category: 'Blogs',
      management: 'database',
    }));
  const databaseUsernames = new Set(databaseUsers.map((user) => user.username));
  const environmentUsers = configuredUsernames
    .map(normalizeUsername)
    .filter((username) => username && username !== safeOwner && !databaseUsernames.has(username))
    .map((username) => ({
      username,
      display_name: null,
      category: 'Blogs',
      management: 'environment',
    }));
  const blogUsers = [...databaseUsers, ...environmentUsers].sort((a, b) => a.username.localeCompare(b.username));

  return {
    adminUsers: safeOwner
      ? [
          {
            username: safeOwner,
            display_name: 'Site Owner',
            protected: true,
            category: 'Administrator',
          },
        ]
      : [],
    userGroups: MANAGED_USER_CATEGORIES.map((category) => ({
      ...category,
      users: category.key === 'blogs' ? blogUsers : [],
    })),
  };
}
