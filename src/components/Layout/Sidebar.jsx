import React from 'react';
import {
  LayoutDashboard,
  Laptop,
  TrendingUp,
  CheckSquare,
  FileText,
  CalendarCheck,
  Users,
  FolderTree,
  Settings,
  ChevronRight,
  Crown,
  Zap,
  ShieldCheck,
  X
} from 'lucide-react';

export function Sidebar({
  currentTab,
  setCurrentTab,
  userRole = 'ADMIN',
  overdueCount = 0,
  isOpen = false,
  onClose,
  licenseInfo,
  onOpenUpgrade
}) {
  const allMenuItems = [
    {
      id: 'super-admin',
      label: 'Quản Trị Nền Tảng (Tổng)',
      icon: Crown,
      badge: 'Master',
      roles: ['SUPER_ADMIN']
    },
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'assets', label: 'Tài sản & Thiết bị', icon: Laptop, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'finance', label: 'Doanh thu & Chi phí', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    {
      id: 'tasks',
      label: 'Công việc & Nhắc hạn',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeType: 'danger',
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']
    },
    { id: 'contracts', label: 'Hợp đồng & Biên bản', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'attendance', label: 'Chấm công', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'users', label: 'Quản lý Nhân sự', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'categories', label: 'Quản lý Danh mục', icon: FolderTree, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const roleLabels = {
    SUPER_ADMIN: { label: 'Tài Khoản Tổng (Master)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ADMIN: { label: 'Quản Trị Viên (Admin)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    MANAGER: { label: 'Quản Lý (Manager)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    STAFF: { label: 'Nhân Viên (Staff)', color: 'bg-sky-50 text-sky-700 border-sky-200' }
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 w-64 bg-white border-r border-pastel-200/80 flex flex-col h-screen select-none shadow-soft transition-transform duration-250 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-pastel-100 bg-gradient-to-r from-pastel-50/70 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-pastel-200/90 p-1 flex items-center justify-center shadow-soft shrink-0">
              <img src="/logo.png" alt="OMNI ASSETS" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-slate-800 leading-tight">OMNI ASSETS</h1>
              <p className="text-[10px] text-pastel-600 font-bold uppercase tracking-wider truncate">
                {userRole === 'SUPER_ADMIN' ? 'Quản Trị Nền Tảng (Tổng)' : userRole === 'ADMIN' ? 'Quản Trị Viên' : userRole === 'MANAGER' ? 'Quản Lý Cấp Cao' : 'Nhân Viên'}
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Điều Hành
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-pastel-500 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-pastel-50/90 hover:text-pastel-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-pastel-600 transition-colors'}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-rose-600'
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight size={14} className="opacity-80" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* License Status Card in Sidebar */}
        <div className="px-3 pt-2">
          {licenseInfo?.isDemo ? (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>Bản Dùng Thử</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 leading-tight">
                Giới hạn 5 tài sản & 4 nhân sự.
              </p>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Crown size={13} className="text-amber-200" />
                <span>Nâng Cấp Bản Quyền</span>
              </button>
            </div>
          ) : (
            <div 
              onClick={onOpenUpgrade}
              className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Crown size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>Enterprise Full</span>
                    <ShieldCheck size={12} className="text-emerald-500" />
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Mở khóa toàn diện (∞)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Settings & System Info at bottom */}
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <div className="p-3 border-t border-pastel-100 bg-surface-subtle/30">
            <button
              onClick={() => handleSelectTab('settings')}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                currentTab === 'settings'
                  ? 'bg-pastel-500 text-white border-pastel-500 shadow-soft'
                  : 'bg-white border-pastel-200/90 text-slate-700 hover:bg-pastel-50/70 hover:border-pastel-300 shadow-xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  currentTab === 'settings' ? 'bg-white/20 text-white' : 'bg-pastel-100 text-pastel-700'
                }`}
              >
                <Settings size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Cài Đặt Hệ Thống</p>
                <p
                  className={`text-[10px] truncate ${
                    currentTab === 'settings' ? 'text-pastel-100' : 'text-slate-400'
                  }`}
                >
                  Chấm công & Trang web
                </p>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
