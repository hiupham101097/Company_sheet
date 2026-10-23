import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Building2,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';
import { hasPermission } from '../../utils/permissionHelper';

export function UserManager({ 
  users = [], 
  onRefresh, 
  userRole = 'ADMIN',
  currentUser,
  companySettings,
  licenseInfo,
  onOpenUpgrade
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    department: '',
    phone: '',
  });

  const canView = hasPermission(currentUser, companySettings, 'users_view') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canCreate = hasPermission(currentUser, companySettings, 'users_create') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canEdit = hasPermission(currentUser, companySettings, 'users_edit') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const canLock = hasPermission(currentUser, companySettings, 'users_lock') || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

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

  if (!canView) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-pastel-200/80 shadow-soft text-center space-y-3">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Shield size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800">Quyền Hạn Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Tài khoản của bạn chưa được cấp quyền xem danh sách hồ sơ nhân sự (users_view). Vui lòng liên hệ Quản trị viên để được cấp quyền.
        </p>
      </div>
    );
  }

  const roleMap = {
    ADMIN: { label: 'Quản trị viên', variant: 'danger' },
    MANAGER: { label: 'Quản lý', variant: 'warning' },
    STAFF: { label: 'Nhân viên', variant: 'info' }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'STAFF',
      department: departments[0]?.name || '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'STAFF',
      department: user.department || departments[0]?.name || '',
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    if (user.id === 'usr_admin' || user.id === 'usr_1') {
      alert('Không thể xóa tài khoản Quản trị viên khởi tạo của hệ thống!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${user.name}" khỏi hệ thống?`)) {
      try {
        await api.deleteUser(user.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message || 'Lỗi khi xóa nhân viên');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'STAFF',
        department: departments[0]?.name || 'Phòng Kỹ Thuật & IT',
        phone: '',
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.code === 'LICENSE_LIMIT_REACHED' && onOpenUpgrade) {
        onOpenUpgrade(err.message);
        return;
      }
      alert(err.message || 'Lỗi lưu thông tin nhân sự');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesDept = selectedDept === 'ALL' || u.department === selectedDept;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Nhân Sự & Phòng Ban
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-slate-500">
              Phân bổ nhân viên theo từng phòng ban, phân quyền tài khoản ({users.length} thành viên).
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        )}
      </div>

      {/* Filter by Department and Search */}
      <div className="space-y-3">
        {/* Department Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedDept === 'ALL'
                ? 'bg-pastel-500 text-white shadow-soft'
                : 'bg-white text-slate-600 hover:bg-pastel-50 border border-pastel-200/80'
            }`}
          >
            <span>Tất cả phòng ban</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedDept === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {users.length}
            </span>
          </button>

          {departments.map((dept) => {
            const count = users.filter((u) => u.department === dept.name).length;
            const isSelected = selectedDept === dept.name;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.name)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-pastel-500 text-white shadow-soft'
                    : 'bg-white text-slate-600 hover:bg-pastel-50 border border-pastel-200/80'
                }`}
              >
                <Building2 size={13} className={isSelected ? 'text-white' : 'text-pastel-600'} />
                <span>{dept.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="bg-white p-3 rounded-2xl border border-pastel-200/90 shadow-soft flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại, phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white text-slate-800 font-medium"
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
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Hiển thị {filteredUsers.length} / {users.length} nhân sự
          </span>
        </div>
      </div>

      {/* Staff Cards Grid - Clean responsive columns with ample card width */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-pastel-200/80">
            <Users size={36} className="mx-auto text-pastel-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">Không tìm thấy nhân viên nào phù hợp.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Vui lòng thử chọn phòng ban khác hoặc thêm nhân sự mới</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const roleInfo = roleMap[user.role] || { label: user.role, variant: 'default' };
            return (
              <div
                key={user.id}
                className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft hover:shadow-soft-lg transition-all card-hover flex flex-col justify-between overflow-hidden relative min-w-0"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pastel-200/80 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug truncate" title={user.name}>
                          {user.name}
                        </h4>
                        <div
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/70 text-[11px] font-medium mt-1 max-w-full truncate"
                          title={user.department || 'Chưa gán'}
                        >
                          <Building2 size={11} className="text-sky-600 shrink-0" />
                          <span className="truncate">{user.department || 'Chưa gán'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 ml-1">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
                          title="Chỉnh sửa thông tin & đổi phòng ban"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {canLock && user.id !== 'usr_admin' && user.id !== 'usr_1' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa nhân viên"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Badge variant={roleInfo.variant} className="whitespace-nowrap shrink-0">
                    {roleInfo.label}
                  </Badge>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hoạt động</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Thêm / Sửa Nhân Viên & Phòng Ban */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Chỉnh Sửa Nhân Sự & Phòng Ban: ${editingUser.name}` : "Tiếp Nhận Nhân Sự Mới"}
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
              <label className="block font-semibold text-slate-700 mb-1">
                Phòng ban công tác * (Tiện giao việc)
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                {departments.length === 0 ? (
                  <option value="">Đang tải phòng ban...</option>
                ) : (
                  departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ''}
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
                <option value="ADMIN">Quản trị viên Doanh nghiệp (ADMIN)</option>
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
              <span>{editingUser ? 'Cập Nhật Nhân Sự' : 'Lưu Nhân Sự'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
