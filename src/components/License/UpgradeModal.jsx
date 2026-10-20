import React, { useState } from 'react';
import {
  X,
  Crown,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Key,
  CreditCard,
  PhoneCall,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ArrowRight,
  Zap,
  Building2
} from 'lucide-react';
import { api } from '../../services/api';

export function UpgradeModal({
  isOpen,
  onClose,
  licenseInfo,
  onLicenseUpdated,
  triggerReason
}) {
  const [activeTab, setActiveTab] = useState('activate'); // 'activate' | 'pricing' | 'contact'
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedStk, setCopiedStk] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState(false);

  const handleCopyStk = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('7909707');
      setCopiedStk(true);
      setTimeout(() => setCopiedStk(false), 2000);
    }
  };

  const handleCopySyntax = () => {
    const org = (licenseInfo?.organization || licenseInfo?.company_name || 'CONGTY').replace(/\s+/g, '');
    const syntax = `OMNI ${org}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(syntax);
      setCopiedSyntax(true);
      setTimeout(() => setCopiedSyntax(false), 2000);
    }
  };

  if (!isOpen) return null;

  const isDemo = licenseInfo?.isDemo ?? true;
  const currentKey = licenseInfo?.key || '';

  const handleActivate = async (e) => {
    if (e) e.preventDefault();
    const keyToUse = licenseKey.trim();
    if (!keyToUse) {
      setError('Vui lòng nhập mã kích hoạt bản quyền.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.activateLicense({ license_key: keyToUse });
      if (res.success) {
        setSuccessMsg(res.message || 'Kích hoạt thành công!');
        if (onLicenseUpdated) {
          onLicenseUpdated(res.data);
        }
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1800);
      } else {
        setError(res.message || 'Mã kích hoạt không đúng.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kích hoạt bản quyền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Bạn có chắc muốn chuyển về chế độ Dùng Thử (Demo) để kiểm thử lại các giới hạn?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.resetDemoLicense();
      if (res.success) {
        if (onLicenseUpdated) {
          onLicenseUpdated(res.data);
        }
        setSuccessMsg('Đã chuyển về bản Demo thành công!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi reset về demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 px-6 py-5 text-white overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30 text-amber-300 shrink-0">
                <Crown className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    {isDemo ? 'Bản Dùng Thử (DEMO)' : 'Bản Quyền Đã Kích Hoạt'}
                  </span>
                  {!isDemo && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/80 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Vĩnh viễn
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-bold mt-1 text-white leading-tight">
                  {isDemo ? 'Nâng Cấp Bản Quyền Doanh Nghiệp (Enterprise)' : 'Thông Tin Bản Quyền Doanh Nghiệp'}
                </h3>
                <p className="text-xs md:text-sm text-white/85 mt-0.5 leading-snug">
                  Mở khóa 100% tính năng, bỏ mọi giới hạn tài sản, nhân sự & xuất báo cáo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {triggerReason && isDemo && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-100 text-xs md:text-sm flex items-center gap-2 relative z-10">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span><strong>Thông báo giới hạn:</strong> {triggerReason}</span>
            </div>
          )}
        </div>

        {/* Sub Navigation Bar - Dedicated and clean */}
        <div className="px-6 pt-3 pb-2.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900/70 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('activate')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
                activeTab === 'activate'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>🔑</span>
              <span>Nhập Mã Bản Quyền</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
                activeTab === 'pricing'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>⚡</span>
              <span>So Sánh Tính Năng</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 ${
                activeTab === 'contact'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>💳</span>
              <span>Mua Bản Quyền & Hotline</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: ACTIVATE KEY */}
          {activeTab === 'activate' && (
            <div className="space-y-6">
              {isDemo ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Bạn đang sử dụng phiên bản Dùng Thử (Demo)</p>
                    <p className="mt-1 text-amber-700/90 dark:text-amber-400/85">
                      Phiên bản Demo giới hạn tối đa 5 tài sản, 4 nhân viên, 3 hợp đồng, in biên bản có watermark và khóa xuất Excel. Nhập mã bản quyền do bộ phận kinh doanh cung cấp để mở khóa toàn diện ngay lập tức.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-emerald-800 dark:text-emerald-300 flex-1">
                    <p className="font-bold text-base">Hệ Thống Đã Được Kích Hoạt Bản Quyền Doanh Nghiệp (Enterprise)!</p>
                    <p className="mt-1 text-emerald-700 dark:text-emerald-400">
                      Mọi giới hạn số lượng tài sản, người dùng, giao dịch và in ấn đều đã được gỡ bỏ hoàn toàn.
                    </p>
                    {currentKey && (
                      <div className="mt-2 text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-block">
                        License Key: <strong className="text-emerald-600 dark:text-emerald-400">{currentKey}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Input Key */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mã Kích Hoạt Bản Quyền (License Key)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => {
                        setLicenseKey(e.target.value.toUpperCase());
                        setError('');
                      }}
                      placeholder="VD: OMNI-ENTERPRISE-2026 hoặc OMNI-XXXX-XXXX-XXXX"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Mã được gửi qua Email hoặc hóa đơn khi quý khách mua gói phần mềm.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs md:text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs md:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-w-[200px] py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>Kích Hoạt Ngay Bây Giờ</span>
                      </>
                    )}
                  </button>

                  {!isDemo && (
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      disabled={loading}
                      className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      Kiểm thử lại bản Demo
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PRICING & FEATURE COMPARISON */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="text-center max-w-md mx-auto mb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">So Sánh Quyền Lợi & Giới Hạn</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nâng cấp Enterprise để sở hữu hệ thống vĩnh viễn, không lo giới hạn tài sản
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">Tính năng & Phân hệ</th>
                      <th className="p-3.5 text-center bg-slate-50 dark:bg-slate-800/40 w-36">
                        <span className="text-slate-600 dark:text-slate-400">Bản Demo (Thử nghiệm)</span>
                      </th>
                      <th className="p-3.5 text-center bg-indigo-50/80 dark:bg-indigo-950/50 w-44 text-indigo-600 dark:text-indigo-400">
                        <span className="flex items-center justify-center gap-1 font-extrabold">
                          <Crown className="w-4 h-4 text-amber-500" /> Enterprise Full
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3 font-medium">📦 Quản lý Tài sản & Thiết bị</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-rose-500 font-semibold">Tối đa 5 tài sản</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Không giới hạn (∞)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">👥 Quản lý Nhân sự & Phân quyền</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-rose-500 font-semibold">Tối đa 4 nhân viên</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Không giới hạn (∞)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">📄 Hợp đồng & Biên bản bàn giao</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-rose-500 font-semibold">Tối đa 3 hợp đồng</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Không giới hạn (∞)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">💰 Quản lý Tài chính & Thu Chi</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-rose-500 font-semibold">Tối đa 5 phiếu ghi</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Không giới hạn (∞)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">🖨️ In ấn Biên bản bàn giao A4</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-amber-600 font-medium">Dính watermark Demo</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Chuẩn A4 sạch đẹp, có mộc</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">📊 Xuất dữ liệu Excel / CSV</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-rose-500 font-medium">
                        <XCircle className="w-4 h-4 mx-auto text-rose-500" />
                      </td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-600" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">🤖 Trợ lý AI OMNI-Bot Gemini</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-slate-500">Giới hạn câu hỏi</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Trợ lý riêng tư 24/7</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">☁️ Lưu trữ Dữ liệu Điện toán Đám mây</td>
                      <td className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/20 text-slate-500">Cơ bản</td>
                      <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20 text-emerald-600 font-bold">Cloudflare D1 bảo mật cao</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('activate')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md flex items-center gap-2"
                >
                  <span>Tôi đã có mã bản quyền</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & PAYMENT */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              {/* Thẻ thanh toán VietQR chính thức (Hero Payment Card) */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Header thanh toán */}
                <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                        Thông Tin Chuyển Khoản Ngân Hàng
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Hỗ trợ chuyển nhanh liên ngân hàng 24/7 qua VietQR
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    VietQR • Napas 247
                  </span>
                </div>

                {/* Bố cục 2 phần: Bên trái là QR to rõ, Bên phải là danh sách thông tin */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Cột 1: Mã QR sắc nét */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                      <img
                        src="/payment-qr.png"
                        alt="Mã VietQR ACB PHAM MINH HIEU"
                        className="w-44 h-44 aspect-square object-contain rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer"
                        title="Nhấn để xem ảnh phóng to"
                        onClick={() => window.open('/payment-qr.png', '_blank')}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1">
                        <span>📱 Quét mã VietQR 24/7</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dùng App ngân hàng hoặc Ví để quét
                      </p>
                    </div>
                  </div>

                  {/* Cột 2: Danh sách các trường thông tin */}
                  <div className="md:col-span-8 space-y-2.5">
                    {/* Ngân hàng */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Ngân hàng thụ hưởng
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                          ACB - Ngân Hàng TMCP Á Châu
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        ACB
                      </span>
                    </div>

                    {/* Số tài khoản */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Số tài khoản
                        </div>
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 tracking-wider">
                          7909707
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyStk}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-300 dark:border-slate-700 transition shadow-xs cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedStk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        {copiedStk ? 'Đã sao chép' : 'Sao chép STK'}
                      </button>
                    </div>

                    {/* Chủ tài khoản */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Chủ tài khoản
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-wide">
                          PHAM MINH HIEU
                        </div>
                      </div>
                    </div>

                    {/* Cú pháp chuyển khoản */}
                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          Nội dung chuyển khoản (Ghi đúng để duyệt ngay)
                        </div>
                        <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 mt-0.5 truncate">
                          OMNI {(licenseInfo?.organization || licenseInfo?.company_name || 'CONGTY').replace(/\s+/g, '')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySyntax}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 transition shadow-xs cursor-pointer shrink-0"
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedSyntax ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                        {copiedSyntax ? 'Đã sao chép' : 'Sao chép cú pháp'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Kênh liên hệ hỗ trợ & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="tel:0394264400"
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex items-center gap-3 hover:border-indigo-300 hover:shadow-xs transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Hotline 24/7</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition">
                      0394264400
                    </div>
                  </div>
                </a>

                <a
                  href="https://zalo.me/0394264400"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex items-center gap-3 hover:border-emerald-300 hover:shadow-xs transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">
                    Zalo
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Zalo Hỗ Trợ Nhanh</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-600 transition">
                      0394264400
                    </div>
                  </div>
                </a>

                <a
                  href="mailto:hieupham101097@gmail.com"
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 flex items-center gap-3 hover:border-purple-300 hover:shadow-xs transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-black text-sm">
                    @
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-400">Email Xuất Hóa Đơn VAT</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-600 transition truncate">
                      hieupham101097@gmail.com
                    </div>
                  </div>
                </a>
              </div>

              {/* Thông báo chân trang */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>⚡ Sau khi chuyển khoản, bộ phận hỗ trợ sẽ cấp mã kích hoạt trong vòng 5-10 phút. Bấm sang tab <strong>"Nhập Mã Bản Quyền"</strong> để mở khóa tức thì.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('activate')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 ml-3 shadow-xs cursor-pointer transition"
                >
                  Nhập mã ngay
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>OMNI ASSETS Enterprise Suite &copy; 2026</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
