import { useState, useEffect } from 'react';
import { HiOutlineSave } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api.js';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: '', siteDescription: '', logo: '', favicon: '', contactEmail: '',
    socialLinks: { youtube: '', twitter: '', facebook: '', instagram: '', discord: '' },
    adSlots: { header: '', sidebar: '', videoBelow: '', footer: '', betweenVideos: '' },
    adSensePublisherId: '', adSenseEnabled: false,
    primaryColor: '#7c3aed', accentColor: '#22d3ee',
    maintenanceMode: false, allowRegistration: false,
    featuredCategories: [], defaultThumbnail: '',
    seo: { metaTitle: '', metaDescription: '', ogImage: '' },
  });

  useEffect(() => {
    api.get('/api/site-settings')
      .then(res => {
        if (res.data?.data) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/site-settings', settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineSave className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* General */}
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-bold text-white">General</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Site Name</label><input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="input-field" placeholder="AniStrem" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Contact Email</label><input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="input-field" placeholder="admin@example.com" /></div>
        </div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Site Description</label><textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className="input-field h-20 resize-none" placeholder="Premium animation streaming platform" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Logo URL</label><input type="text" value={settings.logo} onChange={(e) => setSettings({ ...settings, logo: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Favicon URL</label><input type="text" value={settings.favicon} onChange={(e) => setSettings({ ...settings, favicon: e.target.value })} className="input-field" /></div>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-bold text-white">Appearance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Primary Color</label><div className="flex gap-2"><input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-dark-800 border-dark-600" /><input type="text" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="input-field flex-1" /></div></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Accent Color</label><div className="flex gap-2"><input type="color" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-dark-800 border-dark-600" /><input type="text" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} className="input-field flex-1" /></div></div>
        </div>
      </div>

      {/* Social Links */}
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-bold text-white">Social Links</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(settings.socialLinks).map(([key, val]) => (
            <div key={key}><label className="block text-sm font-medium text-dark-300 mb-1.5 capitalize">{key}</label><input type="url" value={val} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [key]: e.target.value } })} className="input-field" placeholder={`https://${key}.com/...`} /></div>
          ))}
        </div>
      </div>

      {/* AdSense */}
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-bold text-white">Google AdSense</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.adSenseEnabled} onChange={(e) => setSettings({ ...settings, adSenseEnabled: e.target.checked })} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500" />
          <span className="text-sm text-dark-300">Enable AdSense</span>
        </label>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Publisher ID</label><input type="text" value={settings.adSensePublisherId} onChange={(e) => setSettings({ ...settings, adSensePublisherId: e.target.value })} className="input-field" placeholder="ca-pub-XXXXXXXXXXXXXXXX" /></div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Default Thumbnail URL</label><input type="text" value={settings.defaultThumbnail} onChange={(e) => setSettings({ ...settings, defaultThumbnail: e.target.value })} className="input-field" placeholder="https://..." /></div>
        <h3 className="font-bold text-white pt-2">Ad Slot IDs</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(settings.adSlots).map(([key, val]) => (
            <div key={key}><label className="block text-xs font-medium text-dark-400 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label><input type="text" value={val} onChange={(e) => setSettings({ ...settings, adSlots: { ...settings.adSlots, [key]: e.target.value } })} className="input-field-sm" placeholder="data-ad-slot=..." /></div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="glass-card space-y-4">
        <h2 className="text-lg font-bold text-white">SEO</h2>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Meta Title</label><input type="text" value={settings.seo?.metaTitle} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, metaTitle: e.target.value } })} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Meta Description</label><textarea value={settings.seo?.metaDescription} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, metaDescription: e.target.value } })} className="input-field h-20 resize-none" /></div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">OG Image URL</label><input type="text" value={settings.seo?.ogImage} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, ogImage: e.target.value } })} className="input-field" /></div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card space-y-4 border border-red-500/20">
        <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-red-500 focus:ring-red-500" />
          <span className="text-sm text-dark-300">Enable Maintenance Mode</span>
        </label>
        <p className="text-xs text-dark-500">When enabled, visitors will see a maintenance page.</p>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineSave className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}