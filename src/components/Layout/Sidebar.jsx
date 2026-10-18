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
  Cloud,
  ChevronRight,
  X
} from 'lucide-react';

export function Sidebar({
  currentTab,
  setCurrentTab,
  userRole = 'ADMIN',
  overdueCount = 0,
  isOpen = false,
  onClose
}) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'assets', label: 'Tài sản & Thiết bị', icon: Laptop, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'finance', label: 'Doanh thu & Chi phí', icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
    {
      id: 'tasks',
      label: 'Công việc & Nhắc hạn',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeType: 'danger',
      roles: ['ADMIN', 'MANAGER', 'STAFF']
    },
    { id: 'contracts', label: 'Hợp đồng & Biên bản', icon: FileText, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'attendance', label: 'Chấm công', icon: CalendarCheck, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: 'users', label: 'Quản lý Nhân sự', icon: Users, roles: ['ADMIN'] },
    { id: 'categories', label: 'Quản lý Danh mục', icon: FolderTree, roles: ['ADMIN'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const roleLabels = {
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
              <p className="text-[10px] text-pastel-600 font-bold uppercase tracking-wider">
                {roleLabels[userRole]?.label?.split(' ')[0] || userRole}
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

        {/* Database Status indicator at bottom */}
        <div className="p-4 border-t border-pastel-100 bg-surface-subtle/40">
          <div className="w-full p-3 rounded-xl bg-white border border-pastel-200/80 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Cloud size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-semibold text-slate-700 truncate">Cloudflare D1</p>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold truncate">
                Native Edge Connected
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
