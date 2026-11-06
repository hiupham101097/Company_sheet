import React from 'react';
import {
  PhoneCall,
  Mail,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Crown,
  Clock,
  ExternalLink,
  Headphones,
  CheckCircle2,
  Building2
} from 'lucide-react';

export function Footer({
  brandName,
  companyName,
  licenseInfo,
  onOpenUpgrade,
  onNavigate,
  userRole = 'STAFF'
}) {
  const currentYear = new Date().getFullYear();
  const hotline = '0394264400';
  const hotlineNumberOnly = '0394264400';
  const supportEmail = 'support@omniassets.ryug.id.vn';
  const zaloUrl = `https://zalo.me/${hotlineNumberOnly}`;

  return (
    <footer className="mt-auto border-t border-pastel-200/90 bg-gradient-to-b from-white via-pastel-50/30 to-pastel-100/40 text-slate-600 transition-all">
      {/* Khối hỗ trợ khẩn cấp & Hotline nổi bật */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Cột 1: Thông tin thương hiệu & Doanh nghiệp */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-pastel-200 p-1 flex items-center justify-center shadow-xs shrink-0">
                <img src="/logo.png" alt="OMNI ASSETS" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                  {brandName || 'OMNI ASSETS'}
                </h4>
                <p className="text-[11px] text-pastel-600 font-semibold">
                  Hệ Thống Quản Trị Doanh Nghiệp
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Nền tảng số hóa quản lý tài sản, trang thiết bị, tài chính thu chi, hợp đồng và chấm công tự động trên Cloudflare Edge Network.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/70 rounded-xl px-2.5 py-1.5 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống trực tuyến • Uptime 99.9%</span>
            </div>
          </div>

          {/* Cột 2: Hỗ Trợ Khẩn Cấp 24/7 (Hotline / Zalo) */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <Headphones size={15} className="text-rose-500" />
                Hỗ Trợ Khẩn Cấp 24/7
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                Trực 24/7
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Xử lý sự cố máy chủ, mất kết nối, lỗi dữ liệu, duyệt bản quyền khẩn cấp.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={`tel:${hotlineNumberOnly}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 transition group"
                title="Gọi hotline ngay"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall size={15} className="text-rose-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold font-mono">Hotline: {hotline}</span>
                </div>
                <span className="text-[10px] font-semibold bg-white text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                  Gọi ngay
                </span>
              </a>

              <a
                href={zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 transition group"
                title="Nhắn tin Zalo hỗ trợ"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Zalo Hỗ Trợ 24/7</span>
                </div>
                <span className="text-[10px] font-semibold bg-white text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  Chat Zalo
                </span>
              </a>
            </div>
          </div>

          {/* Cột 3: Hộp Thư Kỹ Thuật & Yêu Cầu Hỗ Trợ */}
          <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pastel-700">
                <HelpCircle size={15} className="text-pastel-600" />
                Hòm Thư Hỗ Trợ Kỹ Thuật
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pastel-100 text-pastel-700 font-mono">
                Tickets
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Tiếp nhận hướng dẫn phân quyền, tính năng mới, xuất báo cáo tài chính và hóa đơn VAT.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-pastel-50/70 hover:bg-pastel-100/80 border border-pastel-200/80 text-pastel-800 transition group"
                title="Gửi email cho bộ phận hỗ trợ"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={15} className="text-pastel-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold truncate font-mono">{supportEmail}</span>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate(userRole === 'SUPER_ADMIN' ? 'support-desk' : 'settings');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 active:scale-95 text-white text-xs font-bold shadow-soft transition cursor-pointer"
              >
                <HelpCircle size={14} />
                <span>Gửi Phiếu Yêu Cầu Hỗ Trợ (Ticket)</span>
              </button>
            </div>
          </div>

          {/* Cột 4: Tình Trạng Bản Quyền & Cam Kết */}
          <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck size={15} className="text-emerald-600" />
                Bản Quyền Doanh Nghiệp
              </span>
              {licenseInfo?.plan_code === 'LIFETIME' ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Vĩnh Viễn
                </span>
              ) : licenseInfo?.isTrial || licenseInfo?.plan_code === 'TRIAL_2M' ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Dùng Thử
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Đã Kích Hoạt
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 truncate">
                {licenseInfo?.plan_name || 'Bản Quyền Doanh Nghiệp OMNI'}
              </p>
              <p className="text-[11px] text-slate-500">
                {licenseInfo?.expire_date ? `Hạn dùng: ${licenseInfo.expire_date}` : 'Thời hạn theo gói đăng ký'}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenUpgrade}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Crown size={14} className="text-amber-200" />
              <span>Xem Gói Cước & Nâng Cấp</span>
            </button>

            <div className="pt-1 text-[10px] text-slate-400 space-y-0.5">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span>Bảo mật dữ liệu chuẩn OWASP Top 10</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span>Sao lưu định kỳ tự động mỗi 24h</span>
              </div>
            </div>
          </div>

        </div>

        {/* Thanh bản quyền đáy Footer */}
        <div className="pt-6 border-t border-pastel-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {currentYear} <strong>{brandName || 'OMNI ASSETS'}</strong>. Tất cả quyền được bảo lưu.</span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-400">Phiên bản Enterprise v1.0.0</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href={`tel:${hotlineNumberOnly}`}
              className="hover:text-rose-600 transition flex items-center gap-1"
            >
              <PhoneCall size={12} />
              <span>Khẩn cấp: {hotline}</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition flex items-center gap-1"
            >
              <MessageCircle size={12} />
              <span>Zalo 24/7</span>
            </a>
            <span className="text-slate-300">•</span>
            <a
              href={`mailto:${supportEmail}`}
              className="hover:text-pastel-700 transition flex items-center gap-1 font-mono"
            >
              <Mail size={12} />
              <span>{supportEmail}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

