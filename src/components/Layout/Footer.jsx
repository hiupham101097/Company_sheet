import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MessageCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ZaloSupportModal } from '../Common/ZaloSupportModal';

export function Footer({
  brandName,
  companyName,
  licenseInfo,
  onOpenUpgrade,
  onNavigate,
  onOpenZalo,
  userRole = 'STAFF'
}) {
  const [internalZaloOpen, setInternalZaloOpen] = useState(false);
  const handleOpenZaloModal = () => {
    if (onOpenZalo) {
      onOpenZalo();
    } else {
      setInternalZaloOpen(true);
    }
  };

  const currentYear = new Date().getFullYear();
  const hotline = '0394264400';
  const hotlineNumberOnly = '0394264400';
  const supportEmail = 'support@omniassets.ryug.id.vn';

  return (
    <footer className="mt-auto border-t border-pastel-200/80 bg-white/95 backdrop-blur-xs py-2.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Bên trái: Logo nhỏ, Thương hiệu, Bản quyền & Trực tuyến */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <img src="/logo.png" alt="OMNI ASSETS" className="w-4 h-4 object-contain shrink-0" />
            <span>{brandName || 'OMNI ASSETS'}</span>
          </div>
          <span className="text-slate-300">•</span>
          <span>© {currentYear}</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống trực tuyến</span>
          </div>
        </div>

        {/* Bên phải: Các nút liên hệ & hỗ trợ khẩn cấp nhỏ gọn (pills) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
          {/* Hotline khẩn cấp 24/7 */}
          <a
            href={`tel:${hotlineNumberOnly}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 font-bold transition group shadow-2xs"
            title="Gọi hotline hỗ trợ khẩn cấp 24/7"
          >
            <PhoneCall size={12} className="text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            <span>Khẩn cấp: <span className="font-mono">{hotline}</span></span>
          </a>

          {/* Zalo QR 24/7 */}
          <button
            type="button"
            onClick={handleOpenZaloModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 font-bold transition group shadow-2xs cursor-pointer"
            title="Quét mã QR kết nối Zalo hỗ trợ 24/7"
          >
            <MessageCircle size={12} className="text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
            <span>Zalo 24/7</span>
            <span className="text-[10px] bg-white text-blue-600 px-1 rounded border border-blue-200 font-semibold">QR</span>
          </button>

          {/* Email hỗ trợ */}
          <a
            href={`mailto:${supportEmail}`}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition font-mono text-[11px]"
            title="Gửi email hỗ trợ kỹ thuật"
          >
            <Mail size={12} className="text-slate-500 shrink-0" />
            <span>{supportEmail}</span>
          </a>

          {/* Gửi yêu cầu hỗ trợ (Ticket) */}
          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate(userRole === 'SUPER_ADMIN' ? 'support-desk' : 'settings');
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pastel-50 hover:bg-pastel-100 border border-pastel-200 text-pastel-700 font-bold transition cursor-pointer"
            title="Mở hòm thư gửi phiếu yêu cầu hỗ trợ"
          >
            <HelpCircle size={12} className="shrink-0" />
            <span>Gửi Yêu Cầu</span>
          </button>
        </div>

      </div>

      {/* Zalo QR Support Modal */}
      <ZaloSupportModal
        isOpen={internalZaloOpen}
        onClose={() => setInternalZaloOpen(false)}
      />
    </footer>
  );
}
