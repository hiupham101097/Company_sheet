import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  Sparkles,
  CalendarCheck,
  CheckSquare,
  Award,
  Crown
} from 'lucide-react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';

// Danh sách các mẫu avatar phong cách doanh nghiệp hiện đại
const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Christian&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kimberly&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=adminManagerMaster&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Brian&backgroundColor=ffdfbf',
];

export function ProfileModal({ isOpen, onClose, currentUser, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security' | 'stats'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    avatar: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Tải thông tin ban đầu
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        avatar: currentUser.avatar || AVATAR_PRESETS[0],
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setMessage({ type: '', text: '' });

      // Tải thống kê hoạt động cá nhân
      api.getProfile(currentUser.id)
        .then((res) => {
          if (res?.data?.stats) {
            setStats(res.data.stats);
          }
        })
        .catch(() => {});

      // Tải danh mục phòng ban
      api.getCategories('DEPARTMENT')
        .then((res) => setDepartments(res?.data || []))
        .catch(() => {});
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate mật khẩu nếu có nhập đổi
    if (formData.new_password) {
      if (!formData.current_password) {
        setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại để xác thực!' });
        return;
      }
      if (formData.new_password.length < 6) {
        setMessage({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!' });
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.updateProfile({
        id: currentUser.id,
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        avatar: formData.avatar,
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      if (res.success && res.data?.user) {
        // Cập nhật localStorage
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        if (onUserUpdated) onUserUpdated(res.data.user);

        setMessage({
          type: 'success',
          text: formData.new_password
            ? 'Cập nhật thông tin & đổi mật khẩu thành công!'
            : 'Cập nhật thông tin cá nhân thành công!'
        });

        // Reset ô mật khẩu
        setFormData((prev) => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: '',
        }));

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin' });
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeInfo = {
    SUPER_ADMIN: { label: 'Tài Khoản Tổng (Master)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    ADMIN: { label: 'Quản Trị Viên (Admin)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    MANAGER: { label: 'Quản Lý Cấp Cao (Manager)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    STAFF: { label: 'Nhân Viên (Staff)', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  }[currentUser?.role || 'STAFF'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ Sơ & Thông Tin Cá Nhân"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* User Card Header Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col sm:flex-row items-center gap-4 shadow-soft">
          <div className="relative shrink-0">
            <img
              src={formData.avatar || currentUser?.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md bg-white/10"
            />
            {currentUser?.role === 'SUPER_ADMIN' && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                <Crown size={13} className="fill-slate-950" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-base font-bold truncate">{currentUser?.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeInfo.color}`}>
                {roleBadgeInfo.label}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">{currentUser?.email}</p>
            <p className="text-[11px] text-purple-300/80 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <Building2 size={12} />
              <span>{currentUser?.department || 'Ban Quản Trị'}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-pastel-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'info'
                ? 'bg-purple-600 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={14} />
            Thông Tin Cá Nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'security'
                ? 'bg-purple-600 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound size={14} />
            Đổi Mật Khẩu & Bảo Mật
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'stats'
                ? 'bg-purple-600 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award size={14} />
            Hoạt Động & Đóng Góp
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: THÔNG TIN CƠ BẢN */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-fade-in">
              {/* Chọn Avatar Nhanh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Ảnh Đại Diện (Avatar)</span>
                  <span className="text-[11px] font-normal text-slate-400">Chọn ảnh mẫu hoặc dán link ảnh</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-pastel-200 rounded-2xl">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: preset })}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition transform active:scale-95 ${
                        formData.avatar === preset
                          ? 'border-purple-600 ring-2 ring-purple-300 scale-105'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="Hoặc dán URL ảnh đại diện tùy chỉnh (https://...)"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Tên & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ Và Tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0988 888 999"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phòng ban */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Đăng Nhập / Email <span className="text-[10px] text-slate-400 font-normal">(Cố định)</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      disabled
                      value={currentUser?.email}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 border border-pastel-200 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phòng Ban / Chức Vụ</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    {departments.length > 0 ? (
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Ban Quản Trị / Kế Toán / IT..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                Để bảo vệ an toàn cho tài khoản doanh nghiệp, vui lòng nhập mật khẩu hiện tại trước khi tạo mật khẩu mới. Mật khẩu mới cần tối thiểu 6 ký tự.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật Khẩu Mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác Nhận Mật Khẩu Mới
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THỐNG KÊ HOẠT ĐỘNG CÁ NHÂN */}
          {activeTab === 'stats' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                  <CalendarCheck size={22} className="mx-auto text-indigo-600 mb-1.5" />
                  <div className="text-xl font-black text-indigo-950">
                    {stats?.totalAttendance ?? 0}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">Buổi Chấm Công</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <CheckSquare size={22} className="mx-auto text-amber-600 mb-1.5" />
                  <div className="text-xl font-black text-amber-950">
                    {stats?.assignedTasks ?? 0}
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Việc Được Giao</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 size={22} className="mx-auto text-emerald-600 mb-1.5" />
                  <div className="text-xl font-black text-emerald-950">
                    {stats?.completedTasks ?? 0}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Việc Hoàn Thành</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-pastel-200 rounded-2xl text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Tỷ lệ hoàn thành công việc:</span>
                  <span className="font-black text-emerald-600">
                    {stats && stats.assignedTasks > 0
                      ? `${Math.round((stats.completedTasks / stats.assignedTasks) * 100)}%`
                      : '100%'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats && stats.assignedTasks > 0
                          ? Math.min(100, Math.round((stats.completedTasks / stats.assignedTasks) * 100))
                          : 100
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-pastel-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-soft transition active:scale-95"
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
