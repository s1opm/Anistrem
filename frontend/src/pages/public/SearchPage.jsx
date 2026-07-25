import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import { useVideoStore } from '../../store.js';
import VideoGrid from '../../components/video/VideoGrid.jsx';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { searchResults, searchVideos, isLoading } = useVideoStore();

  useEffect(() => {
    if (query) searchVideos(query);
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-2">
        <HiSearch className="w-6 h-6 text-primary-500" />
        <h1 className="text-3xl font-bold text-white">Search Results</h1>
      </div>
      {query && <p className="text-dark-400 mb-8">Results for "{query}"</p>}
      <VideoGrid videos={searchResults} loading={isLoading} emptyMessage={query ? `No results found for "${query}"` : 'Enter a search query'} />
    </div>
  );
}