import test from 'node:test';
import assert from 'node:assert/strict';
import { groupManagedUsers, isConfiguredManagedUsername } from '../lib/admin-user-groups.mjs';

test('keeps the owner in Existing Admin Users', () => {
  const result = groupManagedUsers({
    ownerUsername: 'xrkr80hdadmin',
    users: [{ username: 'jessie_v', display_name: 'Jessie V' }],
  });

  assert.deepEqual(result.adminUsers, [
    {
      username: 'xrkr80hdadmin',
      display_name: 'Site Owner',
      protected: true,
      category: 'Administrator',
    },
  ]);
});

test('groups database-managed accounts under Blogs', () => {
  const result = groupManagedUsers({
    ownerUsername: 'xrkr80hdadmin',
    users: [
      { username: 'jessie_v', display_name: 'Jessie V' },
      { username: 'writer_two', display_name: null },
    ],
  });

  assert.deepEqual(result.userGroups, [
    {
      key: 'blogs',
      label: 'Blogs',
      description: 'Can manage only their own blog posts and blog channel.',
      users: [
        { username: 'jessie_v', display_name: 'Jessie V', category: 'Blogs', management: 'database' },
        { username: 'writer_two', display_name: null, category: 'Blogs', management: 'database' },
      ],
    },
  ]);
});

test('includes configured non-owner logins without exposing passwords', () => {
  const result = groupManagedUsers({
    ownerUsername: 'xrkr80hdadmin',
    configuredUsernames: ['xrkr80hdadmin', 'jessie_v'],
    users: [],
  });

  assert.deepEqual(result.userGroups[0].users, [
    {
      username: 'jessie_v',
      display_name: null,
      category: 'Blogs',
      management: 'environment',
    },
  ]);
  assert.equal('password' in result.userGroups[0].users[0], false);
});

test('prefers a database record when the same configured user exists in both sources', () => {
  const result = groupManagedUsers({
    ownerUsername: 'xrkr80hdadmin',
    configuredUsernames: ['jessie_v'],
    users: [{ username: 'jessie_v', display_name: 'Jessie V' }],
  });

  assert.equal(result.userGroups[0].users.length, 1);
  assert.equal(result.userGroups[0].users[0].management, 'database');
});

test('does not duplicate the owner if returned by the database', () => {
  const result = groupManagedUsers({
    ownerUsername: 'xrkr80hdadmin',
    users: [
      { username: 'xrkr80hdadmin', display_name: 'Owner row' },
      { username: 'jessie_v', display_name: 'Jessie V' },
    ],
  });

  assert.equal(result.adminUsers.length, 1);
  assert.deepEqual(result.userGroups[0].users.map((user) => user.username), ['jessie_v']);
});

test('detects an existing environment-managed username case-insensitively', () => {
  assert.equal(isConfiguredManagedUsername('Jessie_V', ['xrkr80hdadmin', 'jessie_v']), true);
  assert.equal(isConfiguredManagedUsername('new_writer', ['xrkr80hdadmin', 'jessie_v']), false);
});
