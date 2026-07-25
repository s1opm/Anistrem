import { useEffect } from 'react';
import { HiTrendingUp } from 'react-icons/hi';
import { useVideoStore } from '../../store.js';
import VideoGrid from '../../components/video/VideoGrid.jsx';

export default function MostViewedPage() {
  const { videos, fetchVideos, isLoading } = useVideoStore();

  useEffect(() => {
    fetchVideos({ sort: '-viewCount', limit: 30, status: 'published' });
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <HiTrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="section-title text-4xl sm:text-5xl font-display font-bold">
              Most Viewed
            </h1>
          </div>
          <p className="text-dark-300 text-lg mt-6">
            All-time most watched videos
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <VideoGrid videos={videos} loading={isLoading} />
      </section>
    </div>
  );
}
