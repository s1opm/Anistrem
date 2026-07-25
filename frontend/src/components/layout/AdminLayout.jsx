import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { HiOutlineVideoCamera, HiOutlineFolder, HiOutlineCog, HiOutlineLogout, HiOutlineHome, HiOutlineMenu, HiOutlineX, HiOutlineChartBar } from 'react-icons/hi';
import { useAuthStore } from '../../store.js';

const sidebarLinks = [
  { name: 'Dashboard', path: '/admin', icon: HiOutlineHome, exact: true },
  { name: 'Videos', path: '/admin/videos', icon: HiOutlineVideoCamera },
  { name: 'Upload Video', path: '/admin/videos/upload', icon: HiOutlineVideoCamera },
  { name: 'Categories', path: '/admin/categories', icon: HiOutlineFolder },
  { name: 'Settings', path: '/admin/settings', icon: HiOutlineCog },
];

export default function AdminLayout() {
  const { admin, isAuthenticated, isLoading, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !admin) return null;

  const isActive = (path, exact = false) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => { await logout(); navigate('/admin/login'); };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-900 border-r border-dark-700/50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-3 px-6 h-16 border-b border-dark-700/50">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="AniStrem" className="w-8 h-8" />
            <span className="font-display font-bold text-lg"><span className="gradient-text">Admin</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-dark-400 hover:text-white">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = isActive(link.path, link.exact);
            return (
              <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'text-white bg-primary-500/20 border border-primary-500/30' : 'text-dark-300 hover:text-white hover:bg-dark-800/50'}`}>
                <link.icon className={`w-5 h-5 ${active ? 'text-primary-400' : ''}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-sm">
              {admin.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin.name}</p>
              <p className="text-xs text-dark-400 truncate">{admin.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <HiOutlineLogout className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50 flex items-center px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-dark-300 hover:text-white">
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link to="/" target="_blank" className="text-sm text-dark-300 hover:text-primary-400 transition-colors mr-4">View Site</Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}