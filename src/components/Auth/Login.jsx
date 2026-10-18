import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Building2, User } from 'lucide-react';
import { api } from '../../services/api';

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('an.nguyen@enterprise.vn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-white to-pastel-100 flex items-center justify-center p-4 selection:bg-pastel-200 selection:text-pastel-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-lg border border-pastel-200/80 p-8 space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-pastel-200/90 p-1.5 flex items-center justify-center mx-auto shadow-soft">
            <img src="/logo.png" alt="OMNI ASSETS" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">OMNI ASSETS</h2>
          <p className="text-xs text-pastel-600 font-semibold tracking-wide uppercase">
            Hệ Thống Quản Trị Tài Sản & Vận Hành Doanh Nghiệp
          </p>
        </div>

        {/* Quick Account Switcher (Tài khoản mẫu) */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
            Chọn nhanh tài khoản truy cập
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
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email công ty</label>
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
            <p className="text-[11px] text-slate-400 mt-1">Mật khẩu mặc định: <code className="font-mono text-pastel-600 font-bold">123456</code></p>
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

        {/* Cloudflare D1 Native Security Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Bảo mật & vận hành trên Cloudflare D1 Edge</span>
        </div>
      </div>
    </div>
  );
}
