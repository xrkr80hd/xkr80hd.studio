export const SOCIAL_PLATFORMS = [
  { key: 'spotify', label: 'Spotify', prefix: 'https://open.spotify.com/' },
  { key: 'apple_music', label: 'Apple Music', prefix: 'https://music.apple.com/' },
  { key: 'youtube_music', label: 'YouTube Music', prefix: 'https://' },
  { key: 'amazon_music', label: 'Amazon Music', prefix: 'https://music.amazon.com/' },
  { key: 'deezer', label: 'Deezer', prefix: 'https://www.deezer.com/' },
  { key: 'tidal', label: 'TIDAL', prefix: 'https://tidal.com/' },
  { key: 'pandora', label: 'Pandora', prefix: 'https://www.pandora.com/' },
  { key: 'audiomack', label: 'Audiomack', prefix: 'https://audiomack.com/' },
  { key: 'reverbnation', label: 'ReverbNation', prefix: 'https://www.reverbnation.com/' },
  { key: 'bandcamp', label: 'Bandcamp', prefix: 'https://' },
  { key: 'soundcloud', label: 'SoundCloud', prefix: 'https://soundcloud.com/' },
  { key: 'facebook', label: 'Facebook', prefix: 'https://www.facebook.com/' },
  { key: 'instagram', label: 'Instagram', prefix: 'https://www.instagram.com/' },
  { key: 'tiktok', label: 'TikTok', prefix: 'https://www.tiktok.com/@' },
  { key: 'youtube', label: 'YouTube', prefix: 'https://www.youtube.com/' },
  { key: 'vimeo', label: 'Vimeo', prefix: 'https://vimeo.com/' },
  { key: 'twitch', label: 'Twitch', prefix: 'https://www.twitch.tv/' },
  { key: 'x', label: 'X / Twitter', prefix: 'https://x.com/' },
  { key: 'threads', label: 'Threads', prefix: 'https://www.threads.net/@' },
  { key: 'discord', label: 'Discord', prefix: 'https://discord.gg/' },
  { key: 'patreon', label: 'Patreon', prefix: 'https://www.patreon.com/' },
  { key: 'linktree', label: 'Linktree', prefix: 'https://linktr.ee/' },
  { key: 'bandlab', label: 'BandLab', prefix: 'https://www.bandlab.com/' },
  { key: 'soundbetter', label: 'SoundBetter', prefix: 'https://soundbetter.com/' },
  { key: 'mixcloud', label: 'Mixcloud', prefix: 'https://www.mixcloud.com/' },
  { key: 'website', label: 'Website', prefix: 'https://' },
];

export const SOCIAL_PLATFORM_MAP = Object.fromEntries(SOCIAL_PLATFORMS.map((item) => [item.key, item]));

function normalizeSuffix(value) {
  return String(value || '').trim().replace(/^\/+/, '');
}

export function normalizeSocialLinksMap(input) {
  const source = typeof input === 'object' && input !== null ? input : {};

  return Object.fromEntries(
    SOCIAL_PLATFORMS.map((platform) => {
      const item = typeof source[platform.key] === 'object' && source[platform.key] !== null ? source[platform.key] : {};
      return [
        platform.key,
        {
          enabled: Boolean(item.enabled),
          suffix: normalizeSuffix(item.suffix),
        },
      ];
    })
  );
}

export function buildSocialUrl(key, suffix) {
  const platform = SOCIAL_PLATFORM_MAP[key];
  const safeSuffix = normalizeSuffix(suffix);

  if (!platform || !safeSuffix) {
    return '';
  }

  if (/^https?:\/\//i.test(safeSuffix)) {
    return safeSuffix;
  }

  return `${platform.prefix}${safeSuffix}`;
}

export function getEnabledSocialLinks(socials) {
  const normalized = normalizeSocialLinksMap(socials);

  return SOCIAL_PLATFORMS.map((platform) => {
    const item = normalized[platform.key];
    const url = buildSocialUrl(platform.key, item.suffix);

    if (!item.enabled || !url) {
      return null;
    }

    return {
      key: platform.key,
      label: platform.label,
      prefix: platform.prefix,
      suffix: item.suffix,
      url,
    };
  }).filter(Boolean);
}
