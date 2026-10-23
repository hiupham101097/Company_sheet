import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  RefreshCw,
  Key
} from 'lucide-react';
import { api } from '../../services/api';

export function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [registerStep, setRegisterStep] = useState('FORM'); // 'FORM' or 'OTP'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // OTP Verification state
  const [otp, setOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

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

  // Countdown timer effect
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
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
    if (!registerData.admin_email.trim() || !registerData.admin_email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email quản trị hợp lệ để nhận mã OTP');
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
      setSendingOtp(true);
      const res = await api.sendRegistrationOtp({
        admin_email: registerData.admin_email,
        company_name: registerData.company_name
      });
      if (res.success) {
        setRegisterStep('OTP');
        setOtpCountdown(60);
        setSuccessMsg(`Mã OTP 6 số đã được gửi tới ${registerData.admin_email}. Vui lòng kiểm tra hộp thư!`);
      } else {
        setError(res.message || 'Lỗi khi gửi mã xác thực OTP');
      }
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP, vui lòng kiểm tra lại email');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp || otp.trim().length < 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã OTP xác thực');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerCompany({
        ...registerData,
        otp: otp.trim()
      });
      if (res.success && res.data?.user) {
        setSuccessMsg('Xác thực OTP thành công! Đang chuyển hướng vào hệ thống...');
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.data.user);
        }, 1200);
      } else {
        setError(res.message || 'Lỗi khi xác thực OTP');
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
          <div className="space-y-6">
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    registerStep === 'FORM'
                      ? 'bg-pastel-500 text-white shadow-soft'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {registerStep === 'OTP' ? <CheckCircle2 size={16} /> : '1'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Thông Tin Khởi Tạo</p>
                  <p className="text-[10px] text-slate-400">Doanh nghiệp & Quản trị</p>
                </div>
              </div>

              <div className={`h-0.5 flex-1 mx-3 ${registerStep === 'OTP' ? 'bg-emerald-400' : 'bg-slate-200'}`} />

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    registerStep === 'OTP'
                      ? 'bg-pastel-500 text-white shadow-soft ring-4 ring-pastel-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Xác Thực OTP</p>
                  <p className="text-[10px] text-slate-400">Kích hoạt qua email</p>
                </div>
              </div>
            </div>

            {/* STEP 1: Registration Form */}
            {registerStep === 'FORM' && (
              <form onSubmit={handleRequestOtp} className="space-y-6 animate-fade-in">
                {/* 1. Thông Tin Doanh Nghiệp */}
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

                {/* 2. Tài Khoản Quản Trị Viên */}
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
                        Email nhận mã OTP & Quản trị *
                      </label>
                      <input
                        type="email"
                        required
                        value={registerData.admin_email}
                        onChange={(e) => handleRegisterChange('admin_email', e.target.value)}
                        placeholder="admin@tencongty.vn"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-800 font-medium"
                      />
                      <p className="text-[10px] text-pastel-600 mt-1">
                        Mã OTP xác thực sẽ được gửi trực tiếp đến địa chỉ email này.
                      </p>
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
                    Hệ thống sẽ gửi một mã OTP gồm 6 chữ số đến hộp thư <strong>{registerData.admin_email || 'của bạn'}</strong> để xác thực quyền quản trị trước khi kích hoạt tenant.
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
                    disabled={sendingOtp}
                    className="flex-1 py-2.5 px-4 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {sendingOtp ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Đang gửi mã OTP qua email...</span>
                      </>
                    ) : (
                      <>
                        <span>Tiếp Tục &amp; Nhận Mã OTP Qua Email</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: OTP Verification Card */}
            {registerStep === 'OTP' && (
              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-6 animate-scale-in">
                <div className="text-center space-y-2 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-soft">
                    <Key size={26} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Xác Thực Mã OTP Doanh Nghiệp</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Mã xác thực gồm 6 chữ số đã được gửi tới hộp thư:
                    <br />
                    <span className="font-bold text-slate-800 font-mono text-sm">{registerData.admin_email}</span>
                  </p>
                </div>

                {/* OTP Code Input */}
                <div className="max-w-xs mx-auto space-y-2">
                  <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nhập Mã OTP 6 Chữ Số
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full py-3 text-center text-2xl font-mono font-bold tracking-[0.5em] bg-slate-50 border-2 border-emerald-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 focus:bg-white text-slate-800 shadow-inner transition-all"
                  />
                  <p className="text-[11px] text-center text-slate-400">
                    Mã OTP có hiệu lực trong vòng 5 phút
                  </p>
                </div>

                {/* Resend Countdown Link */}
                <div className="text-center">
                  {otpCountdown > 0 ? (
                    <p className="text-xs text-slate-400 font-medium">
                      Gửi lại mã OTP sau <span className="font-bold text-pastel-600 font-mono">{otpCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={sendingOtp}
                      onClick={handleRequestOtp}
                      className="text-xs text-pastel-600 hover:text-pastel-700 font-bold hover:underline inline-flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} className={sendingOtp ? 'animate-spin' : ''} />
                      <span>{sendingOtp ? 'Đang gửi lại...' : 'Chưa nhận được? Bấm gửi lại mã OTP'}</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('FORM');
                      setError(null);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Sửa email / thông tin</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Đang kích hoạt tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Xác Nhận &amp; Kích Hoạt Doanh Nghiệp</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
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
