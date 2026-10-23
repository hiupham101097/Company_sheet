import React, { useState, useEffect, useRef } from 'react';
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
  Building2,
  Package,
  MessageCircle,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';

export function UpgradeModal({
  isOpen,
  onClose,
  licenseInfo,
  onLicenseUpdated,
  triggerReason,
  currentUser,
  companyName: propCompanyName
}) {
  const isDemo = licenseInfo?.isDemo ?? true;
  const currentKey = licenseInfo?.key || '';
  const isFreeTrial = (licenseInfo?.isTrial || licenseInfo?.plan_code === 'TRIAL_2M') && !licenseInfo?.isExpired;
  const isPaidPlan = !licenseInfo?.isTrial && !licenseInfo?.isDemo && licenseInfo?.plan_code !== 'TRIAL_2M' && licenseInfo?.plan_code !== 'DEMO' && !licenseInfo?.isExpired;
  const isExpiredDemo = licenseInfo?.isExpired || (licenseInfo?.isDemo && !licenseInfo?.isTrial);
  const isLifetime = licenseInfo?.plan_code === 'LIFETIME';

  // Tab: 'plans' (Chọn Gói) | 'payment' (Thanh Toán VietQR) | 'activate' (Nhập Mã Bản Quyền)
  const [activeTab, setActiveTab] = useState(isDemo ? 'plans' : 'activate');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedStk, setCopiedStk] = useState(false);
  const [copiedSyntax, setCopiedSyntax] = useState(false);
  const [bankConfig, setBankConfig] = useState({
    bank_name: 'ACB - Ngân Hàng TMCP Á Châu',
    bank_code: 'ACB',
    bank_bin: '970416',
    bank_account_number: '7909707',
    bank_account_holder: 'PHAM MINH HIEU'
  });

  const modalBodyRef = useRef(null);

  const scrollToTop = () => {
    setTimeout(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    scrollToTop();
  };

  // Nạp 100% danh mục gói cước & cấu hình thanh toán từ API máy chủ Cloudflare D1
  useEffect(() => {
    if (isOpen) {
      setLoadingPlans(true);
      const fetchPlans = api.getPlans ? api.getPlans() : api.getSuperAdminPlans();

      Promise.all([
        fetchPlans.catch((err) => {
          console.error('Lỗi khi tải gói cước từ API:', err);
          return { data: [] };
        }),
        api.getSettings().catch(() => ({ data: { settings: {} } }))
      ])
        .then(([plansRes, settingsRes]) => {
          if (plansRes?.data && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
            const activePlans = plansRes.data.filter((p) => p.is_active);
            if (activePlans.length > 0) {
              const sorted = [...activePlans].sort((a, b) => {
                if (a.code === 'TRIAL_2M') return -1;
                if (b.code === 'TRIAL_2M') return 1;
                return (a.price || 0) - (b.price || 0);
              });
              setPlans(sorted);
              const popular = sorted.find((p) => p.badge?.includes('Phổ biến') || p.code === 'ANNUAL_1Y') || sorted.find((p) => p.code !== 'TRIAL_2M') || sorted[0];
              setSelectedPlan(popular);
            }
          }

          if (settingsRes?.data?.settings) {
            const s = settingsRes.data.settings;
            setBankConfig((prev) => ({
              ...prev,
              bank_name: s.bank_name || prev.bank_name,
              bank_code: s.bank_code || prev.bank_code,
              bank_bin: s.bank_bin || prev.bank_bin,
              bank_account_number: s.bank_account_number || prev.bank_account_number,
              bank_account_holder: s.bank_account_holder || prev.bank_account_holder
            }));
          }
        })
        .finally(() => {
          setLoadingPlans(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    return `${(Number(val) || 0).toLocaleString('vi-VN')} VNĐ`;
  };

  const handleCopyStk = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(bankConfig.bank_account_number || '7909707');
      setCopiedStk(true);
      setTimeout(() => setCopiedStk(false), 2000);
    }
  };

  const resolvedOrgName = propCompanyName || licenseInfo?.company_name || licenseInfo?.companyName || licenseInfo?.organization || currentUser?.company_name || 'DOANH NGHIEP';
  const cleanOrg = (resolvedOrgName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 15);
  const transferSyntax = `OMNI ${cleanOrg} ${selectedPlan?.code || ''}`.trim();

  const handleCopySyntax = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(transferSyntax);
      setCopiedSyntax(true);
      setTimeout(() => setCopiedSyntax(false), 2000);
    }
  };

  // Chọn gói cước
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentCompleted(false);
    if (plan.price === 0) {
      // Gói 0đ dùng thử
      handleResetDemo();
      return;
    }
    // Gói có phí: CHUYỂN SANG MÀN THANH TOÁN
    setActiveTab('payment');
    scrollToTop();
  };

  // Người dùng xác nhận đã chuyển khoản
  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    try {
      setSubmittingPayment(true);
      const companyId = licenseInfo?.company_id || currentUser?.company_id || 'comp_1';
      const companyName = propCompanyName || licenseInfo?.company_name || licenseInfo?.companyName || licenseInfo?.organization || currentUser?.company_name || 'Khách Hàng Doanh Nghiệp';
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      await api.createSuperAdminOrder({
        company_id: companyId,
        company_name: companyName,
        plan_code: selectedPlan.code,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price,
        payment_status: 'PENDING',
        notes: `Khách quét VietQR chuyển khoản gói: ${selectedPlan.name} (${formatCurrency(selectedPlan.price)}). Cú pháp: ${transferSyntax}. Chờ Admin kiểm tra sao kê & duyệt kích hoạt.`
      });

      setCreatedOrder({
        id: orderId,
        company_name: companyName,
        plan_name: selectedPlan.name,
        amount: selectedPlan.price,
        date: new Date().toLocaleDateString('vi-VN')
      });
      setPaymentCompleted(true);
      scrollToTop();
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi xác nhận thanh toán');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Kích hoạt key
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

  // Trở về demo
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-6xl xl:max-w-7xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 px-6 py-5 text-white overflow-hidden shrink-0 border-b border-indigo-900/60">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 border ${
                isPaidPlan
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white'
                  : isFreeTrial
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-300 text-white'
                  : 'bg-gradient-to-br from-rose-600 to-red-700 border-rose-400 text-white'
              }`}>
                {isPaidPlan ? <Crown className="w-7 h-7" /> : isFreeTrial ? <Zap className="w-7 h-7 fill-white animate-pulse" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full border shadow-xs ${
                    isPaidPlan
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : isFreeTrial
                      ? 'bg-amber-400 text-amber-950 border-amber-300'
                      : 'bg-rose-500 text-white border-rose-300'
                  }`}>
                    {isPaidPlan
                      ? '✅ ĐÃ MUA BẢN QUYỀN CHÍNH THỨC'
                      : isFreeTrial
                      ? '🎁 ĐANG DÙNG THỬ 0Đ (CHƯA MUA GÓI)'
                      : '⚠️ BẢN DÙNG THỬ ĐÃ HẾT HẠN'}
                  </span>

                  <span className="text-xs text-indigo-200 font-semibold">
                    {licenseInfo?.plan_name || (isFreeTrial ? 'Gói Dùng Thử 2 Tháng (Trial 60 Ngày)' : 'Bản Demo Giới Hạn')}
                  </span>

                  {isLifetime ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Vĩnh viễn trọn đời (∞)
                    </span>
                  ) : licenseInfo?.days_remaining !== undefined && licenseInfo?.days_remaining !== null ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      licenseInfo.days_remaining > 10 ? 'bg-indigo-300 text-indigo-950' : 'bg-rose-400 text-white'
                    }`}>
                      <Zap className="w-3 h-3" /> Còn {licenseInfo.days_remaining} ngày
                    </span>
                  ) : null}
                </div>

                <h3 className="text-lg md:text-xl font-black mt-1 text-white leading-tight">
                  {isPaidPlan
                    ? `Bản Quyền Đã Kích Hoạt • ${licenseInfo?.plan_name}`
                    : isFreeTrial
                    ? 'Bạn Đang Sử Dụng Gói Dùng Thử Miễn Phí (Trial 60 Ngày)'
                    : 'Nâng Cấp Bản Quyền Để Mở Khóa Toàn Bộ Tính Năng'}
                </h3>
                <p className="text-xs md:text-sm text-indigo-200/90 mt-0.5 leading-snug">
                  {isPaidPlan
                    ? `Doanh nghiệp ${resolvedOrgName} đã thanh toán bản quyền và được bảo đảm toàn bộ quyền lợi.`
                    : isFreeTrial
                    ? `Doanh nghiệp ${resolvedOrgName} đang trong thời gian 60 ngày trải nghiệm miễn phí 100% tính năng (hạn dùng: ${licenseInfo?.expire_date || '60 ngày'}). Bạn chưa bị tính phí.`
                    : 'Gói dùng thử 60 ngày đã kết thúc. Vui lòng chọn 1 gói trả phí bên dưới để gỡ bỏ giới hạn.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0 ml-2 cursor-pointer"
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

        {/* 3 BƯỚC ĐIỀU HƯỚNG */}
        <div className="px-6 pt-3 pb-2.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900/70 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => switchTab('plans')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Package className="w-4 h-4 text-purple-600" />
              <span>Bảng Giá &amp; Gói Cước</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('payment')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 cursor-pointer ${
                activeTab === 'payment'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Thanh Toán VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('activate')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 cursor-pointer ${
                activeTab === 'activate'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-4 h-4 text-amber-500" />
              <span>Nhập Mã Kích Hoạt Key</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div ref={modalBodyRef} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Trạng thái bản quyền của doanh nghiệp (Thiết kế hiện đại, tinh giản chuẩn SaaS) */}
          {isFreeTrial ? (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 border border-amber-300/70 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap size={20} className="fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                      Đang Dùng Thử 60 Ngày (Trial 0đ)
                    </span>
                    <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                      {licenseInfo?.days_remaining !== undefined ? `Còn ${licenseInfo.days_remaining} ngày` : 'Miễn phí'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Chọn một trong các gói cước trả phí bên dưới để gỡ bỏ mọi giới hạn tài nguyên và bảo vệ quyền lợi doanh nghiệp.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => switchTab('activate')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Key size={13} className="text-amber-600" />
                <span>Đã có mã kích hoạt?</span>
              </button>
            </div>
          ) : isPaidPlan ? (
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white border border-indigo-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Crown size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Đã Kích Hoạt Bản Quyền Chính Thức
                      </span>
                      <span className="text-xs text-indigo-200 font-medium">
                        {resolvedOrgName}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-white mt-1">
                      {licenseInfo?.plan_name || 'Gói Doanh Nghiệp Vĩnh Viễn'}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-left">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Thời hạn bản quyền</div>
                    <div className="text-xs font-black text-emerald-300">
                      {isLifetime ? 'Vĩnh Viễn (Trọn Đời)' : licenseInfo?.expire_date ? `Hạn đến ${licenseInfo.expire_date}` : 'Hợp lệ'}
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-left">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hạn mức tài nguyên</div>
                    <div className="text-xs font-black text-white">Không giới hạn (Full)</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => switchTab('activate')}
                    className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Key size={13} className="text-amber-300" />
                    <span>Đổi License Key</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ==================================================== */}
          {/* TAB 1: DANH SÁCH GÓI DỊCH VỤ (CHỌN GÓI CÓ PHÍ)      */}
          {/* ==================================================== */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
                  Bảng So Sánh Các Gói Dịch Vụ
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
                  Bảng Giá Các Gói Cước Doanh Nghiệp
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isFreeTrial
                    ? 'Bạn đang ở Cột 1 (Gói Dùng Thử 0đ - Có hạn chế quyền). Chọn mua Gói 1 Năm, 2 Năm hoặc Vĩnh Viễn để mở khóa Full quyền.'
                    : isPaidPlan
                    ? 'Gói bạn đã mua được đánh dấu nổi bật màu xanh lá cây bên dưới.'
                    : 'Chọn một trong các gói cước bên dưới để chuyển sang màn hình quét mã VietQR kích hoạt tức thì.'}
                </p>
              </div>

              {/* Lưới các gói cước nạp từ API */}
              {loadingPlans ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-slate-500">Đang tải danh sách gói cước trực tiếp từ máy chủ Cloudflare D1...</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="py-12 text-center text-xs font-medium text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  Chưa có gói cước nào được kích hoạt trên hệ thống.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plans.map((p) => {
                    let featureList = [];
                    try {
                      featureList = typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [];
                    } catch {
                      featureList = p.features ? [p.features] : [];
                    }
                    const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                    const isLifetime = p.code === 'LIFETIME' || p.duration_months >= 999;
                    const isPopular = p.badge?.includes('Phổ biến') || p.code === 'ANNUAL_1Y';

                    // Xác định xem đây có phải gói người dùng ĐANG SỬ DỤNG hay không
                    const isCurrentPlan = (p.code === 'TRIAL_2M' && isFreeTrial) ||
                      (p.code === licenseInfo?.plan_code && isPaidPlan);

                    return (
                      <div
                        key={p.id || p.code}
                        className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 border shadow-soft hover:shadow-soft-lg ${
                          isCurrentPlan && isPaidPlan
                            ? 'bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/30 border-emerald-400 ring-2 ring-emerald-400/40'
                            : isCurrentPlan && isFreeTrial
                            ? 'bg-gradient-to-b from-amber-50/80 via-white to-orange-50/30 border-amber-400 ring-2 ring-amber-400/40'
                            : isLifetime
                            ? 'bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 border-amber-200'
                            : isPopular
                            ? 'bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/20 border-indigo-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Status banner nếu là gói hiện tại */}
                          {isCurrentPlan ? (
                            <div className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold uppercase text-center flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap ${
                              isPaidPlan
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}>
                              {isPaidPlan ? <CheckCircle2 size={13} /> : <Zap size={13} className="fill-white" />}
                              <span>{isPaidPlan ? 'ĐÃ KÍCH HOẠT' : 'ĐANG DÙNG (0Đ)'}</span>
                            </div>
                          ) : isFree ? (
                            <div className="py-1 px-2 rounded-xl text-[10px] font-bold uppercase text-center bg-slate-100 text-slate-500 whitespace-nowrap">
                              DÙNG THỬ (0Đ)
                            </div>
                          ) : (
                            <div className="py-1 px-2 rounded-xl text-[10px] font-bold uppercase text-center bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                              CHƯA MUA
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                {p.code}
                              </span>
                              {p.badge && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap ${
                                    isLifetime
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : isPopular
                                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                      : isFree
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 leading-snug whitespace-nowrap truncate" title={p.name}>
                              {p.name}
                            </h3>
                          </div>

                          <div className="pt-2 pb-2.5 border-b border-slate-100">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className={`text-xl sm:text-2xl font-black ${isFree ? 'text-amber-600' : 'text-slate-900'}`}>
                                {isFree ? '0 VNĐ' : formatCurrency(p.price)}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                                / {isLifetime ? 'Trọn đời' : isFree ? '60 ngày' : `${p.duration_months} tháng`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {isFree
                                ? 'Tặng miễn phí 60 ngày trải nghiệm'
                                : isLifetime
                                ? 'Sở hữu vĩnh viễn, không phí duy trì'
                                : `Sử dụng trong ${p.duration_months} tháng`}
                            </p>
                          </div>

                          <div className="space-y-1.5 py-1">
                            <div className="text-[11px] font-bold text-slate-700">Chi tiết quyền lợi &amp; hạn chế:</div>
                            {featureList.slice(0, 6).map((feat, idx) => {
                              const isLimitation = isFree && (feat.includes('Giới hạn') || feat.includes('Cố định') || feat.includes('Khóa') || feat.includes('Chưa'));
                              return (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                                  {isLimitation ? (
                                    <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                  )}
                                  <span className={`leading-snug ${isLimitation ? 'text-amber-900 font-semibold' : 'text-slate-600'}`}>
                                    {feat}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-3">
                          {isCurrentPlan ? (
                            isFree ? (
                              <div className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 select-none">
                                <CheckCircle2 size={14} className="text-amber-700" />
                                <span>✓ Đang Dùng Thử 0đ</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 select-none">
                                  <CheckCircle2 size={14} className="text-emerald-700" />
                                  <span>Gói Đã Mua (Đang Sử Dụng)</span>
                                </div>
                                {!isLifetime && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPlan(p)}
                                    className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <span>+ Mua Gia Hạn Thêm</span>
                                  </button>
                                )}
                              </div>
                            )
                          ) : isFree ? (
                            <div className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 select-none cursor-not-allowed">
                              <span>{isExpiredDemo ? 'Đã Hết Hạn Dùng Thử' : 'Đã Nâng Cấp Gói'}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectPlan(p)}
                              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                                isLifetime
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                              }`}
                            >
                              <span>Chọn Mua Gói Này →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BẢNG SO SÁNH QUYỀN LỢI CHI TIẾT - 100% DYNAMIC MAP OVER PLANS TỪ API */}
              {plans.length > 0 && (
                <div className="mt-8 rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden">
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-base font-black flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-400" />
                        Bảng So Sánh Chi Tiết Các Gói Dịch Vụ
                      </h5>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Dữ liệu đối chiếu hạn mức và quyền lợi tải thời gian thực từ API máy chủ Cloudflare D1
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
                          <th className="p-3 sm:p-3.5 min-w-[200px]">Tính Năng / Đặc Quyền</th>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            const isLifetime = p.code === 'LIFETIME' || p.duration_months >= 999;
                            const isCurrent = (p.code === 'TRIAL_2M' && isFreeTrial) || (p.code === licenseInfo?.plan_code && isPaidPlan);
                            return (
                              <th
                                key={p.id || p.code}
                                className={`p-3 sm:p-3.5 text-center min-w-[150px] ${
                                  isCurrent
                                    ? 'bg-indigo-100/80 text-indigo-950 border-x border-indigo-200'
                                    : isFree
                                    ? 'bg-amber-50/70 text-amber-900 border-x border-slate-200'
                                    : isLifetime
                                    ? 'bg-emerald-50/70 text-emerald-950 border-l border-slate-200'
                                    : 'text-slate-900'
                                }`}
                              >
                                <div className="font-black text-xs">{p.name}</div>
                                {p.badge && (
                                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                    {p.badge}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Chi phí đầu tư</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            const isLifetime = p.code === 'LIFETIME' || p.duration_months >= 999;
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-black ${
                                  isFree
                                    ? 'text-amber-700 bg-amber-50/30 border-x border-slate-100'
                                    : isLifetime
                                    ? 'text-emerald-700 bg-emerald-50/30'
                                    : 'text-slate-900'
                                }`}
                              >
                                {isFree ? '0 VNĐ (Miễn phí)' : formatCurrency(p.price)}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Thời hạn sử dụng</td>
                          {plans.map((p) => (
                            <td key={p.id || p.code} className="p-3 text-center font-medium text-slate-700">
                              {p.duration_months >= 999 ? 'Vĩnh viễn (Trọn đời)' : `${p.duration_months} tháng`}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Hạn mức Tài sản &amp; Thiết bị</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-rose-600 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? 'Tối đa 20 tài sản' : 'Không giới hạn (∞)'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Hạn mức Tài khoản Nhân sự</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-rose-600 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? 'Tối đa 3 tài khoản' : 'Không giới hạn (∞)'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Hợp đồng &amp; Biên bản bàn giao</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-rose-600 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? 'Tối đa 5 HĐ & 5 BBBG' : 'Không giới hạn (∞)'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Phòng ban quản trị</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-rose-600 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? 'Cố định 1 phòng ban' : 'Không giới hạn'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Tự động gửi Email 6:00 AM</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-slate-400 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? '❌ Bị khóa' : '✅ Mở khóa'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Tích hợp Telegram Bot cảnh báo</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-slate-400 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? '❌ Bị khóa' : '✅ Mở khóa'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">In Biên bản A4 chuẩn đóng mộc dấu đỏ</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-bold ${
                                  isFree ? 'text-amber-700 bg-amber-50/30 border-x border-slate-100' : 'text-emerald-600'
                                }`}
                              >
                                {isFree ? 'Có watermark thử nghiệm' : '✅ Chuẩn mộc dấu đỏ'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Hỗ trợ kỹ thuật &amp; Hóa đơn VAT</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            const isLifetime = p.code === 'LIFETIME' || p.duration_months >= 999;
                            return (
                              <td
                                key={p.id || p.code}
                                className={`p-3 text-center font-medium ${
                                  isFree
                                    ? 'text-slate-500 bg-amber-50/30 border-x border-slate-100'
                                    : isLifetime
                                    ? 'text-emerald-700 font-bold bg-emerald-50/20'
                                    : 'text-slate-800 font-bold'
                                }`}
                              >
                                {isFree ? 'Hỗ trợ cộng đồng' : isLifetime ? 'Hỗ trợ VIP 1-1 + VAT' : 'Hỗ trợ 24/7 + VAT'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800">Thao tác</td>
                          {plans.map((p) => {
                            const isFree = p.price === 0 || p.code === 'TRIAL_2M';
                            const isCurrent = (p.code === 'TRIAL_2M' && isFreeTrial) || (p.code === licenseInfo?.plan_code && isPaidPlan);
                            return (
                              <td key={p.id || p.code} className="p-3 text-center">
                                {isCurrent ? (
                                  <span className="inline-block py-1 px-2.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Đang Dùng
                                  </span>
                                ) : isFree ? (
                                  <span className="inline-block py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-400">
                                    Miễn Phí
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectPlan(p)}
                                    className="py-1 px-2.5 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition-all cursor-pointer"
                                  >
                                    Chọn Mua
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: MÀN HÌNH THANH TOÁN VIETQR & BÁO THÀNH CÔNG   */}
          {/* ==================================================== */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              {!paymentCompleted ? (
                <>
                  {/* Banner Gói đã chọn */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/90 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                        Gói Dịch Vụ Bạn Đã Chọn Mua:
                      </div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        {selectedPlan?.name || 'Gói Dịch Vụ'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Thời hạn: {selectedPlan?.duration_months >= 999 ? 'Trọn đời (Vĩnh viễn)' : `${selectedPlan?.duration_months || 12} tháng kể từ ngày kích hoạt`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-700">
                        {formatCurrency(selectedPlan?.price || 0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('plans')}
                        className="text-xs font-bold text-purple-700 hover:underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft size={12} />
                        Đổi gói khác
                      </button>
                    </div>
                  </div>

                  {/* Thẻ thanh toán VietQR */}
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                            Thông Tin Chuyển Khoản Ngân Hàng ({bankConfig.bank_code || 'ACB'})
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Quét mã VietQR để chuyển tiền nhanh 24/7 không cần gõ STK
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        VietQR • Napas 247
                      </span>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Mã QR */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                          <img
                            src={`https://img.vietqr.io/image/${bankConfig.bank_bin || '970416'}-${bankConfig.bank_account_number || '7909707'}-compact2.png?amount=${selectedPlan?.price || 0}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(bankConfig.bank_account_holder || 'PHAM MINH HIEU')}`}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/payment-qr.png';
                            }}
                            alt={`Mã VietQR ${bankConfig.bank_code} ${bankConfig.bank_account_holder}`}
                            className="w-44 h-44 aspect-square object-contain rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer"
                            title="Nhấn để xem ảnh phóng to"
                            onClick={() => window.open(`https://img.vietqr.io/image/${bankConfig.bank_bin || '970416'}-${bankConfig.bank_account_number || '7909707'}-compact2.png?amount=${selectedPlan?.price || 0}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(bankConfig.bank_account_holder || 'PHAM MINH HIEU')}`, '_blank')}
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1">
                            <span>📱 Quét mã VietQR 24/7</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Dùng App ngân hàng bất kỳ để quét
                          </p>
                        </div>
                      </div>

                      {/* Các trường thông tin */}
                      <div className="md:col-span-8 space-y-2.5">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Ngân hàng thụ hưởng
                            </div>
                            <div className="text-sm font-bold text-slate-800 mt-0.5">
                              {bankConfig.bank_name}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-700">
                            {bankConfig.bank_code}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Số tài khoản
                            </div>
                            <div className="text-xl font-black text-indigo-600 mt-0.5 tracking-wider">
                              {bankConfig.bank_account_number}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyStk}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-300 transition shadow-xs cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedStk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            {copiedStk ? 'Đã sao chép' : 'Sao chép STK'}
                          </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Chủ tài khoản
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 mt-0.5 tracking-wide">
                              {bankConfig.bank_account_holder}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                              Nội dung chuyển khoản (Ghi rõ để duyệt nhanh)
                            </div>
                            <div className="text-sm font-extrabold text-indigo-900 mt-0.5 truncate">
                              {transferSyntax}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopySyntax}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition shadow-xs cursor-pointer shrink-0"
                            title="Sao chép nội dung chuyển khoản"
                          >
                            {copiedSyntax ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                            {copiedSyntax ? 'Đã sao chép' : 'Sao chép cú pháp'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NÚT XÁC NHẬN ĐÃ CHUYỂN KHOẢN HOÀN TẤT */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={submittingPayment}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                    >
                      {submittingPayment ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                          <span>Tôi Đã Chuyển Khoản Hoàn Tất</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-2">
                      Nhấn vào nút sau khi chuyển tiền để hệ thống ghi nhận đơn hàng và kích hoạt tài khoản ngay.
                    </p>
                  </div>
                </>
              ) : (
                /* ==================================================== */
                /* MÀN HÌNH BÁO THANH TOÁN THÀNH CÔNG                  */
                /* ==================================================== */
                <div className="py-6 px-4 flex flex-col items-center text-center space-y-5 animate-fadeIn">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-12 h-12 animate-bounce" />
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Giao dịch được ghi nhận
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      Đã Ghi Nhận Thanh Toán Thành Công!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Cảm ơn Quý doanh nghiệp! Đơn hàng của bạn đã được ghi nhận trên hệ thống đối soát tự động.
                    </p>
                  </div>

                  {/* Thông tin đơn hàng tóm tắt */}
                  <div className="w-full max-w-md p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mã đơn hàng:</span>
                      <strong className="font-mono text-slate-800">{createdOrder?.id}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Gói bản quyền:</span>
                      <strong className="text-indigo-600">{createdOrder?.plan_name}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Số tiền thanh toán:</span>
                      <strong className="text-emerald-700 text-sm">{formatCurrency(createdOrder?.amount)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Đang đối soát & cấp bản quyền (5-10 phút)
                      </span>
                    </div>
                  </div>

                  {/* Quét mã Zalo Admin để duyệt nhanh (tránh bị chặn kết bạn qua SĐT) */}
                  <div className="w-full max-w-md p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white rounded-2xl border border-blue-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-left">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-blue-100 shrink-0">
                      <img
                        src="/zalo-qr.png"
                        alt="Mã QR Zalo Admin (Hp)"
                        className="w-28 h-28 aspect-square object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open('/zalo-qr.png', '_blank')}
                        title="Bấm để xem ảnh QR Zalo phóng to"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <h4 className="text-xs font-bold text-slate-800">Mã QR Zalo Quản Trị Viên (Hp)</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Mở App Zalo bấm nút <strong>Quét QR [⛶]</strong> để quét kết bạn và gửi hóa đơn đối soát, nhận mã kích hoạt trong 1 phút (an toàn, không lo bị chặn kết bạn).
                      </p>
                      <div className="pt-1 flex items-center gap-3">
                        <a
                          href="/zalo-qr.png"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>🔍 Xem mã QR Zalo phóng to</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-2">
                    <a
                      href={`https://zalo.me/0394264400?text=${encodeURIComponent(`Chào Admin, tôi vừa chuyển khoản thanh toán ${createdOrder?.plan_name} (Mã đơn: ${createdOrder?.id}, Số tiền: ${formatCurrency(createdOrder?.amount)}). Nhờ Admin kiểm tra và duyệt kích hoạt sớm giúp tôi!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      Báo Zalo Duyệt Ngay (1 Phút)
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveTab('activate')}
                      className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-soft transition cursor-pointer"
                    >
                      <Key size={16} />
                      Nhập Mã Kích Hoạt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: NHẬP MÃ KÍCH HOẠT                             */}
          {/* ==================================================== */}
          {activeTab === 'activate' && (
            <div className="space-y-6">
              {isDemo ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-amber-800">
                    <p className="font-semibold">Bạn đang sử dụng phiên bản Dùng Thử (Demo)</p>
                    <p className="mt-1 text-amber-700">
                      Phiên bản Demo giới hạn tối đa 5 tài sản, 4 nhân viên, 3 hợp đồng, in biên bản có watermark và khóa xuất Excel. Nhập mã bản quyền do bộ phận kinh doanh cung cấp để mở khóa toàn diện ngay lập tức.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs md:text-sm text-emerald-800 flex-1">
                    <p className="font-bold text-base">Hệ Thống Đã Được Kích Hoạt Bản Quyền Doanh Nghiệp (Enterprise)!</p>
                    <p className="mt-1 text-emerald-700">
                      Mọi giới hạn số lượng tài sản, người dùng, giao dịch và in ấn đều đã được gỡ bỏ hoàn toàn.
                    </p>
                    {currentKey && (
                      <div className="mt-2 text-xs font-mono bg-white p-2 rounded-lg border border-emerald-200 inline-block">
                        License Key: <strong className="text-emerald-600">{currentKey}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Input Key */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                      placeholder="VD: OMNI-ENT-2026-XXXX hoặc dán mã được cấp vào đây"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 uppercase transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Mã bản quyền được gửi qua <strong>Chuông thông báo 🔔</strong>, <strong>Email</strong> hoặc <strong>Zalo</strong> sau khi bạn hoàn tất chuyển khoản.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs md:text-sm text-rose-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs md:text-sm text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-w-[200px] py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
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
                      className="py-3 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Kiểm thử lại bản Demo
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Chân Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <Building2 size={13} />
            <span>Hệ Thống Quản Trị OMNI ASSETS Enterprise Suite © 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
