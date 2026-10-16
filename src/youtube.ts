/** The video id of a YouTube URL (`watch?v=` or `youtu.be`), or undefined for any other URL. */
export const youtubeId = (url: string) => {
  const u = new URL(url);
  if (u.hostname.endsWith('youtube.com')) return u.searchParams.get('v') ?? undefined;
  if (u.hostname === 'youtu.be') return u.pathname.slice(1);
};

/** The privacy-enhanced embed of a video. */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
