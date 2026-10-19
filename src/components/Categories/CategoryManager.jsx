import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Laptop,
  TrendingUp,
  Building2,
  X
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';

export function CategoryManager({ userRole = 'ADMIN' }) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('ASSET_CATEGORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'ASSET_CATEGORY', label: 'Loại Tài Sản & Thiết Bị', icon: Laptop, color: 'text-pastel-600' },
    { id: 'FINANCE_CATEGORY', label: 'Hạng Mục Thu / Chi', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'DEPARTMENT', label: 'Phòng Ban Doanh Nghiệp', icon: Building2, color: 'text-sky-600' }
  ];

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories
    .filter((cat) => cat.type === activeTab)
    .filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.code && cat.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code || '',
      description: cat.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole !== 'ADMIN') {
      alert('Chỉ Quản trị viên (ADMIN) mới có quyền sửa đổi danh mục!');
      return;
    }

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory({
          type: activeTab,
          ...formData
        });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Lỗi thao tác danh mục');
    }
  };

  const handleDelete = async (id, name) => {
    if (userRole !== 'ADMIN') {
      alert('Chỉ Quản trị viên (ADMIN) mới có quyền xóa danh mục!');
      return;
    }

    if (confirm(`Bạn có chắc muốn xóa danh mục: "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (err) {
        alert(err.message || 'Lỗi xóa danh mục');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FolderTree size={22} className="text-pastel-600" />
            <span>Quản Lý Danh Mục Nghiệp Vụ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tất cả danh mục được quản lý và cập nhật đồng bộ qua API hệ thống.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
          >
            <Plus size={16} />
            <span>Thêm Danh Mục Mới</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = categories.filter((c) => c.type === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-pastel-500 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-pastel-50'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-pastel-200/90 shadow-soft flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm danh mục theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 sm:p-4 space-y-3">
          {filteredCategories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Không tìm thấy danh mục nào phù hợp.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="p-3.5 rounded-2xl bg-pastel-50/40 border border-pastel-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-pastel-700 bg-pastel-100 px-2 py-0.5 rounded-md inline-block mb-1">
                      {cat.code || cat.id}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm">{cat.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-pastel-700 hover:bg-white border border-slate-200 bg-white"
                      title="Sửa danh mục"
                    >
                      <Edit2 size={14} />
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 bg-white"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {cat.description && (
                  <p className="text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-pastel-200/50">
                    {cat.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '700px' }}>
            <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
              <tr>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Mã Danh Mục</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Tên Danh Mục</th>
                <th className="py-3.5 px-4 font-bold">Mô Tả / Diễn Giải</th>
                <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-pastel-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">
                      {cat.code || cat.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">{cat.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-md">{cat.description || '-'}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
                          title="Sửa danh mục"
                        >
                          <Edit2 size={15} />
                        </button>
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa danh mục"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm / Sửa Danh Mục */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Mới Danh Mục'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên danh mục *</label>
            <input
              type="text"
              required
              placeholder="VD: Máy in & Máy scan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mã định danh (Code)</label>
            <input
              type="text"
              placeholder="VD: PRINTER"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả / Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Mục đích sử dụng, phạm vi áp dụng..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>{editingCategory ? 'Lưu Thay Đổi' : 'Tạo Danh Mục'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
