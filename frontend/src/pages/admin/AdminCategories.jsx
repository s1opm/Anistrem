import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { useCategoryStore } from '../../store.js';
import toast from 'react-hot-toast';
import api from '../../services/api.js';

export default function AdminCategories() {
  const { categories, fetchCategories, isLoading } = useCategoryStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', color: '#7c3aed', isActive: true, sortOrder: 0 });

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', icon: '', color: '#7c3aed', isActive: true, sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', color: cat.color || '#7c3aed', isActive: cat.isActive !== false, sortOrder: cat.sortOrder || 0 });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/api/categories', form);
        toast.success('Category created');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Videos in this category will become uncategorized.')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm flex items-center gap-1.5">
          <HiOutlinePlus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card space-y-4">
          <h3 className="font-bold text-white">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 🎬" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-dark-800 border-dark-600" />
                <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input-field flex-1" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm text-dark-300">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-1.5"><HiOutlineCheck className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="glass-card">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : categories.length === 0 ? (
          <p className="text-center text-dark-400 py-12">No categories yet. Create your first one above.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-700/30 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20` }}>
                  {cat.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{cat.name}</p>
                    {!cat.isActive && <span className="text-xs text-dark-500">(inactive)</span>}
                  </div>
                  {cat.description && <p className="text-xs text-dark-400 truncate">{cat.description}</p>}
                </div>
                <span className="text-xs text-dark-400">{cat.videoCount || 0} videos</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-dark-400 hover:text-primary-400 rounded-lg hover:bg-dark-700/50 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}