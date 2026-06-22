import { unstable_noStore as noStore } from 'next/cache';
import { getAdminOwnerUsername, isOwnerUsername } from './admin-auth';
import { parseBandProfilePayload } from './band-profile';
import { normalizeBlogChannelName, toBlogChannelSlug } from './blog-channels';
import { normalizeMediaPayload } from './media-url';
import { getSupabaseAdmin } from './supabase-admin';

const DEFAULT_GENRES = [
  'metal',
  'rock',
  'christian',
  'covers',
  'orchestral/soundtrack',
  'indie',
  'djent',
  'gospel',
  'country',
  'hip-hop',
  'other',
];

const BLOG_CHANNEL_DEFAULT_CARD_IMAGE = '/assets/cards/local-blog.png';
const OWNER_BLOG_CHANNEL_COVER_IMAGE = '/assets/blog/xrkr80hdblog.png';

async function runQuery(label, callback, fallbackValue) {
  noStore();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return fallbackValue;
  }

  try {
    const response = await callback(supabase);

    if (response.error) {
      const message = response.error.message || '';
      if (!message.includes("Could not find the table")) {
        console.error(`[content:${label}]`, message);
      }
      return fallbackValue;
    }

    return normalizeMediaPayload(response.data ?? fallbackValue);
  } catch (error) {
    console.error(`[content:${label}]`, error);
    return fallbackValue;
  }
}

export async function getSiteProfile() {
  const rows = await runQuery(
    'site_profiles',
    (supabase) => supabase.from('site_profiles').select('*').order('id', { ascending: true }).limit(1),
    []
  );

  return rows[0] || null;
}

async function fetchTracksOrdered({ featuredOnly = false, limit = null } = {}) {
  noStore();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const run = (includeSortOrder) => {
    let query = supabase.from('tracks').select('*');

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    if (includeSortOrder) {
      query = query.order('sort_order', { ascending: true });
    }

    query = query.order('release_date', { ascending: false, nullsFirst: false }).order('id', { ascending: false });

    return Number.isInteger(limit) ? query.limit(limit) : query;
  };

  try {
    const ordered = await run(true);
    if (!ordered.error) {
      return normalizeMediaPayload(ordered.data || []);
    }

    const message = String(ordered.error.message || '');
    if (!message.includes('sort_order')) {
      console.error('[content:tracks_ordered]', message);
      return [];
    }

    const fallback = await run(false);
    if (fallback.error) {
      console.error('[content:tracks_fallback]', fallback.error.message);
      return [];
    }

    return normalizeMediaPayload((fallback.data || []).map((item) => ({ ...item, sort_order: 0 })));
  } catch (error) {
    console.error('[content:tracks]', error);
    return [];
  }
}

export async function getHomeTracks(limit = 12) {
  noStore();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const safeLimit = Number.isInteger(limit) ? limit : null;

  try {
    const bandTracks = await supabase
      .from('band_tracks')
      .select('id, band_id, title, description, audio_url, cover_image_url, sort_order, created_at, is_published, include_in_radio')
      .eq('is_published', true)
      .eq('include_in_radio', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    const bandItems = bandTracks.error ? [] : bandTracks.data || [];
    if (bandTracks.error && !String(bandTracks.error.message || '').includes('Could not find the table')) {
      console.error('[content:band_radio_tracks]', bandTracks.error.message);
    }

    let bandMap = new Map();
    if (bandItems.length) {
      const ids = Array.from(new Set(bandItems.map((item) => Number(item.band_id)).filter((id) => Number.isFinite(id))));
      if (ids.length) {
        const bands = await supabase.from('bands').select('id, name, slug, is_published').in('id', ids);
        if (bands.error) {
          console.error('[content:band_radio_band_lookup]', bands.error.message);
        } else {
          bandMap = new Map((bands.data || []).map((item) => [Number(item.id), item]));
        }
      }
    }

    const mappedBandTracks = bandItems
      .map((item) => {
        const band = bandMap.get(Number(item.band_id));
        if (!band || band.is_published === false) {
          return null;
        }
        return {
          id: `band-${item.id}`,
          title: item.title,
          artist_name: band.name || 'Local Band',
          description: item.description || null,
          audio_url: item.audio_url,
          cover_image_url: item.cover_image_url || null,
          release_date: item.created_at || null,
          sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
          source_type: 'band',
          source_slug: band.slug || null,
        };
      })
      .filter(Boolean);

    let mappedPodcastTracks = [];
    const episodes = await supabase
      .from('podcast_episodes')
      .select('id, podcast_id, title, summary, description, audio_url, cover_image_url, published_at, sort_order, is_published, include_in_radio')
      .eq('is_published', true)
      .eq('include_in_radio', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false });

    let episodeItems = [];
    if (!episodes.error) {
      episodeItems = episodes.data || [];
    } else {
      const message = String(episodes.error.message || '');
      if (message.includes('include_in_radio')) {
        const fallbackEpisodes = await supabase
          .from('podcast_episodes')
          .select('id, podcast_id, title, summary, description, audio_url, cover_image_url, published_at, sort_order, is_published')
          .eq('is_published', true)
          .order('sort_order', { ascending: true })
          .order('published_at', { ascending: false, nullsFirst: false });

        if (fallbackEpisodes.error) {
          console.error('[content:podcast_radio_tracks_fallback]', fallbackEpisodes.error.message);
        } else {
          episodeItems = fallbackEpisodes.data || [];
        }
      } else if (!message.includes('Could not find the table')) {
        console.error('[content:podcast_radio_tracks]', message);
      }
    }

    if (episodeItems.length) {
      const ids = Array.from(new Set(episodeItems.map((item) => Number(item.podcast_id)).filter((id) => Number.isFinite(id))));
      let podcastMap = new Map();
      if (ids.length) {
        const podcasts = await supabase.from('podcasts').select('id, title, slug, is_published').in('id', ids);
        if (podcasts.error) {
          console.error('[content:podcast_radio_lookup]', podcasts.error.message);
        } else {
          podcastMap = new Map((podcasts.data || []).map((item) => [Number(item.id), item]));
        }
      }

      mappedPodcastTracks = episodeItems
        .map((item) => {
          const podcast = podcastMap.get(Number(item.podcast_id));
          if (!podcast || podcast.is_published === false) {
            return null;
          }
          return {
            id: `podcast-${item.id}`,
            title: item.title,
            artist_name: podcast.title || 'Podcast',
            description: item.summary || item.description || null,
            audio_url: item.audio_url,
            cover_image_url: item.cover_image_url || null,
            release_date: item.published_at || null,
            sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
            source_type: 'podcast',
            source_slug: podcast.slug || null,
          };
        })
        .filter(Boolean);
    }

    const combined = [...mappedBandTracks, ...mappedPodcastTracks];
    combined.sort((a, b) => {
      const orderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : 0;
      const orderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const dateA = String(a.release_date || '');
      const dateB = String(b.release_date || '');
      return dateB.localeCompare(dateA);
    });

    if (!combined.length) {
      const legacy = await fetchTracksOrdered({ featuredOnly: true, limit: safeLimit });
      return normalizeMediaPayload(legacy.map((item) => ({
        ...item,
        source_type: 'legacy',
      })));
    }

    if (safeLimit === null) {
      return normalizeMediaPayload(combined);
    }

    return normalizeMediaPayload(combined.slice(0, Math.max(0, safeLimit)));
  } catch (error) {
    console.error('[content:radio_pool]', error);
    return [];
  }
}

export async function getTracks(limit = null) {
  return fetchTracksOrdered({ featuredOnly: false, limit });
}

export async function getTracksForAdmin() {
  return fetchTracksOrdered({ featuredOnly: false, limit: null });
}

export async function getBandsByEra(era) {
  return runQuery(
    `bands_${era}`,
    (supabase) =>
      supabase
        .from('bands')
        .select('*')
        .eq('era', era)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    []
  );
}

function collectArtistGalleryImages(artist, members) {
  const imageSet = new Set();

  const pushImage = (value) => {
    const safe = String(value || '').trim();
    if (safe) {
      imageSet.add(safe);
    }
  };

  pushImage(artist?.band_photo_url);
  pushImage(artist?.image_url);
  pushImage(artist?.banner_image_url);

  if (Array.isArray(members)) {
    for (const member of members) {
      pushImage(member?.image_url);
    }
  }

  return Array.from(imageSet);
}

export async function getPublishedArtists() {
  const artists = await runQuery(
    'artists_published',
    (supabase) =>
      supabase
        .from('bands')
        .select('*')
        .eq('is_solo_artist', true)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    []
  );

  return artists.map((artist) => {
    const profile = parseBandProfilePayload(artist.members_json);
    return {
      ...artist,
      members: profile.members,
      gallery_images: collectArtistGalleryImages(artist, profile.members),
    };
  });
}

export async function getBandBySlug(slug) {
  const band = await runQuery(
    `band_${slug}`,
    (supabase) =>
      supabase
        .from('bands')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle(),
    null
  );

  if (!band) {
    return null;
  }

  const profile = parseBandProfilePayload(band.members_json);
  const tracks = await fetchBandTracksByBandId(band.id, { publishedOnly: true });
  const genres = Array.isArray(band.genres_json)
    ? band.genres_json.map((item) => String(item || '').trim()).filter(Boolean)
    : String(band.genre || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    ...band,
    genres,
    members: profile.members,
    social_links: profile.social_links,
    tracks,
  };
}

export async function getCurrentBandsForAdmin() {
  return runQuery(
    'admin_bands_scene',
    (supabase) =>
      supabase
        .from('bands')
        .select('*')
        .eq('era', 'scene')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    []
  );
}

export async function getBandsForAdmin(era = null) {
  const safeEra = era === 'archive' || era === 'scene' ? era : null;
  return runQuery(
    `admin_bands_${safeEra || 'all'}`,
    (supabase) => {
      const query = supabase
        .from('bands')
        .select('*')
        .order('era', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      return safeEra ? query.eq('era', safeEra) : query;
    },
    []
  );
}

export async function getBandBySlugForAdmin(slug) {
  const band = await runQuery(
    `admin_band_${slug}`,
    (supabase) =>
      supabase
        .from('bands')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle(),
    null
  );

  if (!band) {
    return null;
  }

  const profile = parseBandProfilePayload(band.members_json);
  const tracks = await fetchBandTracksByBandId(band.id, { publishedOnly: false });
  const genres = Array.isArray(band.genres_json)
    ? band.genres_json.map((item) => String(item || '').trim()).filter(Boolean)
    : String(band.genre || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    ...band,
    genres,
    members: profile.members,
    social_links: profile.social_links,
    tracks,
  };
}

async function fetchBandTracksByBandId(bandId, { publishedOnly = false } = {}) {
  noStore();
  const safeBandId = Number.parseInt(String(bandId || ''), 10);
  if (!Number.isFinite(safeBandId) || safeBandId <= 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const run = (includeSortOrder) => {
    let query = supabase.from('band_tracks').select('*').eq('band_id', safeBandId);
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    if (includeSortOrder) {
      query = query.order('sort_order', { ascending: true });
    }
    return query.order('created_at', { ascending: false });
  };

  try {
    const ordered = await run(true);
    if (!ordered.error) {
      return normalizeMediaPayload(ordered.data || []);
    }

    const message = String(ordered.error.message || '');
    if (!message.includes('sort_order')) {
      if (!message.includes('Could not find the table')) {
        console.error('[content:band_tracks]', message);
      }
      return [];
    }

    const fallback = await run(false);
    if (fallback.error) {
      console.error('[content:band_tracks_fallback]', fallback.error.message);
      return [];
    }

    return normalizeMediaPayload((fallback.data || []).map((item) => ({ ...item, sort_order: 0 })));
  } catch (error) {
    console.error('[content:band_tracks_error]', error);
    return [];
  }
}

async function fetchPodcasts({ publishedOnly = false } = {}) {
  noStore();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const run = (includeSortOrder) => {
    let query = supabase.from('podcasts').select('*');
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    if (includeSortOrder) {
      query = query.order('sort_order', { ascending: true });
    }
    return query.order('title', { ascending: true });
  };

  try {
    const ordered = await run(true);
    if (!ordered.error) {
      return normalizeMediaPayload(ordered.data || []);
    }

    const message = String(ordered.error.message || '');
    if (!message.includes('sort_order')) {
      if (!message.includes('Could not find the table')) {
        console.error('[content:podcasts]', message);
      }
      return [];
    }

    const fallback = await run(false);
    if (fallback.error) {
      console.error('[content:podcasts_fallback]', fallback.error.message);
      return [];
    }

    return normalizeMediaPayload((fallback.data || []).map((item) => ({ ...item, sort_order: 0 })));
  } catch (error) {
    console.error('[content:podcasts_error]', error);
    return [];
  }
}

async function fetchPodcastEpisodesByPodcastId(podcastId, { publishedOnly = false, limit = null } = {}) {
  noStore();
  const safeId = Number.parseInt(String(podcastId || ''), 10);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const run = (includeSortOrder) => {
    let query = supabase.from('podcast_episodes').select('*').eq('podcast_id', safeId);
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    if (includeSortOrder) {
      query = query.order('sort_order', { ascending: true });
    }
    query = query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    return Number.isInteger(limit) ? query.limit(limit) : query;
  };

  try {
    const ordered = await run(true);
    if (!ordered.error) {
      return normalizeMediaPayload(ordered.data || []);
    }

    const message = String(ordered.error.message || '');
    if (!message.includes('sort_order')) {
      if (!message.includes('Could not find the table')) {
        console.error('[content:podcast_episodes]', message);
      }
      return [];
    }

    const fallback = await run(false);
    if (fallback.error) {
      console.error('[content:podcast_episodes_fallback]', fallback.error.message);
      return [];
    }

    return normalizeMediaPayload((fallback.data || []).map((item) => ({ ...item, sort_order: 0 })));
  } catch (error) {
    console.error('[content:podcast_episodes_error]', error);
    return [];
  }
}

export async function getPublishedPodcasts() {
  return fetchPodcasts({ publishedOnly: true });
}

export async function getPodcastsForAdmin() {
  return fetchPodcasts({ publishedOnly: false });
}

export async function getPodcastBySlugForAdmin(slug) {
  return runQuery(
    `podcast_show_admin_${slug}`,
    (supabase) =>
      supabase
        .from('podcasts')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle(),
    null
  );
}

export async function getPublishedPodcastBySlug(slug) {
  return runQuery(
    `podcast_show_public_${slug}`,
    (supabase) =>
      supabase
        .from('podcasts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle(),
    null
  );
}

export async function getPodcastEpisodesForPodcast(podcastId, limit = null) {
  return fetchPodcastEpisodesByPodcastId(podcastId, { publishedOnly: true, limit });
}

export async function getPodcastEpisodesForPodcastAdmin(podcastId) {
  return fetchPodcastEpisodesByPodcastId(podcastId, { publishedOnly: false, limit: null });
}

async function fetchLocalBusinesses({ publishedOnly = false } = {}) {
  noStore();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const run = (includeSortOrder) => {
    let query = supabase.from('local_businesses').select('*');
    if (publishedOnly) {
      query = query.eq('is_published', true);
    }
    if (includeSortOrder) {
      query = query.order('sort_order', { ascending: true });
    }
    return query.order('name', { ascending: true });
  };

  try {
    const ordered = await run(true);
    if (!ordered.error) {
      return normalizeMediaPayload(ordered.data || []);
    }

    const message = String(ordered.error.message || '');
    if (!message.includes('sort_order')) {
      if (!message.includes('Could not find the table')) {
        console.error('[content:local_businesses]', message);
      }
      return [];
    }

    const fallback = await run(false);
    if (fallback.error) {
      console.error('[content:local_businesses_fallback]', fallback.error.message);
      return [];
    }

    return normalizeMediaPayload((fallback.data || []).map((item) => ({ ...item, sort_order: 0 })));
  } catch (error) {
    console.error('[content:local_businesses_error]', error);
    return [];
  }
}

export async function getPublishedLocalBusinesses() {
  return fetchLocalBusinesses({ publishedOnly: true });
}

export async function getLocalBusinessesForAdmin() {
  return fetchLocalBusinesses({ publishedOnly: false });
}

export async function getLocalBusinessByIdForAdmin(id) {
  const safeId = Number.parseInt(String(id || ''), 10);
  if (!Number.isFinite(safeId) || safeId <= 0) {
    return null;
  }

  return runQuery(
    `local_business_admin_${safeId}`,
    (supabase) =>
      supabase
        .from('local_businesses')
        .select('*')
        .eq('id', safeId)
        .limit(1)
        .maybeSingle(),
    null
  );
}

export async function getProjects() {
  return runQuery(
    'projects',
    (supabase) => supabase.from('projects').select('*').order('created_at', { ascending: false }),
    []
  );
}

export async function getPublishedPosts() {
  const posts = await runQuery(
    'blog_posts',
    (supabase) =>
      supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false, nullsFirst: false }),
    []
  );

  return normalizePublishedBlogAuthors(posts);
}

export async function getLatestPublishedPost() {
  return runQuery(
    'blog_posts_latest',
    (supabase) =>
      supabase
        .from('blog_posts')
        .select('id, slug, title, published_at, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    null
  );
}

export async function getPostBySlug(slug) {
  const post = await runQuery(
    `post_${slug}`,
    (supabase) =>
      supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle(),
    null
  );

  return post ? normalizePublishedBlogAuthor(post) : null;
}

function normalizePublishedBlogAuthor(post) {
  const ownerUsername = normalizeAdminUsername(getAdminOwnerUsername());
  const raw = normalizeAdminUsername(post?.author_username);
  const ownerAliases = new Set([
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME),
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME_2),
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME_3),
    normalizeAdminUsername('xrkr80hdadmin'),
    ownerUsername,
  ].filter(Boolean));

  const normalizedAuthor = !raw
    ? ownerUsername
    : ownerAliases.has(raw)
      ? ownerUsername
      : raw;

  return {
    ...post,
    author_username: normalizedAuthor,
  };
}

function normalizePublishedBlogAuthors(posts) {
  return Array.isArray(posts) ? posts.map((post) => normalizePublishedBlogAuthor(post)) : [];
}

function getFallbackBlogChannelAuthors() {
  const owner = normalizeAdminUsername(getAdminOwnerUsername());
  const configured = String(process.env.BLOG_CHANNEL_FALLBACK_USERS || '')
    .split(',')
    .map((item) => normalizeAdminUsername(item))
    .filter(Boolean);

  return Array.from(new Set([owner, ...configured].filter(Boolean)));
}

function normalizeBlogChannelCard(setting, authorUsername) {
  const safeAuthor = normalizeAdminUsername(authorUsername);
  const safeName = normalizeBlogChannelName(setting?.channel_name, safeAuthor);
  return {
    author_username: safeAuthor,
    channel_name: safeName,
    channel_slug: toBlogChannelSlug(setting?.channel_slug || safeName, safeAuthor),
    avatar_url: String(setting?.avatar_url || '').trim() || null,
    card_image_url: String(setting?.card_image_url || '').trim() || null,
  };
}

export async function getBlogChannelForUser(authorUsername) {
  const safeAuthor = normalizeAdminUsername(authorUsername);
  if (!safeAuthor) {
    return null;
  }

  const settings = await runQuery(
    `blog_channel_${safeAuthor}`,
    (supabase) => supabase.from('blog_channels').select('*').eq('username', safeAuthor).limit(1).maybeSingle(),
    null
  );

  return normalizeBlogChannelCard(settings || {}, safeAuthor);
}

export async function getPublishedBlogChannels() {
  const posts = await getPublishedPosts();
  const grouped = new Map();

  for (const post of posts) {
    const safeAuthor = normalizeAdminUsername(post.author_username);
    if (!safeAuthor) {
      continue;
    }

    const existing = grouped.get(safeAuthor) || { count: 0, latest_slug: '', latest_cover_image_url: null };
    existing.count += 1;
    if (!existing.latest_slug) {
      existing.latest_slug = String(post.slug || '');
    }
    if (!existing.latest_cover_image_url) {
      const cover = String(post.cover_image_url || '').trim();
      existing.latest_cover_image_url = cover || null;
    }
    grouped.set(safeAuthor, existing);
  }

  const settings = await runQuery(
    'blog_channels_public',
    (supabase) => supabase.from('blog_channels').select('*'),
    []
  );

  const authors = Array.from(new Set([
    ...Array.from(grouped.keys()),
    ...(settings || []).map((item) => normalizeAdminUsername(item.username)).filter(Boolean),
    ...getFallbackBlogChannelAuthors(),
  ]));

  if (!authors.length) {
    return [];
  }

  const settingMap = new Map((settings || []).map((item) => [normalizeAdminUsername(item.username), item]));

  const channels = authors.map((author) => {
    const base = normalizeBlogChannelCard(settingMap.get(author) || {}, author);
    const counts = grouped.get(author) || { count: 0, latest_slug: '', latest_cover_image_url: null };
    return {
      ...base,
      card_image_url:
        base.card_image_url ||
        (isOwnerUsername(author) ? OWNER_BLOG_CHANNEL_COVER_IMAGE : BLOG_CHANNEL_DEFAULT_CARD_IMAGE),
      count: counts.count,
      latest_slug: counts.latest_slug,
    };
  });

  channels.sort((a, b) => {
    if (isOwnerUsername(a.author_username) && !isOwnerUsername(b.author_username)) {
      return -1;
    }
    if (!isOwnerUsername(a.author_username) && isOwnerUsername(b.author_username)) {
      return 1;
    }
    return String(a.channel_name || '').localeCompare(String(b.channel_name || ''));
  });

  return channels;
}

export async function getPublishedBlogChannelFeed(channelSlug) {
  const safeSlug = String(channelSlug || '').trim().toLowerCase();
  if (!safeSlug) {
    return null;
  }

  const channels = await getPublishedBlogChannels();
  const channel = channels.find((item) => item.channel_slug === safeSlug);
  if (!channel) {
    return null;
  }

  const posts = (await getPublishedPosts()).filter((post) => normalizeAdminUsername(post.author_username) === channel.author_username);

  return {
    channel,
    posts,
  };
}

export async function getPostsForAdmin() {
  return getPostsForAdminByUser(getAdminOwnerUsername());
}

export async function getPostBySlugForAdmin(slug) {
  return getPostBySlugForAdminByUser(slug, getAdminOwnerUsername());
}

function normalizeAdminUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 48);
}

function getLegacyOwnerAuthorUsernames() {
  const ownerUsername = normalizeAdminUsername(getAdminOwnerUsername());
  return new Set([
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME),
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME_2),
    normalizeAdminUsername(process.env.BLOG_OWNER_LEGACY_USERNAME_3),
    normalizeAdminUsername('xrkr80hdadmin'),
    ownerUsername,
  ].filter(Boolean));
}

function matchesAdminBlogAuthor(postAuthorUsername, actingUser) {
  const safeUser = normalizeAdminUsername(actingUser);
  if (!safeUser) {
    return false;
  }

  const rawAuthor = normalizeAdminUsername(postAuthorUsername);
  if (isOwnerUsername(safeUser)) {
    return !rawAuthor || getLegacyOwnerAuthorUsernames().has(rawAuthor);
  }

  return rawAuthor === safeUser;
}

export async function getPostsForAdminByUser(actingUser) {
  const safeUser = normalizeAdminUsername(actingUser);

  const posts = await runQuery(
    `blog_posts_admin_${safeUser || 'anon'}`,
    (supabase) => {
      if (!safeUser) {
        return supabase.from('blog_posts').select('*').eq('id', -1);
      }

      let query = supabase.from('blog_posts').select('*');
      if (!isOwnerUsername(safeUser)) {
        query = query.eq('author_username', safeUser);
      }

      return query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    },
    []
  );

  return Array.isArray(posts) ? posts.filter((post) => matchesAdminBlogAuthor(post?.author_username, safeUser)) : [];
}

export async function getPostBySlugForAdminByUser(slug, actingUser) {
  const safeUser = normalizeAdminUsername(actingUser);

  const post = await runQuery(
    `blog_post_admin_${slug}_${safeUser || 'anon'}`,
    (supabase) => {
      if (!safeUser) {
        return supabase.from('blog_posts').select('*').eq('id', -1).limit(1).maybeSingle();
      }

      let query = supabase.from('blog_posts').select('*').eq('slug', slug);
      if (!isOwnerUsername(safeUser)) {
        query = query.eq('author_username', safeUser);
      }

      return query.limit(1).maybeSingle();
    },
    null
  );

  return post && matchesAdminBlogAuthor(post?.author_username, safeUser) ? post : null;
}

export async function getMediaByType(type) {
  return runQuery(
    `media_${type}`,
    (supabase) =>
      supabase
        .from('media_items')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false }),
    []
  );
}

export async function getHubData() {
  const [tracks, projects, photos, videos, media] = await Promise.all([
    getTracks(),
    getProjects(),
    getMediaByType('photo'),
    getMediaByType('video'),
    runQuery(
      'media_all',
      (supabase) => supabase.from('media_items').select('*').order('created_at', { ascending: false }),
      []
    ),
  ]);

  return {
    tracks,
    projects,
    photos,
    videos,
    media,
    counts: {
      tracks: tracks.length,
      projects: projects.length,
      media: media.length,
    },
  };
}

export function groupTracksByGenre(tracks) {
  const map = new Map();

  for (const track of tracks) {
    const key = String(track.genre || 'other').trim().toLowerCase() || 'other';

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(track);
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  const allGenres = Array.from(new Set([...DEFAULT_GENRES, ...sortedKeys])).sort((a, b) => a.localeCompare(b));

  return {
    tracksByGenre: map,
    allGenres,
  };
}
