import React, { useState, useEffect, useRef } from 'react';
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
  RotateCw,
  X,
  ChevronRight,
  Key,
  User,
  Copy,
  Check,
  FileText,
  CheckSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDateVN } from '../../utils/formatters';
import { getBrandDisplayName, getShortBrandName } from '../../utils/brandHelper';

export function Navbar({
  urgentReminders = [],
  onCheckInSuccess,
  currentUser,
  attendanceList = [],
  onLogout,
  onToggleSidebar,
  onNavigate,
  licenseInfo,
  onOpenUpgrade,
  onOpenProfile,
  brandName,
  companyName
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshingReminders, setIsRefreshingReminders] = useState(false);

  const settingsRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyKey = (keyText) => {
    if (navigator?.clipboard?.writeText && keyText) {
      navigator.clipboard.writeText(keyText);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

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
        {(() => {
          const resolvedBrand = brandName || getBrandDisplayName({ licenseInfo, companyName, currentUser });
          const shortName = getShortBrandName(resolvedBrand);

          return (
            <div className="flex items-center gap-1.5 lg:hidden shrink-0 max-w-[140px]">
              <img src="/logo.png" alt={resolvedBrand} className="w-7 h-7 object-contain rounded-lg shrink-0" />
              <span
                title={resolvedBrand}
                className="text-xs font-black tracking-tight text-slate-800 hidden xs:inline sm:inline truncate"
              >
                {shortName}
              </span>
            </div>
          );
        })()}

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
        {/* Quick Check-in/Check-out Buttons with Strict Daily State (Only for Tenant Staff/Admin, not Super Admin) */}
        {currentUser?.role !== 'SUPER_ADMIN' && (
          isCheckedOut ? (
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
          )
        )}

        {/* License Status Badge / Master Badge */}
        {currentUser?.role === 'SUPER_ADMIN' ? (
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold shadow-xs select-none"
            title="Tài khoản Master Quản Trị Nền Tảng Tối Cao"
          >
            <Crown size={14} className="text-purple-600 shrink-0" />
            <span className="text-[11px] font-bold">Quản Trị Nền Tảng</span>
          </div>
        ) : licenseInfo?.isDemo ? (
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

        {/* Settings button & Quick Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu);
              setShowNotifications(false);
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showSettingsMenu
                ? 'bg-pastel-100 text-pastel-700 ring-2 ring-pastel-300'
                : 'text-slate-500 hover:text-pastel-700 hover:bg-pastel-50'
            }`}
            title="Cài đặt hệ thống & tuỳ chọn nhanh"
          >
            <Settings size={18} className={showSettingsMenu ? 'rotate-45 transition-transform duration-200' : 'transition-transform duration-200'} />
          </button>

          {/* Quick Settings Dropdown Menu */}
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-72 max-w-[92vw] bg-white rounded-2xl shadow-soft-lg border border-pastel-200 py-2 z-50 animate-scale-in">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-pastel-50/50">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={13} className="text-pastel-600" />
                  Cài Đặt & Tuỳ Chọn Nhanh
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Truy cập nhanh các mục quản trị hệ thống
                </p>
              </div>

              <div className="p-1.5 space-y-1">
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('settings');
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-pastel-50 transition flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pastel-100 text-pastel-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Settings size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-pastel-700 transition">
                        Cài Đặt Hệ Thống & Chấm Công
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Giờ ca, ân hạn, tên công ty & web
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-pastel-600 shrink-0" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-pastel-50 transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                      Hồ Sơ Cá Nhân & Đổi Mật Khẩu
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser?.name} • {currentUser?.department || 'Thành viên'}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenUpgrade) onOpenUpgrade();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-pastel-50 transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Crown size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition">
                      Bản Quyền & Gói Cước
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {licenseInfo?.isDemo ? 'Bản Dùng thử (Demo) • Nâng cấp' : 'Enterprise Vĩnh Viễn Đã Kích Hoạt'}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-amber-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRefreshReminders();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-pastel-50 transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <RotateCw size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition">
                      Làm Mới Dữ Liệu
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Đồng bộ lại toàn bộ số liệu hệ thống
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-600 shrink-0" />
                </button>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 transition flex items-center gap-3 cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span className="text-xs font-bold">Đăng Xuất Tài Khoản</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSettingsMenu(false);
            }}
            className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
              showNotifications
                ? 'bg-pastel-100 text-pastel-700 ring-2 ring-pastel-300'
                : 'text-slate-500 hover:text-pastel-700 hover:bg-pastel-50'
            }`}
            title="Thông báo & Nhắc hạn"
          >
            <Bell size={18} />
            {urgentReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 max-w-[92vw] bg-white rounded-2xl shadow-soft-lg border border-pastel-200 py-2 z-50 animate-scale-in">
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
                      className="p-1 rounded-lg hover:bg-pastel-100 text-pastel-600 transition-colors cursor-pointer"
                      title="Làm mới nhắc hạn ngay"
                    >
                      <RotateCw size={13} className={isRefreshingReminders ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-pastel-700 font-medium mt-1 flex items-center gap-1">
                  <Clock size={11} className="text-pastel-500 shrink-0" />
                  <span>Nhấp vào thông báo bất kỳ để xem chi tiết & xử lý</span>
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {urgentReminders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không có thông báo khẩn cấp nào
                  </div>
                ) : (
                  urgentReminders.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setSelectedReminder(item);
                        setShowNotifications(false);
                      }}
                      className="w-full text-left p-3 hover:bg-pastel-50/70 transition-colors flex items-start gap-2.5 cursor-pointer group"
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
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed group-hover:text-pastel-700 transition">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Hạn: {formatDateVN(item.date)}
                          </span>
                          <span className="text-[10px] font-bold text-pastel-600 group-hover:underline flex items-center gap-0.5">
                            Xem chi tiết ➔
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-pastel-600 shrink-0 mt-1" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Chi Tiết Thông Báo Khi Người Dùng Nhấp Vào */}
        {selectedReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-in">
              {/* Header Modal */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-pastel-50/40">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedReminder.level === 'danger'
                        ? 'bg-rose-100 text-rose-600'
                        : selectedReminder.level === 'warning'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-sky-100 text-sky-600'
                    }`}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      Chi Tiết Thông Báo & Nhắc Hạn
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Hệ thống tự động theo dõi thời gian thực
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReminder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-5 space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nội dung thông báo:
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {selectedReminder.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px]">Ngày ghi nhận / Hạn:</span>
                    <div className="font-bold text-slate-700 mt-0.5">
                      {formatDateVN(selectedReminder.date)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px]">Mức độ ưu tiên:</span>
                    <div className="font-bold mt-0.5">
                      {selectedReminder.level === 'danger' ? (
                        <span className="text-rose-600 font-extrabold">🔴 Quá hạn / Khẩn</span>
                      ) : selectedReminder.level === 'warning' ? (
                        <span className="text-amber-600 font-extrabold">🟡 Cảnh báo / Sắp tới</span>
                      ) : (
                        <span className="text-sky-600 font-extrabold">🔵 Thông tin chung</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nếu là thông báo cấp mã key bản quyền */}
                {selectedReminder.key && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 rounded-2xl space-y-2">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      Mã Bản Quyền Của Bạn:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedReminder.key}
                        className="flex-1 px-3 py-2 bg-white rounded-xl font-mono text-xs font-black text-indigo-700 border border-indigo-200 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyKey(selectedReminder.key)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedKey ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-5 pt-0 flex items-center gap-2.5">
                {selectedReminder.key ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReminder(null);
                      if (onOpenUpgrade) onOpenUpgrade();
                    }}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key size={14} />
                    <span>Kích Hoạt Bản Quyền Ngay</span>
                  </button>
                ) : selectedReminder.id?.startsWith('ctr_') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReminder(null);
                      if (onNavigate) onNavigate('contracts');
                    }}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>Đi Đến Hợp Đồng ➔</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReminder(null);
                      if (onNavigate) onNavigate('tasks');
                    }}
                    className="flex-1 py-2.5 px-4 bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckSquare size={14} />
                    <span>Đi Đến Công Việc ➔</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReminder(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Info & Logout */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200/80">
          <div
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition group p-1 -m-1 rounded-xl hover:bg-slate-100/80 select-none"
            title="Nhấp để cập nhật thông tin cá nhân & đổi mật khẩu"
          >
            <div className="relative">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt="Avatar"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-pastel-200 group-hover:ring-purple-400 transition"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-purple-700 transition">
                {currentUser?.name || 'Nguyễn Văn An'}
              </p>
              <p className="text-[10px] text-pastel-600 font-semibold">{currentUser?.department || 'Ban Giám Đốc'}</p>
            </div>
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
