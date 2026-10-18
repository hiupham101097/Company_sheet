import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  Cloud,
  Menu
} from 'lucide-react';
import { api } from '../../services/api';

export function Navbar({
  urgentReminders = [],
  onCheckInSuccess,
  currentUser,
  onLogout,
  onToggleSidebar
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleQuickCheck = async (action) => {
    const targetUserId = currentUser?.id || 'usr_1';
    try {
      setIsChecking(true);
      const res = await api.checkAttendance({
        user_id: targetUserId,
        action
      });
      alert(res.message);
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi chấm công');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-pastel-200/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-pastel-700 hover:bg-pastel-50 transition-colors lg:hidden shrink-0"
          title="Mở menu"
        >
          <Menu size={20} />
        </button>

        {/* Responsive Search Input */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Tìm tài sản, hợp đồng, nhân sự..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-pastel-50/70 border border-pastel-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Cloudflare Native Connected Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-emerald-50/80 text-emerald-700 border border-emerald-200">
          <Cloud size={13} className="text-emerald-500" />
          <span>Cloudflare D1: Connected</span>
        </div>

        {/* Quick Check-in/Check-out Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-pastel-50 p-1 rounded-xl border border-pastel-200/70">
          <button
            onClick={() => handleQuickCheck('CHECK_IN')}
            disabled={isChecking}
            title="Điểm danh vào ca"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-pastel-700 hover:text-pastel-800 shadow-xs hover:bg-pastel-100/60 transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={13} className="text-pastel-500" />
            <span className="hidden sm:inline">Check-in</span>
          </button>
          <button
            onClick={() => handleQuickCheck('CHECK_OUT')}
            disabled={isChecking}
            title="Điểm danh tan ca"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-all disabled:opacity-50"
          >
            <Clock size={13} className="text-slate-400" />
            <span className="hidden sm:inline">Check-out</span>
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
            title="Thông báo"
          >
            <Bell size={18} />
            {urgentReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-soft-lg border border-pastel-200 py-2 z-50 animate-scale-in">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-pastel-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Thông Báo & Nhắc Hạn
                </span>
                <span className="text-[11px] font-semibold text-pastel-700 bg-pastel-100 px-2 py-0.5 rounded-full">
                  {urgentReminders.length} việc
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {urgentReminders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không có thông báo khẩn cấp nào
                  </div>
                ) : (
                  urgentReminders.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-pastel-50/50 transition-colors flex items-start gap-2.5"
                    >
                      <div
                        className={`mt-0.5 p-1 rounded-md shrink-0 ${
                          item.level === 'danger'
                            ? 'bg-rose-100 text-rose-600'
                            : item.level === 'warning'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-sky-100 text-sky-600'
                        }`}
                      >
                        <AlertTriangle size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Hạn: {item.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Logout */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200/80">
          <img
            src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt="Avatar"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-pastel-200"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.name || 'Nguyễn Văn An'}</p>
            <p className="text-[10px] text-pastel-600 font-semibold">{currentUser?.department || 'Ban Giám Đốc'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
