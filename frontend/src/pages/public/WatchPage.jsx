import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiCog, HiShare, HiThumbUp, HiOutlineEye, HiOutlineShare, HiArrowsExpand } from 'react-icons/hi';
import { useVideoStore } from '../../store.js';
import { useVideoProgress } from '../../hooks/index.js';
import api from '../../services/api.js';
import { formatNumber, formatDuration, formatTimeAgo, copyToClipboard, getShareUrl } from '../../utils/index.js';
import VideoCard from '../../components/video/VideoCard.jsx';
import { HeaderBanner, NativeBanner, Banner300x250, SidebarBanner } from '../../components/ads/index.js';

function useIsMobile(bp = 640) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

export default function WatchPage() {
  const { slug } = useParams();
  const { currentVideo, fetchVideo, relatedVideos, fetchRelated, setCurrentVideo } = useVideoStore();
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showQuality, setShowQuality] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const videoRef = useRef(null);
  const qualityRef = useRef(null);
  const speedRef = useRef(null);
  const shareRef = useRef(null);
  const { progress, updateProgress } = useVideoProgress(slug);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (qualityRef.current && !qualityRef.current.contains(e.target)) setShowQuality(false);
      if (speedRef.current && !speedRef.current.contains(e.target)) setShowSpeed(false);
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShareMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentVideo(null);
    const load = async () => {
      setLoading(true);
      try {
        const video = await fetchVideo(slug);
        if (video) {
          fetchRelated(video.id, 8);
          document.title = `${video.title} - AniStrem`;
          updateMetaTags(video);
          api.post(`/api/videos/${video.id}/view`, { duration: video.duration }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load video:', err);
      }
      setLoading(false);
    };
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  const updateMetaTags = (video) => {
    document.title = `${video.title} - AniStrem`;
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', video.seoDescription || video.shortDescription || video.description?.substring(0, 160) || video.title);
    setMeta('og:title', video.ogTitle || video.title);
    setMeta('og:description', video.ogDescription || video.shortDescription || '');
    if (video.thumbnail?.url || video.thumbnail) setMeta('og:image', video.thumbnail?.url || video.thumbnail);
    setMeta('twitter:card', video.twitterCard || 'summary_large_image');
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(time);
      setDuration(dur);
      if (dur > 0) updateProgress(time, dur);
    }
  }, [updateProgress]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const changePlaybackRate = (rate) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeed(false);
  };

  const handleFullscreen = () => {
    const container = document.getElementById('video-player-container');
    if (container) {
      if (document.fullscreenElement) document.exitFullscreen();
      else container.requestFullscreen();
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = currentVideo?.title || '';
    if (platform === 'copy') {
      copyToClipboard(url);
    } else {
      window.open(getShareUrl(platform, url, title), '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'm': toggleMute(); break;
        case 'f': handleFullscreen(); break;
        case 'arrowleft': if (videoRef.current) videoRef.current.currentTime -= 10; break;
        case 'arrowright': if (videoRef.current) videoRef.current.currentTime += 10; break;
        case 'arrowup': e.preventDefault(); setVolume(v => { const nv = Math.min(1, v + 0.1); if (videoRef.current) videoRef.current.volume = nv; return nv; }); break;
        case 'arrowdown': e.preventDefault(); setVolume(v => { const nv = Math.max(0, v - 0.1); if (videoRef.current) videoRef.current.volume = nv; return nv; }); break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isPlaying, isMuted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video bg-dark-800 rounded-2xl animate-pulse mb-6" />
          <div className="h-8 bg-dark-700 rounded w-1/2 mb-3 animate-pulse" />
          <div className="h-4 bg-dark-700 rounded w-1/3 mb-6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Video Not Found</h2>
          <p className="text-dark-400">The video you're looking for doesn't exist.</p>
          <Link to="/" className="inline-block mt-4 px-6 py-2 btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const qualities = currentVideo.qualities || currentVideo.resolutions || [];

  return (
    <div className="min-h-screen bg-dark-950 pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Video Player */}
            <div id="video-player-container" className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 group">
              {(currentVideo.videoUrl || currentVideo.videoFile?.url || currentVideo.qualities?.length > 0) ? (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  src={currentVideo.qualities?.find(q => q.quality === selectedQuality)?.url || currentVideo.videoFile?.url || currentVideo.videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => setDuration(e.target.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-900">
                  <div className="text-center">
                    <HiPlay className="w-16 h-16 text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-400">Video not available</p>
                  </div>
                </div>
              )}

              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Progress Bar */}
                <div className="relative h-1.5 bg-dark-600 rounded-full mb-4 cursor-pointer group/progress" onClick={seekTo}>
                  <div className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="p-1 text-white hover:text-primary-400 transition-colors">
                      {isPlaying ? <HiPause className="w-6 h-6" /> : <HiPlay className="w-6 h-6" />}
                    </button>
                    <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)} className="p-1 text-white/70 hover:text-white transition-colors hidden sm:block">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                    </button>
                    <button onClick={() => videoRef.current && (videoRef.current.currentTime += 10)} className="p-1 text-white/70 hover:text-white transition-colors hidden sm:block">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
                    </button>

                    <div className="flex items-center gap-2 group/vol">
                      <button onClick={toggleMute} className="p-1 text-white/70 hover:text-white transition-colors">
                        {isMuted || volume === 0 ? <HiVolumeOff className="w-5 h-5" /> : <HiVolumeUp className="w-5 h-5" />}
                      </button>
                      <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 accent-primary-500 hidden sm:block" />
                    </div>

                    <span className="text-xs text-white/80 font-mono">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quality Selector */}
                    {qualities.length > 1 && (
                      <div ref={qualityRef} className="relative">
                        <button onClick={() => { setShowQuality(!showQuality); setShowSpeed(false); }} className="px-2 py-1 text-xs text-white/70 hover:text-white border border-white/20 rounded transition-colors">
                          {selectedQuality === 'auto' ? 'Auto' : selectedQuality}
                        </button>
                        {showQuality && (
                          <div className="absolute bottom-full right-0 mb-2 w-32 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-1">
                              <button onClick={() => { setSelectedQuality('auto'); setShowQuality(false); }} className={`w-full text-left px-3 py-1.5 text-xs rounded ${selectedQuality === 'auto' ? 'text-primary-400 bg-primary-500/10' : 'text-white hover:bg-dark-700'}`}>Auto</button>
                              {qualities.map(q => (
                                <button key={q.quality || q.resolution} onClick={() => { setSelectedQuality(q.quality || q.resolution); setShowQuality(false); }} className={`w-full text-left px-3 py-1.5 text-xs rounded ${(selectedQuality === q.quality || selectedQuality === q.resolution) ? 'text-primary-400 bg-primary-500/10' : 'text-white hover:bg-dark-700'}`}>
                                  {q.quality || q.resolution}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Playback Speed */}
                    <div ref={speedRef} className="relative hidden sm:block">
                      <button onClick={() => { setShowSpeed(!showSpeed); setShowQuality(false); }} className="px-2 py-1 text-xs text-white/70 hover:text-white border border-white/20 rounded transition-colors">
                        {playbackRate}x
                      </button>
                      {showSpeed && (
                        <div className="absolute bottom-full right-0 mb-2 w-24 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden">
                          <div className="p-1">
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                              <button key={rate} onClick={() => changePlaybackRate(rate)} className={`w-full text-left px-3 py-1.5 text-xs rounded ${playbackRate === rate ? 'text-primary-400 bg-primary-500/10' : 'text-white hover:bg-dark-700'}`}>
                                {rate}x {rate === 1 && '(Normal)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={handleFullscreen} className="p-1 text-white/70 hover:text-white transition-colors">
                      <HiArrowsExpand className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Play/Pause overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-primary-500/30 backdrop-blur-sm flex items-center justify-center">
                    <HiPlay className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}
            </div>

            <HeaderBanner className="mb-4" />

            {/* Video Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{currentVideo.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-dark-400 mb-4">
                <span className="flex items-center gap-1"><HiOutlineEye className="w-4 h-4" /> {formatNumber(currentVideo.viewCount)} views</span>
                <span>&middot;</span>
                <span>{formatTimeAgo(currentVideo.publishedAt)}</span>
                {currentVideo.category && (
                  <>
                    <span>&middot;</span>
                    <Link to={`/category/${currentVideo.category.slug}`} className="text-primary-400 hover:text-primary-300">{currentVideo.category.name}</Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl text-sm font-medium text-white transition-colors">
                  <HiThumbUp className="w-4 h-4" /> {formatNumber(currentVideo.likeCount)}
                </button>
                <div className="relative">
                  <button ref={shareRef} onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl text-sm font-medium text-white transition-colors">
                    <HiShare className="w-4 h-4" /> Share
                  </button>
                  {showShareMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-dark-800 border border-dark-600 rounded-xl shadow-xl overflow-hidden z-20">
                      {['twitter', 'facebook', 'reddit', 'whatsapp', 'telegram', 'copy'].map(platform => (
                        <button key={platform} onClick={() => handleShare(platform)} className="w-full text-left px-4 py-2.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition-colors capitalize">
                          {platform === 'copy' ? 'Copy Link' : platform}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Description */}
            {currentVideo.description && (
              <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-dark-300 whitespace-pre-wrap">{currentVideo.description}</p>
                {currentVideo.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentVideo.tags.map(tag => (
                      <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="px-3 py-1 bg-dark-700/50 text-xs text-dark-300 hover:text-primary-400 rounded-full transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Native Ad below description */}
            <NativeBanner className="mb-6" />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 shrink-0">
            {!isMobile && <SidebarBanner className="mb-6" />}
            <h3 className="text-lg font-bold text-white mb-4">Related Videos</h3>
            <div className="space-y-2">
              {relatedVideos.map((video, i) => (
                <VideoCard key={video.id} video={video} index={i} layout="horizontal" />
              ))}
              {relatedVideos.length === 0 && (
                <p className="text-dark-400 text-sm py-4">No related videos found</p>
              )}
            </div>
            <Banner300x250 className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}