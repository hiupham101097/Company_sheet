import React, { useState } from 'react';
import {
  MessageCircle,
  PhoneCall,
  QrCode,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';

export function ZaloSupportModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const phoneNumber = '0394264400';
  const zaloQrLink = 'https://zaloapp.com/qr/p/m51o2foo5wgf';

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-soft-xl border border-blue-100 overflow-hidden z-10 animate-scale-in flex flex-col my-auto text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>Zalo Hỗ Trợ Kỹ Thuật 24/7</span>
              </h3>
              <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tuyến • Kết bạn qua Mã QR</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Thông báo lý do quét QR */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1 mb-0.5 text-amber-950">
              <Sparkles size={13} className="text-amber-600" />
              Lưu ý khi kết nối Zalo Admin:
            </p>
            Tài khoản Zalo kỹ thuật sử dụng cài đặt bảo mật chống spam nên đã tắt tính năng tìm kiếm qua SĐT. Quý khách vui lòng <strong>Quét mã QR</strong> dưới đây để mở cuộc trò chuyện ngay lập tức.
          </div>

          {/* Khung hiển thị Mã QR Zalo */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/30 rounded-3xl border-2 border-dashed border-blue-200 text-center">
            <div className="relative p-2.5 bg-white rounded-2xl shadow-soft border border-blue-100 group">
              <img
                src="/zalo-qr.png"
                alt="Mã QR Zalo Admin Hỗ Trợ (Hp)"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => window.open('/zalo-qr.png', '_blank')}
                title="Bấm để xem ảnh phóng to"
              />
              <span className="absolute bottom-3 right-3 bg-slate-900/75 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs font-semibold">
                Quét mã Zalo
              </span>
            </div>

            <p className="text-xs font-bold text-slate-800 mt-3 flex items-center gap-1.5">
              <span>Mã QR Zalo Quản Trị Viên (Hp)</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Mở ứng dụng Zalo trên điện thoại &rarr; Chọn biểu tượng <strong>Quét QR [⛶]</strong>
            </p>
          </div>

          {/* Các nút hành động chính */}
          <div className="space-y-2 pt-1">
            <a
              href={zaloQrLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition cursor-pointer"
            >
              <ExternalLink size={15} />
              <span>Mở Trực Tiếp Trên Zalo App</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${phoneNumber}`}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <PhoneCall size={14} className="text-rose-600" />
                <span>Gọi: {phoneNumber}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyPhone}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Đã chép số</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Sao chép SĐT</span>
                  </>
                )}
              </button>
            </div>

            <a
              href="/zalo-qr.png"
              target="_blank"
              rel="noreferrer"
              className="block text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline pt-1"
            >
              🔍 Nhấn vào đây để xem / lưu ảnh QR Zalo kích thước lớn
            </a>
          </div>
        </div>

        {/* Footer bảo đảm */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <ShieldCheck size={14} className="text-emerald-600" />
            Bảo đảm hỗ trợ 24/7
          </span>
          <span className="font-mono text-slate-400">OMNI ASSETS SUPPORT</span>
        </div>
      </div>
    </div>
  );
}

