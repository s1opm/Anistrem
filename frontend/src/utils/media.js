const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  return `${API_BASE}${path}`;
}

export function getThumbnailUrl(video) {
  if (!video) return null;
  const raw = video.thumbnail?.url || video.thumbnail;
  return getMediaUrl(raw);
}

export function getVideoSrc(video) {
  if (!video) return null;
  const raw = video.qualities?.find(q => q.quality === 'medium')?.url
    || video.videoFile?.url
    || video.videoUrl;
  return getMediaUrl(raw);
}
