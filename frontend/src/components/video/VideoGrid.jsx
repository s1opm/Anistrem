import { Link } from 'react-router-dom';
import VideoCard from './VideoCard.jsx';
import { VideoGridSkeleton } from '../ui/Skeletons.jsx';

export default function VideoGrid({ videos = [], loading = false, layout = 'grid', limit, emptyMessage = 'No videos found' }) {
  const displayVideos = limit ? videos.slice(0, limit) : videos;

  if (loading) {
    return <VideoGridSkeleton count={limit || 8} layout={layout} />;
  }

  if (!displayVideos.length) {
    return (
      <div className="text-center py-16">
        <p className="text-dark-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
      {displayVideos.map((video, index) => (
        <VideoCard key={video.id || video._id} video={video} index={index} layout={layout} />
      ))}
    </div>
  );
}

export function VideoSection({ title, videos = [], loading = false, viewAllLink = null, layout = 'grid' }) {
  if (loading || videos.length > 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              View All
            </Link>
          )}
        </div>
        <VideoGrid videos={videos} loading={loading} layout={layout} limit={layout === 'grid' ? 8 : 10} />
      </section>
    );
  }
  return null;
}