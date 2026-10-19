import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Sparkles,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  ChevronLeft
} from 'lucide-react';
import { api } from '../../services/api';

export function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [email, setEmail] = useState('an.nguyen@enterprise.vn');
  const [password, setPassword] = useState('123456');

  // Register form state
  const [registerData, setRegisterData] = useState({
    company_name: '',
    tax_id: '',
    industry: 'Công nghệ thông tin & Phần mềm',
    company_address: '',
    company_phone: '',
    company_email: '',
    admin_name: '',
    admin_title: 'Tổng Giám Đốc (CEO)',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_confirm_password: '',
  });

  const sampleAccounts = [
    {
      name: 'Nguyễn Văn An',
      role: 'ADMIN (Ban Giám Đốc)',
      email: 'an.nguyen@enterprise.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      name: 'Trần Thị Mai',
      role: 'MANAGER (Kế Toán & Tài Chính)',
      email: 'mai.tran@enterprise.vn',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      name: 'Lê Hoàng Nam',
      role: 'STAFF (Kỹ Thuật & IT)',
      email: 'nam.le@enterprise.vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
    }
  ];

  const handleQuickSelect = (acc) => {
    setEmail(acc.email);
    setPassword('123456');
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.data?.user) {
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      } else {
        setError(res.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (field, val) => {
    setRegisterData((prev) => ({ ...prev, [field]: val }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate inputs
    if (!registerData.company_name.trim()) {
      setError('Vui lòng nhập tên doanh nghiệp');
      return;
    }
    if (!registerData.admin_name.trim()) {
      setError('Vui lòng nhập họ tên Quản trị viên');
      return;
    }
    if (!registerData.admin_email.trim()) {
      setError('Vui lòng nhập email quản trị');
      return;
    }
    if (!registerData.admin_password || registerData.admin_password.length < 6) {
      setError('Mật khẩu quản trị phải có tối thiểu 6 ký tự');
      return;
    }
    if (registerData.admin_password !== registerData.admin_confirm_password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerCompany(registerData);
      if (res.success && res.data?.user) {
        setSuccessMsg('Đăng ký doanh nghiệp thành công! Đang chuyển hướng vào hệ thống...');
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.data.user);
        }, 1200);
      } else {
        setError(res.message || 'Lỗi khi đăng ký doanh nghiệp');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-white to-pastel-100 flex items-center justify-center p-4 selection:bg-pastel-200 selection:text-pastel-900 font-sans">
      <div
        className={`w-full ${
          mode === 'REGISTER' ? 'max-w-2xl' : 'max-w-md'
        } bg-white rounded-3xl shadow-soft-lg border border-pastel-200/80 p-6 sm:p-8 space-y-6 transition-all duration-300 animate-fade-in`}
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-pastel-200/90 p-1.5 flex items-center justify-center mx-auto shadow-soft">
            <img src="/logo.png" alt="OMNI ASSETS" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">OMNI ASSETS</h2>
          <p className="text-xs text-pastel-600 font-semibold tracking-wide uppercase">
            Hệ Thống Quản Trị Tài Sản & Vận Hành Doanh Nghiệp
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-slate-100/80 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'LOGIN'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-pastel-500 text-white shadow-soft'
                : 'text-pastel-700 hover:text-pastel-900'
            }`}
          >
            <Sparkles size={13} />
            <span>Đăng Ký Doanh Nghiệp</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-scale-in">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-scale-in">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* ================= MODE: LOGIN ================= */}
        {mode === 'LOGIN' && (
          <div className="space-y-6">
            {/* Quick Account Switcher (Tài khoản mẫu) */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Chọn nhanh tài khoản mẫu
              </p>
              <div className="space-y-1.5">
                {sampleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSelect(acc)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      email === acc.email
                        ? 'border-pastel-500 bg-pastel-50/70 shadow-xs'
                        : 'border-slate-200/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{acc.name}</p>
                        <p className="text-[10px] text-slate-400">{acc.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.badgeColor}`}>
                      {acc.role.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email đăng nhập</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@enterprise.vn"
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mật khẩu mặc định: <code className="font-mono text-pastel-600 font-bold">123456</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                <ArrowRight size={15} />
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="text-xs text-pastel-700 hover:text-pastel-800 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>Bạn muốn tạo mới doanh nghiệp của mình?</span>
                <strong className="text-pastel-600">Đăng ký ngay</strong>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE: REGISTER ================= */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Step 1: Company Profile */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-pastel-100 pb-2">
                <Building2 size={16} className="text-pastel-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Thông Tin Doanh Nghiệp
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Doanh Nghiệp / Công Ty *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.company_name}
                    onChange={(e) => handleRegisterChange('company_name', e.target.value)}
                    placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ Á CHÂU..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={registerData.tax_id}
                    onChange={(e) => handleRegisterChange('tax_id', e.target.value)}
                    placeholder="010xxxxxxx..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lĩnh vực hoạt động
                  </label>
                  <select
                    value={registerData.industry}
                    onChange={(e) => handleRegisterChange('industry', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="Công nghệ thông tin & Phần mềm">Công nghệ thông tin & Phần mềm</option>
                    <option value="Sản xuất & Chế tạo">Sản xuất & Chế tạo</option>
                    <option value="Bán lẻ & Chuỗi cửa hàng">Bán lẻ & Chuỗi cửa hàng</option>
                    <option value="Logistics & Kho vận">Logistics & Kho vận</option>
                    <option value="Tài chính & Dịch vụ">Tài chính & Dịch vụ</option>
                    <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                    <option value="Khác">Lĩnh vực khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotline / Điện thoại công ty
                  </label>
                  <input
                    type="text"
                    value={registerData.company_phone}
                    onChange={(e) => handleRegisterChange('company_phone', e.target.value)}
                    placeholder="1900 xxxx hoặc 028 xxx..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa chỉ trụ sở
                  </label>
                  <input
                    type="text"
                    value={registerData.company_address}
                    onChange={(e) => handleRegisterChange('company_address', e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Super Admin User Profile */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-pastel-100 pb-2">
                <User size={16} className="text-pastel-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Tài Khoản Quản Trị Viên (Super Admin)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Quản trị viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.admin_name}
                    onChange={(e) => handleRegisterChange('admin_name', e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chức danh / Vị trí
                  </label>
                  <select
                    value={registerData.admin_title}
                    onChange={(e) => handleRegisterChange('admin_title', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="Tổng Giám Đốc (CEO)">Tổng Giám Đốc (CEO)</option>
                    <option value="Chủ Tịch Hội Đồng Quản Trị">Chủ Tịch Hội Đồng Quản Trị</option>
                    <option value="Giám Đốc Vận Hành (COO)">Giám Đốc Vận Hành (COO)</option>
                    <option value="Trưởng Ban Quản Trị">Trưởng Ban Quản Trị</option>
                    <option value="Quản Trị Viên Hệ Thống">Quản Trị Viên Hệ Thống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email đăng nhập quản trị *
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.admin_email}
                    onChange={(e) => handleRegisterChange('admin_email', e.target.value)}
                    placeholder="admin@tencongty.vn"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại cá nhân
                  </label>
                  <input
                    type="text"
                    value={registerData.admin_phone}
                    onChange={(e) => handleRegisterChange('admin_phone', e.target.value)}
                    placeholder="0909 xxx xxx..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu quản trị *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.admin_password}
                    onChange={(e) => handleRegisterChange('admin_password', e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.admin_confirm_password}
                    onChange={(e) => handleRegisterChange('admin_confirm_password', e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-pastel-50/70 border border-pastel-200/80 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck size={16} className="text-pastel-600 shrink-0 mt-0.5" />
              <span>
                Tài khoản này sẽ được cấp quyền <strong>Quản Trị Viên (ADMIN)</strong> tối cao: toàn quyền quản lý tài sản, nhân sự, danh mục, thiết lập ca làm việc và dữ liệu doanh nghiệp.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Quay lại</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Đang tạo hệ thống...' : 'Hoàn Tất Đăng Ký & Khởi Tạo'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* Security & Corporate Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-pastel-600" />
          <span>Hệ thống bảo mật nội bộ & mã hóa dữ liệu đa tầng</span>
        </div>
      </div>
    </div>
  );
}
