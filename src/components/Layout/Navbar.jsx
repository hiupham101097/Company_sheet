import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  User,
  Sparkles,
  Cloud
} from 'lucide-react';
import { api } from '../../services/api';

export function Navbar({ urgentReminders = [], onCheckInSuccess, currentUser, onOpenCloudflare, isCloudflare }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleQuickCheck = async (action) => {
    try {
      setIsChecking(true);
      const res = await api.checkAttendance({
        user_id: currentUser?.id || 'usr_1',
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-pastel-200/70 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Tìm tài sản, hợp đồng, nhân sự..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-pastel-50/60 border border-pastel-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-3">
        {/* Cloudflare Quick Button */}
        <button
          onClick={onOpenCloudflare}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 border border-pastel-200/80 transition-all"
        >
          <Cloud size={14} className={isCloudflare ? 'text-emerald-500' : 'text-amber-500'} />
          <span>{isCloudflare ? 'Cloudflare D1: Đã nối' : 'Nối Cloudflare'}</span>
        </button>

        {/* Quick Check-in/Check-out Buttons */}
        <div className="hidden sm:flex items-center gap-2 bg-pastel-50 p-1 rounded-xl border border-pastel-200/60">
          <button
            onClick={() => handleQuickCheck('CHECK_IN')}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-pastel-700 hover:text-pastel-800 shadow-xs hover:bg-pastel-100/50 transition-all"
          >
            <CheckCircle2 size={14} className="text-pastel-500" />
            <span>Check-in</span>
          </button>
          <button
            onClick={() => handleQuickCheck('CHECK_OUT')}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-all"
          >
            <Clock size={14} className="text-slate-400" />
            <span>Check-out</span>
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
          >
            <Bell size={18} />
            {urgentReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft-lg border border-pastel-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Thông báo & Nhắc hạn
                </span>
                <span className="text-[11px] font-semibold text-pastel-600">
                  {urgentReminders.length} nhắc nhở
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
                        className={`mt-0.5 p-1 rounded-md ${
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
                        <p className="text-[10px] text-slate-400 mt-0.5">Hạn: {item.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200/80">
          <img
            src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt="Avatar"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-pastel-200"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800">{currentUser?.name || 'Nguyễn Văn An'}</p>
            <p className="text-[10px] text-pastel-600 font-semibold">{currentUser?.department || 'Ban Giám Đốc'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
