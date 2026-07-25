import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineVideoCamera, HiOutlineEye, HiOutlineFolder, HiOutlinePlus } from 'react-icons/hi';
import { useAdminStore } from '../../store.js';
import { formatNumber } from '../../utils/index.js';
import { DashboardStatsSkeleton } from '../../components/ui/Skeletons.jsx';

export default function AdminDashboard() {
  const { stats, fetchDashboard, isLoading } = useAdminStore();
  const [period, setPeriod] = useState('30d');

  useEffect(() => { fetchDashboard(period); }, [period]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <DashboardStatsSkeleton />
      </div>
    );
  }

  const overview = stats?.overview || {};
  const topVideos = stats?.topVideos || [];
  const topCategories = stats?.byCategory || [];
  const recentUploads = stats?.recentUploads || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field-sm w-auto">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Link to="/admin/videos/upload" className="btn-primary text-sm flex items-center gap-1.5">
            <HiOutlinePlus className="w-4 h-4" /> Upload Video
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Videos', value: overview.totalVideos || 0, icon: HiOutlineVideoCamera, color: 'primary' },
          { label: 'Total Views', value: formatNumber(overview.totalViews || 0), icon: HiOutlineEye, color: 'secondary' },
          { label: 'Categories', value: overview.totalCategories || 0, icon: HiOutlineFolder, color: 'accent' },
          { label: 'Published', value: overview.publishedVideos || 0, icon: HiOutlineVideoCamera, color: 'green' },
        ].map((stat) => {
          const colorMap = {
            primary: 'bg-primary-500/10 text-primary-400',
            secondary: 'bg-secondary-500/10 text-secondary-400',
            accent: 'bg-red-500/10 text-red-400',
            green: 'bg-green-500/10 text-green-400',
          };
          const colors = colorMap[stat.color] || colorMap.primary;
          return (
            <div key={stat.label} className="glass-card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.split(' ')[0]}`}>
                <stat.icon className={`w-6 h-6 ${colors.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-dark-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <div className="glass-card">
          <h2 className="text-lg font-bold text-white mb-4">Top Videos</h2>
          <div className="space-y-3">
            {topVideos.slice(0, 5).map((video, i) => (
              <div key={video._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors">
                <span className="text-dark-500 text-sm w-5">{i + 1}</span>
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                  {video.thumbnail?.url ? <img src={video.thumbnail.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-bg opacity-30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{video.title}</p>
                  <p className="text-xs text-dark-400">{formatNumber(video.viewCount)} views</p>
                </div>
                <Link to={`/admin/videos/edit/${video._id}`} className="text-xs text-primary-400 hover:text-primary-300">Edit</Link>
              </div>
            ))}
            {topVideos.length === 0 && <p className="text-dark-400 text-sm py-4 text-center">No videos yet</p>}
          </div>
        </div>

        {/* Top Categories */}
        <div className="glass-card">
          <h2 className="text-lg font-bold text-white mb-4">Top Categories</h2>
          <div className="space-y-3">
            {topCategories.slice(0, 5).map((cat, i) => (
              <div key={cat._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors">
                <span className="text-dark-500 text-sm w-5">{i + 1}</span>
                {cat.icon && <span className="text-lg">{cat.icon}</span>}
                <div className="flex-1">
                  <p className="text-sm text-white">{cat.name}</p>
                  <p className="text-xs text-dark-400">{cat.count} videos &middot; {formatNumber(cat.views)} views</p>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && <p className="text-dark-400 text-sm py-4 text-center">No categories yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Uploads</h2>
          <Link to="/admin/videos" className="text-sm text-primary-400 hover:text-primary-300">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-400 border-b border-dark-700/50">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Views</th>
                <th className="text-left py-3 px-2">Created</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.slice(0, 8).map((video) => (
                <tr key={video._id} className="border-b border-dark-700/30 hover:bg-dark-700/20">
                  <td className="py-3 px-2 text-white truncate max-w-xs">{video.title}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${video.status === 'published' ? 'bg-green-500/20 text-green-400' : video.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-600 text-dark-300'}`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-dark-300">{formatNumber(video.viewCount)}</td>
                  <td className="py-3 px-2 text-dark-400">{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-2 text-right">
                    <Link to={`/admin/videos/edit/${video._id}`} className="text-primary-400 hover:text-primary-300">Edit</Link>
                  </td>
                </tr>
              ))}
              {recentUploads.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-dark-400">No uploads yet. <Link to="/admin/videos/upload" className="text-primary-400">Upload your first video</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}