import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiPlay, HiFire, HiTrendingUp, HiClock, HiArrowRight } from 'react-icons/hi';
import { useVideoStore, useCategoryStore } from '../../store.js';
import { VideoSection } from '../../components/video/VideoGrid.jsx';
import VideoCard from '../../components/video/VideoCard.jsx';
import { HeroSkeleton, CategoryCardSkeleton } from '../../components/ui/Skeletons.jsx';
import AdSlot from '../../components/common/AdSlot.jsx';

export default function HomePage() {
  const { featuredVideos, trendingVideos, latestVideos, fetchFeatured, fetchTrending, fetchLatest } = useVideoStore();
  const { featuredCategories, fetchFeaturedCategories } = useCategoryStore();
  const [heroVideo, setHeroVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchFeatured(5),
        fetchTrending(12),
        fetchLatest(12),
        fetchFeaturedCategories(10),
      ]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (featuredVideos.length > 0 && !heroVideo) {
      setHeroVideo(featuredVideos[0]);
    }
  }, [featuredVideos]);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[65vh] min-h-[450px] max-h-[700px] overflow-hidden">
        {loading ? (
          <HeroSkeleton />
        ) : heroVideo ? (
          <>
            <div className="absolute inset-0">
              {(heroVideo.thumbnail?.url || heroVideo.thumbnail) ? (
                <img src={heroVideo.thumbnail?.url || heroVideo.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-900 via-secondary-900 to-dark-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-dark-950/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
              <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  {heroVideo.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full border border-primary-500/30 mb-4">
                      {heroVideo.category.icon && <span>{heroVideo.category.icon}</span>}
                      {heroVideo.category.name}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-3 max-w-2xl leading-tight">
                    {heroVideo.title}
                  </h1>
                  {heroVideo.shortDescription && (
                    <p className="text-dark-300 text-sm sm:text-base max-w-xl mb-6 line-clamp-2">{heroVideo.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <Link to={`/watch/${heroVideo.slug}`} className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 active:scale-95">
                      <HiPlay className="w-5 h-5" />
                      Watch Now
                    </Link>
                    <Link to={`/watch/${heroVideo.slug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300">
                      More Info
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900 via-secondary-900 to-dark-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-4">AniStrem</h1>
              <p className="text-dark-300 text-lg">Your premier destination for animation streaming</p>
            </div>
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Featured Categories */}
        {!loading && featuredCategories.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Browse Categories</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {featuredCategories.map((cat, i) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="flex-shrink-0 px-5 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-primary-500/30 hover:bg-dark-700/50 transition-all duration-200 group">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span className="text-xl">{cat.icon}</span>}
                    <span className="text-sm font-medium text-dark-200 group-hover:text-white whitespace-nowrap">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Hero Ad Slot */}
        <AdSlot position="betweenVideos" className="mb-10" />

        {/* Trending Videos */}
        <VideoSection title="Trending Now" videos={trendingVideos} loading={loading} viewAllLink="/trending" />

        {/* Latest Videos */}
        <VideoSection title="Latest Uploads" videos={latestVideos} loading={loading} viewAllLink="/latest" />

        <AdSlot position="betweenVideos" className="mb-10" />

        {/* Featured Videos */}
        {featuredVideos.length > 1 && (
          <VideoSection title="Featured" videos={featuredVideos.slice(1)} loading={loading} />
        )}

        {/* More Categories */}
        {!loading && featuredCategories.length > 4 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Explore Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {featuredCategories.slice(0, 10).map((cat, i) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="relative h-28 rounded-xl overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient || 'from-primary-500 to-secondary-500'} opacity-60 group-hover:opacity-80 transition-opacity`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    {cat.icon && <span className="text-3xl mb-2">{cat.icon}</span>}
                    <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-white/70 mt-1">{cat.videoCount || 0} videos</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}