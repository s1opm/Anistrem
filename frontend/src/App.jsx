import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useThemeStore, useAuthStore } from './store.js';
import Layout from './components/layout/Layout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';

const HomePage = lazy(() => import('./pages/public/HomePage.jsx'));
const VideosPage = lazy(() => import('./pages/public/VideosPage.jsx'));
const WatchPage = lazy(() => import('./pages/public/WatchPage.jsx'));
const CategoryPage = lazy(() => import('./pages/public/CategoryPage.jsx'));
const SearchPage = lazy(() => import('./pages/public/SearchPage.jsx'));
const TrendingPage = lazy(() => import('./pages/public/TrendingPage.jsx'));
const MostViewedPage = lazy(() => import('./pages/public/MostViewedPage.jsx'));
const LatestPage = lazy(() => import('./pages/public/LatestPage.jsx'));
const AboutPage = lazy(() => import('./pages/public/AboutPage.jsx'));
const ContactPage = lazy(() => import('./pages/public/ContactPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage.jsx'));
const TermsPage = lazy(() => import('./pages/public/TermsPage.jsx'));
const DMCAPage = lazy(() => import('./pages/public/DMCAPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.jsx'));

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos.jsx'));
const AdminVideoUpload = lazy(() => import('./pages/admin/AdminVideoUpload.jsx'));
const AdminVideoEdit = lazy(() => import('./pages/admin/AdminVideoEdit.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));

function App() {
  const { theme, setTheme } = useThemeStore();
  const { initialize } = useAuthStore();
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.add('dark');
  }, [setTheme]);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <Router>
      <div className={`min-h-screen ${theme}`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #334155',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="trending" element={<TrendingPage />} />
              <Route path="most-viewed" element={<MostViewedPage />} />
              <Route path="latest" element={<LatestPage />} />
              <Route path="category/:slug" element={<CategoryPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="dmca" element={<DMCAPage />} />
            </Route>
            
            <Route path="/watch/:slug" element={<Layout hideFooter />}>
              <Route index element={<WatchPage />} />
            </Route>
            
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="videos" element={<AdminVideos />} />
              <Route path="videos/upload" element={<AdminVideoUpload />} />
              <Route path="videos/edit/:id" element={<AdminVideoEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;