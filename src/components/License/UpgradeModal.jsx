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

  const handleUseQuickKey = (k) => {
    setLicenseKey(k);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header gradient */}
        <div className="relative bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 p-6 text-white overflow-hidden">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30 text-amber-300">
                <Crown className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    {isDemo ? 'Bản Dùng Thử (DEMO)' : 'Bản Quyền Đã Kích Hoạt'}
                  </span>
                  {!isDemo && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/80 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Vĩnh viễn
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">
                  {isDemo ? 'Nâng Cấp Bản Quyền Doanh Nghiệp (Enterprise)' : 'Thông Tin Bản Quyền Doanh Nghiệp'}
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  Mở khóa 100% tính năng, bỏ mọi giới hạn tài sản, nhân sự & xuất báo cáo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {triggerReason && isDemo && (
            <div className="mt-4 p-3 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-100 text-xs md:text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span><strong>Thông báo giới hạn:</strong> {triggerReason}</span>
            </div>
          )}

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-4 pt-2 border-t border-white/15">
            <button
              onClick={() => setActiveTab('activate')}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'activate'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              🔑 Nhập Mã Bản Quyền
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'pricing'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              ⚡ So Sánh Tính Năng
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${activeTab === 'contact'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              💳 Mua Bản Quyền & Hotline
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

              {/* Quick Key Suggestion for Test/Demo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      Mã Kích Hoạt Nhanh Dành Cho Quản Trị Viên (Test Key)
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhấn vào mã bên dưới để điền tự động và kiểm thử nâng cấp hệ thống:
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'OMNI-ENTERPRISE-2026',
                    'OMNI-VIP-8888',
                    'OMNI-PRO-9999'
                  ].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleUseQuickKey(k)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-indigo-500 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all hover:shadow"
                    >
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{k}</span>
                    </button>
                  ))}
                </div>
              </div>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Bank transfer info */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/60">
                  <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400 font-bold text-sm mb-3">
                    <CreditCard className="w-5 h-5" />
                    <span>Thông Tin Thanh Toán Bản Quyền</span>
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Ngân hàng:</span>
                      <strong className="text-indigo-600 dark:text-indigo-300">ACB (Ngân hàng Á Châu)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Số tài khoản:</span>
                      <strong className="text-base font-mono font-bold text-slate-900 dark:text-white">7909707</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Chủ tài khoản:</span>
                      <strong className="text-slate-900 dark:text-white">PHAM MINH HIEU</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-xs">Cú pháp chuyển khoản:</span>
                      <span className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-600 dark:text-indigo-400 text-xs inline-block">
                        OMNI [Tên Công Ty] [SĐT]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Support Hotline */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm mb-3">
                      <PhoneCall className="w-5 h-5 text-emerald-500" />
                      <span>Tổng Đài Hỗ Trợ Kích Hoạt 24/7</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      Liên hệ trực tiếp để nhận mã kích hoạt bản quyền nhanh trong vòng 5 phút sau khi đăng ký hoặc cần xuất hóa đơn VAT điện tử.
                    </p>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-500">Hotline:</span>
                        <strong className="text-slate-900 dark:text-white">0394264400</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-500">Zalo CSKH:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">0394264400</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-500">Email:</span>
                        <strong className="text-slate-700 dark:text-slate-300">hieupham101097@gmail.com</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                    Bảo hành & bảo trì hệ thống trọn đời, nâng cấp tính năng tự động miễn phí.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Sau khi nhận mã bản quyền từ chuyên viên hỗ trợ, hãy chuyển qua tab <strong>"Nhập Mã Bản Quyền"</strong> để kích hoạt ngay.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('activate')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shrink-0 ml-3"
                >
                  Kích hoạt ngay
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
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
