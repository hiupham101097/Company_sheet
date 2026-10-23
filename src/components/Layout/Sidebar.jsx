import React, { useState, useEffect } from 'react';
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
  User,
  X,
  Building2,
  KeyRound,
  Package,
  Receipt,
  BarChart3,
  Megaphone,
  HelpCircle
} from 'lucide-react';
import { getBrandDisplayName } from '../../utils/brandHelper';
import { canAccessTab } from '../../utils/permissionHelper';
import { api } from '../../services/api';

export function Sidebar({
  currentTab,
  setCurrentTab,
  userRole = 'ADMIN',
  currentUser,
  companySettings,
  overdueCount = 0,
  isOpen = false,
  onClose,
  licenseInfo,
  onOpenUpgrade,
  onOpenProfile,
  brandName,
  companyName
}) {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      api.getSuperAdminOverview()
        .then(res => {
          if (res?.data?.stats?.pendingOrdersCount !== undefined) {
            setPendingOrdersCount(res.data.stats.pendingOrdersCount);
          }
        })
        .catch(() => {});
    }
  }, [userRole, currentTab]);

  const superAdminMenuItems = [
    { id: 'overview', label: 'Thống Kê Nền Tảng & User', icon: BarChart3, badge: 'Master' },
    { id: 'companies', label: 'Duyệt Doanh Nghiệp & Quyền', icon: Building2 },
    { id: 'keys', label: 'Tạo Keys Bản Quyền', icon: KeyRound, badge: 'Keys' },
    { id: 'plans', label: 'Xây Dựng Gói Cước', icon: Package },
    { id: 'support-desk', label: 'Hòm Thư Hỗ Trợ (Tickets)', icon: HelpCircle, badge: 'Tickets' },
    { id: 'announcements', label: 'Phát Thư Gói Dịch Vụ', icon: Megaphone, badge: 'Resend' },
    { 
      id: 'revenue', 
      label: 'Doanh Thu & Hóa Đơn', 
      icon: Receipt,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} chờ` : null,
      badgeType: pendingOrdersCount > 0 ? 'warning' : null
    },
    { id: 'settings', label: 'Cài Đặt Cốt Lõi Hệ Thống', icon: Settings, badge: 'Core' },
  ];

  const tenantMenuItems = [
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
    { id: 'users', label: 'Quản lý Nhân sự', icon: Users },
    { id: 'categories', label: 'Quản lý Danh mục', icon: FolderTree },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  const effectiveUser = currentUser || { role: userRole };
  const menuItems = userRole === 'SUPER_ADMIN'
    ? superAdminMenuItems
    : tenantMenuItems.filter((item) => canAccessTab(effectiveUser, companySettings, item.id));

  const roleLabels = {
    SUPER_ADMIN: { label: 'Quản Trị Nền Tảng (Master Admin)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ADMIN: { label: 'Quản Trị Doanh Nghiệp (Admin Công Ty)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
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
        {(() => {
          const resolvedBrand = brandName || getBrandDisplayName({ licenseInfo, companyName });

          return (
            <div className="h-16 flex items-center justify-between px-6 border-b border-pastel-100 bg-gradient-to-r from-pastel-50/70 to-white">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-pastel-200/90 p-1 flex items-center justify-center shadow-soft shrink-0">
                  <img src="/logo.png" alt={resolvedBrand} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h1
                      title={resolvedBrand}
                      className="text-sm font-bold tracking-tight text-slate-800 leading-tight truncate"
                    >
                      {resolvedBrand}
                    </h1>
                  </div>
                  <p className="text-[10px] text-pastel-600 font-bold uppercase tracking-wider truncate">
                    {userRole === 'SUPER_ADMIN' ? 'Quản Trị Nền Tảng (Tổng)' : userRole === 'ADMIN' ? 'Quản Trị Viên' : userRole === 'MANAGER' ? 'Quản Lý Cấp Cao' : 'Nhân Viên'}
                  </p>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          );
        })()}

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {userRole === 'SUPER_ADMIN' ? 'Quản Trị Nền Tảng (Master)' : 'Menu Điều Hành'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'overview' && currentTab === 'super-admin');

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
                        ? item.badgeType === 'warning'
                          ? 'bg-amber-400 text-amber-950 font-black'
                          : 'bg-white text-rose-600'
                        : item.badgeType === 'warning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse font-black'
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
          {userRole === 'SUPER_ADMIN' ? (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 text-white shadow-soft">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Crown size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-white">Platform Master</p>
                  <p className="text-[10px] text-purple-300 font-semibold truncate">Toàn quyền nền tảng</p>
                </div>
              </div>
            </div>
          ) : licenseInfo?.isTrial || licenseInfo?.plan_code === 'TRIAL_2M' ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-purple-500/10 border-2 border-amber-300 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                  <Zap size={15} className="text-amber-500 fill-amber-500 shrink-0" />
                  <span>Dùng Thử Miễn Phí (0đ)</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 uppercase tracking-wider border border-amber-300">
                  Chưa mua gói
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-700 font-semibold">
                  Gói Dùng Thử 60 Ngày (Trial 0đ).
                </p>
                <p className="text-[10px] font-bold text-amber-800">
                  {licenseInfo?.expire_date ? `Hạn dùng: ${licenseInfo.expire_date}` : 'Thời hạn 60 ngày'}
                  {licenseInfo?.days_remaining !== undefined && licenseInfo?.days_remaining !== null && (
                    <span className="ml-1 text-purple-700 font-black">
                      • {licenseInfo.days_remaining > 0 ? `Còn ${licenseInfo.days_remaining} ngày` : 'Đã hết hạn'}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Crown size={14} className="text-amber-200" />
                <span>Xem Bảng Giá & Mua Gói</span>
              </button>
            </div>
          ) : licenseInfo?.plan_code === 'LIFETIME' ? (
            <div 
              onClick={onOpenUpgrade}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-emerald-300 shadow-xs cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Crown size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate whitespace-nowrap">Bản Quyền Vĩnh Viễn</p>
                    <p className="text-[10px] text-emerald-700 font-semibold truncate whitespace-nowrap">Trọn đời (∞) • Không giới hạn</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                  ✓ VIP
                </span>
              </div>
            </div>
          ) : !licenseInfo?.isDemo && !licenseInfo?.isExpired ? (
            <div 
              onClick={onOpenUpgrade}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/50 to-indigo-50/30 border border-indigo-200 shadow-xs cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate whitespace-nowrap">
                      {licenseInfo?.plan_name || 'Bản Quyền Doanh Nghiệp'}
                    </p>
                    <p className="text-[10px] text-indigo-700 font-semibold truncate whitespace-nowrap">
                      {licenseInfo?.days_remaining !== undefined && licenseInfo?.days_remaining !== null
                        ? `Còn ${licenseInfo.days_remaining} ngày (Đến ${licenseInfo?.expire_date || 'hết hạn'})`
                        : 'Đã kích hoạt'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 whitespace-nowrap shrink-0">
                  ✓ ĐÃ MUA
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                  <Zap size={14} className="text-rose-500" />
                  <span>Chưa Mua Bản Quyền</span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase border border-rose-300">
                  Hết hạn
                </span>
              </div>
              <p className="text-[11px] text-rose-700/90 leading-tight">
                Gói dùng thử đã hết hạn. Vui lòng mua gói để mở khóa lại.
              </p>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Crown size={13} className="text-amber-200" />
                <span>Mua Bản Quyền Ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* User Personal Profile Quick Button */}
        <div className="p-3 border-t border-pastel-100 bg-surface-subtle/30">
          <button
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              if (onClose) onClose();
            }}
            className="w-full p-2.5 rounded-xl border border-pastel-200/90 bg-white hover:bg-purple-50/70 hover:border-purple-300 text-slate-700 flex items-center gap-3 transition shadow-xs group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold leading-tight truncate text-slate-800 group-hover:text-purple-700">Thông Tin Cá Nhân</p>
              <p className="text-[10px] text-slate-400 truncate">Hồ sơ & Đổi mật khẩu</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
