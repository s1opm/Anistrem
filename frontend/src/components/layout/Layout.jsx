import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiSearch, HiHome, HiFire, HiClock, HiTrendingUp, HiInformationCircle, HiMail, HiShieldCheck, HiDocumentText, HiCog, HiChevronDown, HiSun, HiMoon, HiX } from 'react-icons/hi';
import { useThemeStore, useUIStore } from '../../store.js';
import { useScrollPosition, useClickOutside } from '../../hooks/index.js';
import api from '../../services/api.js';
import SearchOverlay from '../common/SearchOverlay.jsx';
import { HeaderBanner, SidebarBanner, SocialBar, Popunder, Banner728x90, Banner320x50 } from '../ads/index.js';

const navLinks = [
  { name: 'Home', path: '/', icon: HiHome },
  { name: 'Trending', path: '/trending', icon: HiFire },
  { name: 'Most Viewed', path: '/most-viewed', icon: HiTrendingUp },
  { name: 'Latest', path: '/latest', icon: HiClock },
];

const footerLinks = [
  { name: 'About', path: '/about', icon: HiInformationCircle },
  { name: 'Contact', path: '/contact', icon: HiMail },
  { name: 'Privacy Policy', path: '/privacy', icon: HiShieldCheck },
  { name: 'Terms & Conditions', path: '/terms', icon: HiDocumentText },
  { name: 'DMCA', path: '/dmca', icon: HiDocumentText },
];

export default function Layout({ hideFooter = false }) {
  const { theme, toggleTheme } = useThemeStore();
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const categoriesRef = useRef(null);
  
  useClickOutside(categoriesRef, () => setShowCategories(false));
  
  const scrollPosition = useScrollPosition();
  
  useEffect(() => {
    setIsScrolled(scrollPosition > 20);
  }, [scrollPosition]);
  
  useEffect(() => {
    setShowCategories(false);
  }, [location]);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  useEffect(() => {
    api.get('/api/categories', { params: { isActive: true, limit: 20, sort: 'order' } })
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);
  
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.svg" alt="AniStrem" className="h-9 w-auto" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-primary-400 bg-primary-500/10'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              
              {/* Categories Dropdown */}
              <div className="relative" ref={categoriesRef}>
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
                >
                  Categories
                  <HiChevronDown className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showCategories && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 glass rounded-xl shadow-xl overflow-hidden border border-dark-600/50"
                    >
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {categories.slice(0, 15).map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                          >
                            {cat.icon && <span className="text-lg">{cat.icon}</span>}
                            <div>
                              <p className="text-sm font-medium text-white">{cat.name}</p>
                              <p className="text-xs text-dark-400">{cat.videoCount || 0} videos</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="p-2 border-t border-dark-600/50">
                        <Link
                          to="/videos"
                          onClick={() => setShowCategories(false)}
                          className="block text-center text-sm text-primary-400 hover:text-primary-300 py-2"
                        >
                          View All Categories
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
            
            {/* Right Side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
              >
                <HiSearch className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
              >
                {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              </button>
              
              <Link
                to="/admin/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-500/20 transition-all duration-200"
              >
                <HiCog className="w-4 h-4" />
                Admin
              </Link>
              
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="md:hidden p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
              >
                {isMobileMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
        <div className="md:hidden glass border-t border-dark-600/50">
          <div className="p-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}

                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isActive ? 'text-primary-400 bg-primary-500/10' : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
            
            <div className="border-t border-dark-600/50 pt-2 mt-2">
              <p className="px-4 py-2 text-xs text-dark-400 uppercase tracking-wider">Categories</p>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {categories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
  
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-700/50"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="truncate">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="border-t border-dark-600/50 pt-2">
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-3 text-primary-400 hover:bg-primary-500/10 rounded-lg"
              >
                <HiCog className="w-5 h-5" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </div>
          </div>
        </div>
        )}
      </header>
      
      {/* Header Ad Banner */}
      <div className="pt-16">
        <HeaderBanner />
      </div>
      
      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
      
      {/* Footer */}
      {!hideFooter && (
        <footer className="bg-dark-900/80 border-t border-dark-700/50 mt-16">
          {/* Footer Banner */}
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="hidden sm:block">
              <Banner728x90 />
            </div>
            <div className="block sm:hidden">
              <Banner320x50 />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="md:col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <img src="/logo.svg" alt="AniStrem" className="h-9 w-auto" />
                </Link>
                <p className="text-dark-400 text-sm leading-relaxed">
                  Stream Your Anime Universe. Discover amazing animated content from around the world.
                </p>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-dark-400 hover:text-primary-400 text-sm transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal */}
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  {footerLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-dark-400 hover:text-primary-400 text-sm transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Newsletter */}
              <div>
                <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
                <p className="text-dark-400 text-sm mb-4">Get the latest content delivered to your inbox.</p>
                <form onSubmit={(e) => { e.preventDefault(); }} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
            
            <div className="border-t border-dark-700/50 mt-8 pt-8 text-center">
              <p className="text-dark-400 text-sm">
                &copy; {new Date().getFullYear()} AniStrem. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
      
      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && <SearchOverlay />}
      </AnimatePresence>
      
      {/* Scroll to Top */}
      <AnimatePresence>
        {scrollPosition > 500 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full gradient-bg shadow-lg shadow-primary-500/25 flex items-center justify-center text-white hover:shadow-xl hover:shadow-primary-500/40 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
      {/* Global Ads */}
      <Popunder />
      <SocialBar />
    </div>
  );
}