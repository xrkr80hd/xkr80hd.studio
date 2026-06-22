import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultBlogChannel,
  provisionBlogChannel,
} from '../lib/blog-channel-provisioning.mjs';

test('builds Jessie a reusable default blogger channel', () => {
  assert.deepEqual(buildDefaultBlogChannel('Jessie_V'), {
    username: 'jessie_v',
    channel_name: 'jessievblog',
    channel_slug: 'jessievblog',
    blogger_bio: null,
    avatar_url: null,
    card_image_url: null,
  });
});

test('upserts one isolated channel row keyed by username', async () => {
  const calls = [];
  const expected = buildDefaultBlogChannel('jessie_v');
  const supabase = {
    from(table) {
      assert.equal(table, 'blog_channels');
      return {
        upsert(payload, options) {
          calls.push({ payload, options });
          return {
            select() {
              return {
                limit() {
                  return {
                    async maybeSingle() {
                      return { data: { id: 7, ...payload }, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await provisionBlogChannel('jessie_v', { supabase });

  assert.equal(result.ok, true);
  assert.deepEqual(result.channel, { id: 7, ...expected });
  assert.deepEqual(calls, [{
    payload: expected,
    options: { onConflict: 'username', ignoreDuplicates: true },
  }]);
});

test('reports the missing shared table clearly', async () => {
  const supabase = {
    from() {
      return {
        upsert() {
          return {
            select() {
              return {
                limit() {
                  return {
                    async maybeSingle() {
                      return {
                        data: null,
                        error: {
                          message: "Could not find the table 'public.blog_channels' in the schema cache",
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await provisionBlogChannel('jessie_v', { supabase });

  assert.equal(result.ok, false);
  assert.equal(result.missingTable, true);
});
