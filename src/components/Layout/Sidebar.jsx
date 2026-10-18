import React from 'react';
import {
  LayoutDashboard,
  Laptop,
  TrendingUp,
  CheckSquare,
  FileText,
  CalendarCheck,
  Users,
  Cloud,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, isCloudflare, overdueCount = 0, onOpenCloudflare }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'assets', label: 'Tài sản & Thiết bị', icon: Laptop },
    { id: 'finance', label: 'Doanh thu & Chi phí', icon: TrendingUp },
    {
      id: 'tasks',
      label: 'Công việc & Nhắc hạn',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeType: 'danger'
    },
    { id: 'contracts', label: 'Hợp đồng & Biên bản', icon: FileText },
    { id: 'attendance', label: 'Chấm công', icon: CalendarCheck },
    { id: 'users', label: 'Nhân sự', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-pastel-200/70 flex flex-col h-screen sticky top-0 select-none shadow-[2px_0_12px_rgba(78,159,142,0.03)]">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-pastel-100 gap-3 bg-gradient-to-r from-pastel-50/60 to-white">
        <div className="w-9 h-9 rounded-xl bg-pastel-500 flex items-center justify-center text-white shadow-soft">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-800 leading-tight">OMNI ASSETS</h1>
          <p className="text-[11px] text-pastel-600 font-medium">Enterprise Suite</p>
        </div>
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
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-pastel-500 text-white shadow-soft font-semibold'
                  : 'text-slate-600 hover:bg-pastel-50/80 hover:text-pastel-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
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
        <button
          onClick={onOpenCloudflare}
          className="w-full p-3 rounded-xl bg-white hover:bg-pastel-50/50 border border-pastel-200/80 shadow-xs flex items-center gap-3 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-pastel-100 group-hover:bg-pastel-200 flex items-center justify-center text-pastel-600 transition-colors">
            <Cloud size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCloudflare ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
              <p className="text-xs font-semibold text-slate-700 truncate">Cloudflare D1</p>
            </div>
            <p className="text-[11px] text-pastel-600 font-medium truncate">
              {isCloudflare ? 'Edge Connected' : 'Cấu hình kết nối →'}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
