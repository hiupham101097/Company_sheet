import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Shield, Building } from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';

export function UserManager({ users = [], onRefresh, userRole = 'ADMIN' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    department: '',
    phone: '',
  });

  useEffect(() => {
    api.getCategories('DEPARTMENT')
      .then((res) => {
        const list = res.data || [];
        setDepartments(list);
        if (list.length > 0 && !formData.department) {
          setFormData((prev) => ({ ...prev, department: list[0].name }));
        }
      })
      .catch((err) => console.error('Error fetching departments:', err));
  }, []);

  if (userRole !== 'ADMIN') {
    return (
      <div className="bg-white p-12 rounded-3xl border border-pastel-200/80 shadow-soft text-center space-y-3">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Shield size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800">Khu Vực Dành Riêng Cho Quản Trị Viên</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Chỉ tài khoản Quản trị viên tối cao (ADMIN) mới có quyền truy cập, tiếp nhận nhân sự mới và phân quyền hệ thống.
        </p>
      </div>
    );
  }

  const roleMap = {
    ADMIN: { label: 'Quản trị viên', variant: 'danger' },
    MANAGER: { label: 'Quản lý phòng ban', variant: 'warning' },
    STAFF: { label: 'Nhân viên chuyên môn', variant: 'info' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'STAFF',
        department: departments[0]?.name || 'Phòng Kỹ Thuật & IT',
        phone: '',
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi thêm nhân sự');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Nhân Sự & Người Sử Dụng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Danh sách cán bộ nhân viên, phân quyền truy cập hệ thống và quản lý tài sản bàn giao.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
        >
          <Plus size={16} />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => {
          const roleInfo = roleMap[user.role] || { label: user.role, variant: 'default' };
          return (
            <div
              key={user.id}
              className="bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pastel-200"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">{user.name}</h4>
                    <p className="text-[11px] text-pastel-700 font-semibold mt-0.5 truncate">{user.department}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hoạt động</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Thêm Nhân Viên Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tiếp Nhận Nhân Sự Mới"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              placeholder="VD: Hoàng Minh Trí"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email doanh nghiệp *</label>
              <input
                type="email"
                required
                placeholder="tri.hoang@enterprise.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng ban công tác</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                {departments.length === 0 ? (
                  <option value="">Đang tải phòng ban...</option>
                ) : (
                  departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="STAFF">Nhân viên chuyên môn (STAFF)</option>
                <option value="MANAGER">Trưởng phòng / Quản lý (MANAGER)</option>
                <option value="ADMIN">Quản trị viên tối cao (ADMIN)</option>
              </select>
            </div>
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
              <span>Lưu Nhân Sự</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
