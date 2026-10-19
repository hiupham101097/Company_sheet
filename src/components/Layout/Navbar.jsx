import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  Settings,
  Menu,
  Crown,
  Zap,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDateVN } from '../../utils/formatters';

export function Navbar({
  urgentReminders = [],
  onCheckInSuccess,
  currentUser,
  attendanceList = [],
  onLogout,
  onToggleSidebar,
  onNavigate,
  licenseInfo,
  onOpenUpgrade
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshingReminders, setIsRefreshingReminders] = useState(false);

  const handleRefreshReminders = async () => {
    try {
      setIsRefreshingReminders(true);
      await api.refreshReminders();
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err) {
      console.error('Lỗi làm mới nhắc hạn:', err);
    } finally {
      setIsRefreshingReminders(false);
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const currentUserId = currentUser?.id || 'usr_1';
  const myTodayRecord = attendanceList?.find(
    (att) => att.user_id === currentUserId && att.date === todayStr
  );
  const isCheckedIn = !!myTodayRecord?.check_in;
  const isCheckedOut = !!myTodayRecord?.check_out;

  const handleQuickCheck = async (action) => {
    if (action === 'CHECK_IN') {
      if (isCheckedIn) {
        if (isCheckedOut) {
          alert(`Bạn đã hoàn tất ca làm việc hôm nay (đã Check-out lúc ${myTodayRecord.check_out}). Vui lòng chờ đến ngày mai để bắt đầu ca mới!`);
        } else {
          alert(`Bạn đã điểm danh vào ca hôm nay lúc ${myTodayRecord.check_in}. Một ngày chỉ được điểm danh vào ca 1 lần!`);
        }
        return;
      }
    }

    if (action === 'CHECK_OUT') {
      if (!isCheckedIn) {
        alert('Bạn chưa điểm danh vào ca (Check-in) trong ngày hôm nay nên chưa thể tan ca!');
        return;
      }
      if (isCheckedOut) {
        alert(`Bạn đã điểm danh tan ca hôm nay lúc ${myTodayRecord.check_out} rồi!`);
        return;
      }
    }

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
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-pastel-700 hover:bg-pastel-50 transition-colors lg:hidden shrink-0"
          title="Mở menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Brand Logo & Name */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          <img src="/logo.png" alt="OMNI ASSETS" className="w-7 h-7 object-contain rounded-lg" />
          <span className="text-xs font-black tracking-tight text-slate-800 hidden xs:inline sm:inline">OMNI</span>
        </div>

        {/* Search Input - Hidden on mobile, visible on tablet/desktop */}
        <div className="hidden sm:block relative w-full max-w-xs md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Tìm tài sản, hợp đồng, nhân sự..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-pastel-50/70 border border-pastel-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Check-in/Check-out Buttons with Strict Daily State */}
        {isCheckedOut ? (
          <div
            title={`Bạn đã hoàn thành ca làm việc hôm nay lúc ${myTodayRecord.check_out} (Tổng giờ: ${myTodayRecord.total_hours || 0}h). Hẹn gặp lại ngày mai!`}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs cursor-default select-none"
          >
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Hoàn thành ca ({myTodayRecord.check_out})</span>
            <span className="sm:hidden">Đã tan ca</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-pastel-50 p-1 rounded-xl border border-pastel-200/70">
            <button
              onClick={() => handleQuickCheck('CHECK_IN')}
              disabled={isChecking || isCheckedIn}
              title={isCheckedIn ? `Đã vào ca lúc ${myTodayRecord.check_in}. Một ngày chỉ check-in 1 lần!` : "Điểm danh vào ca hôm nay"}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isCheckedIn
                  ? 'bg-emerald-50 text-emerald-700 opacity-80 cursor-not-allowed font-bold'
                  : 'bg-white text-pastel-700 hover:text-pastel-800 shadow-xs hover:bg-pastel-100/60'
              } disabled:opacity-60`}
            >
              <CheckCircle2 size={13} className={isCheckedIn ? 'text-emerald-600' : 'text-pastel-500'} />
              <span className="hidden sm:inline">
                {isCheckedIn ? `Đã vào (${myTodayRecord.check_in})` : 'Vào ca'}
              </span>
            </button>
            <button
              onClick={() => handleQuickCheck('CHECK_OUT')}
              disabled={isChecking || !isCheckedIn}
              title={!isCheckedIn ? "Cần vào ca trước khi tan ca" : "Điểm danh tan ca"}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isCheckedIn
                  ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-xs'
                  : 'text-slate-400 bg-slate-100/60 opacity-50 cursor-not-allowed'
              }`}
            >
              <Clock size={13} className={isCheckedIn ? 'text-white' : 'text-slate-400'} />
              <span className="hidden sm:inline">Tan ca</span>
            </button>
          </div>
        )}

        {/* License Status Badge */}
        {licenseInfo?.isDemo ? (
          <button
            onClick={() => onOpenUpgrade && onOpenUpgrade('Khám phá và nâng cấp Bản Quyền Enterprise để mở khóa toàn bộ hệ thống')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            title="Đang dùng bản Demo - Bấm để nâng cấp Enterprise"
          >
            <Crown size={13} className="text-amber-200 shrink-0" />
            <span className="text-[11px]">Demo</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenUpgrade && onOpenUpgrade()}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs transition-all"
            title="Bản Quyền Enterprise Vĩnh Viễn"
          >
            <Crown size={13} className="text-amber-500 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Enterprise</span>
          </button>
        )}

        {/* Settings button (Hidden on small mobile, accessible from sidebar) */}
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && onNavigate && (
          <button
            onClick={() => onNavigate('settings')}
            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-pastel-700 hover:bg-pastel-50 transition-colors"
            title="Cài đặt hệ thống & chấm công"
          >
            <Settings size={18} />
          </button>
        )}

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
              <div className="px-4 py-2.5 border-b border-slate-100 bg-pastel-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Thông Báo & Nhắc Hạn
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-pastel-700 bg-pastel-100 px-2 py-0.5 rounded-full">
                      {urgentReminders.length} việc
                    </span>
                    <button
                      onClick={handleRefreshReminders}
                      disabled={isRefreshingReminders}
                      className="p-1 rounded-lg hover:bg-pastel-100 text-pastel-600 transition-colors"
                      title="Làm mới nhắc hạn ngay (Hệ thống tự động chạy lúc 06:00 AM mỗi ngày)"
                    >
                      <RotateCw size={13} className={isRefreshingReminders ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-pastel-700 font-medium mt-1 flex items-center gap-1">
                  <Clock size={11} className="text-pastel-500 shrink-0" />
                  <span>Tự động làm mới: 06:00 sáng mỗi ngày</span>
                </p>
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
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Hạn: {formatDateVN(item.date)}
                        </p>
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
