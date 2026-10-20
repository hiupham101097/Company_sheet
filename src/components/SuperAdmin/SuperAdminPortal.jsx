import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Users,
  Award,
  KeyRound,
  Copy,
  Check,
  BarChart3,
  UserCheck,
  UserX,
  ExternalLink,
  ShieldCheck,
  Mail,
  Send,
  Bell,
  Share2
} from 'lucide-react';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';
import { api } from '../../services/api';

export function SuperAdminPortal({ currentUser, activeTab: propActiveTab, onNavigateTab }) {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab) => {
    setInternalTab(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [keys, setKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Keys Filter & Search
  const [searchKey, setSearchKey] = useState('');
  const [filterKeyStatus, setFilterKeyStatus] = useState('ALL');
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Modal States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isCompanyUsersModalOpen, setIsCompanyUsersModalOpen] = useState(false);
  const [isSendKeyModalOpen, setIsSendKeyModalOpen] = useState(false);
  const [selectedKeyForSend, setSelectedKeyForSend] = useState(null);
  const [sendKeyEmail, setSendKeyEmail] = useState('');
  const [sendKeyCompanyId, setSendKeyCompanyId] = useState('');
  const [sendKeyTab, setSendKeyTab] = useState('gmail'); // 'gmail' | 'bell'
  const [copiedEmailText, setCopiedEmailText] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState(null);
  const [companyUsersList, setCompanyUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    tax_id: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    plan_code: 'TRIAL_2M',
    license_status: 'ACTIVE',
    start_date: new Date().toISOString().slice(0, 10),
    expire_date: '',
    revenue: 0,
    notes: ''
  });

  const [licenseForm, setLicenseForm] = useState({
    plan_code: 'ANNUAL_1Y',
    license_status: 'ACTIVE',
    expire_date: '',
    add_revenue: 0,
    notes: ''
  });

  const [planForm, setPlanForm] = useState({
    id: null,
    code: '',
    name: '',
    duration_months: 12,
    price: 4800000,
    badge: 'Phổ biến',
    features: '',
    is_active: 1
  });

  const [orderForm, setOrderForm] = useState({
    company_id: '',
    company_name: '',
    plan_code: 'ANNUAL_1Y',
    plan_name: 'Gói Tiêu Chuẩn 1 Năm',
    amount: 4800000,
    payment_status: 'PAID',
    notes: 'Thanh toán chuyển khoản ngân hàng'
  });

  const [keyForm, setKeyForm] = useState({
    license_key: '',
    plan_code: 'ANNUAL_1Y',
    plan_name: 'Gói Tiêu Chuẩn 1 Năm',
    company_id: '',
    company_name: '',
    duration_months: 12,
    price: 4800000,
    notes: ''
  });

  // Tải dữ liệu toàn bộ
  const fetchData = async () => {
    try {
      setLoading(true);
      const [overRes, compRes, planRes, ordRes, keyRes] = await Promise.all([
        api.getSuperAdminOverview(),
        api.getSuperAdminCompanies(),
        api.getSuperAdminPlans(),
        api.getSuperAdminOrders(),
        api.getSuperAdminKeys()
      ]);

      setOverview(overRes?.data || null);
      setCompanies(compRes?.data || []);
      setPlans(planRes?.data || []);
      setOrders(ordRes?.data || []);
      setKeys(keyRes?.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Quản trị Tổng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Mở modal Cấp quyền / Gia hạn
  const handleOpenLicense = (comp) => {
    setSelectedCompany(comp);
    setLicenseForm({
      plan_code: comp.plan_code || 'ANNUAL_1Y',
      license_status: comp.license_status || 'ACTIVE',
      expire_date: comp.expire_date || '',
      add_revenue: 0,
      notes: comp.notes || ''
    });
    setIsLicenseModalOpen(true);
  };

  // Lưu cấp quyền
  const handleSaveLicense = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      setLoading(true);
      await api.updateCompanyLicense(selectedCompany.id, licenseForm);
      setIsLicenseModalOpen(false);
      fetchData();
      alert('Đã cập nhật quyền và bản quyền doanh nghiệp thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật bản quyền');
    } finally {
      setLoading(false);
    }
  };

  // Tạo doanh nghiệp mới
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.company_name.trim()) {
      alert('Vui lòng nhập tên công ty!');
      return;
    }
    try {
      setLoading(true);
      await api.createSuperAdminCompany(companyForm);
      setIsCompanyModalOpen(false);
      setCompanyForm({
        company_name: '',
        tax_id: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        plan_code: 'TRIAL_2M',
        license_status: 'ACTIVE',
        start_date: new Date().toISOString().slice(0, 10),
        expire_date: '',
        revenue: 0,
        notes: ''
      });
      fetchData();
      alert('Thêm doanh nghiệp mới thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi khi thêm doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  // Xóa doanh nghiệp
  const handleDeleteCompany = async (comp) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa doanh nghiệp "${comp.company_name}" khỏi hệ thống?`)) return;
    try {
      setLoading(true);
      await api.deleteSuperAdminCompany(comp.id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  // Khóa / Mở khóa nhanh
  const handleToggleLockCompany = async (comp) => {
    const isLocked = comp.license_status === 'LOCKED';
    const nextStatus = isLocked ? 'ACTIVE' : 'LOCKED';
    if (!window.confirm(`Bạn muốn ${isLocked ? 'mở khóa' : 'tạm khóa'} quyền truy cập của "${comp.company_name}"?`)) return;

    try {
      setLoading(true);
      await api.updateCompanyLicense(comp.id, {
        plan_code: comp.plan_code,
        license_status: nextStatus,
        expire_date: comp.expire_date,
        add_revenue: 0,
        notes: comp.notes
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi thao tác');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal tạo / sửa gói cước
  const handleOpenPlanModal = (p = null) => {
    if (p) {
      let feats = '';
      try {
        const parsed = JSON.parse(p.features);
        feats = Array.isArray(parsed) ? parsed.join('\n') : p.features;
      } catch {
        feats = p.features || '';
      }
      setPlanForm({
        id: p.id,
        code: p.code,
        name: p.name,
        duration_months: p.duration_months,
        price: p.price,
        badge: p.badge || '',
        features: feats,
        is_active: p.is_active ? 1 : 0
      });
    } else {
      setPlanForm({
        id: null,
        code: '',
        name: '',
        duration_months: 12,
        price: 4800000,
        badge: 'Phổ biến',
        features: 'Không giới hạn thiết bị tài sản\nPhân quyền không giới hạn nhân sự\nQuản lý doanh thu & dòng tiền\nTrợ lý AI Gemini cao cấp',
        is_active: 1
      });
    }
    setIsPlanModalOpen(true);
  };

  // Lưu gói cước
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.code.trim() || !planForm.name.trim()) {
      alert('Vui lòng nhập mã và tên gói!');
      return;
    }

    const featureArr = planForm.features
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setLoading(true);
      await api.saveSuperAdminPlan({
        ...planForm,
        features: featureArr
      });
      setIsPlanModalOpen(false);
      fetchData();
      alert('Lưu gói dịch vụ thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Xóa gói cước
  const handleDeletePlan = async (p) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${p.name}"?`)) return;
    try {
      setLoading(true);
      await api.deleteSuperAdminPlan(p.id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  // Tạo đơn hàng doanh thu
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.company_name.trim()) {
      alert('Vui lòng nhập tên công ty thanh toán!');
      return;
    }
    try {
      setLoading(true);
      await api.createSuperAdminOrder(orderForm);
      setIsOrderModalOpen(false);
      fetchData();
      alert('Ghi nhận doanh thu đơn hàng thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Trình tạo Key ngẫu nhiên
  const generateRandomKey = (planCode = 'ANNUAL_1Y') => {
    const prefix = planCode === 'LIFETIME' ? 'OMNI-LIFE' : planCode === 'TRIAL_2M' ? 'OMNI-TR2M' : 'OMNI-ENT';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randSegment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}-${randSegment(4)}-${randSegment(4)}-${randSegment(4)}`;
  };

  // Mở modal tạo Key mới
  const handleOpenCreateKey = (targetCompany = null) => {
    const defaultKey = generateRandomKey('ANNUAL_1Y');
    setKeyForm({
      license_key: defaultKey,
      plan_code: 'ANNUAL_1Y',
      plan_name: 'Gói Tiêu Chuẩn 1 Năm',
      company_id: targetCompany?.id || '',
      company_name: targetCompany?.company_name || '',
      duration_months: 12,
      price: 4800000,
      notes: targetCompany ? `Cấp riêng cho ${targetCompany.company_name}` : ''
    });
    setIsKeyModalOpen(true);
  };

  // Lưu tạo Key
  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!keyForm.license_key.trim()) {
      alert('Vui lòng tạo hoặc nhập mã Key!');
      return;
    }
    try {
      setLoading(true);
      await api.createSuperAdminKey(keyForm);
      setIsKeyModalOpen(false);
      fetchData();
      alert(`Đã tạo mã Key thành công:\n${keyForm.license_key}\n\nBạn có thể sao chép để gửi cho khách hàng kích hoạt!`);
    } catch (err) {
      alert(err.message || 'Lỗi khi tạo mã Key');
    } finally {
      setLoading(false);
    }
  };

  // Sao chép Key 1-click
  const handleCopyKey = (keyString, keyId) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(keyString);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2500);
    } else {
      prompt('Sao chép mã Key bản quyền này:', keyString);
    }
  };

  // Mở modal Gửi Key (Gmail & Chuông thông báo)
  const handleOpenSendKey = (k) => {
    setSelectedKeyForSend(k);
    const assignedComp = companies.find(c => c.id === k.company_id) || companies.find(c => c.company_name === k.company_name);
    setSendKeyCompanyId(k.company_id || (assignedComp?.id || ''));
    setSendKeyEmail(assignedComp?.admin_email || '');
    setCopiedEmailText(false);
    setSendKeyTab('gmail');
    setIsSendKeyModalOpen(true);
  };

  const getEmailContent = (k, toEmail) => {
    if (!k) return { subject: '', body: '' };
    const compName = k.company_name || companies.find(c => c.id === sendKeyCompanyId)?.company_name || 'Quý Doanh Nghiệp';
    const duration = k.duration_months >= 999 ? 'Vĩnh viễn (Trọn đời)' : `${k.duration_months} tháng`;
    const appUrl = window.location.origin;

    const subject = `[OMNI ASSETS] Bàn Giao Mã Kích Hoạt Bản Quyền Gói ${k.plan_name || k.plan_code} - ${compName}`;
    const body = `Kính gửi Quý Doanh nghiệp ${compName},

Đội ngũ Quản trị OMNI ASSETS trân trọng bàn giao mã kích hoạt bản quyền gói dịch vụ phần mềm quản trị doanh nghiệp & tài sản:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN BẢN QUYỀN:
• Doanh nghiệp: ${compName}
• Gói dịch vụ: ${k.plan_name || k.plan_code}
• Thời hạn sử dụng: ${duration}
• Trạng thái: Sẵn sàng kích hoạt

🔑 MÃ KÍCH HOẠT BẢN QUYỀN (LICENSE KEY):
>>> ${k.license_key} <<<
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HƯỚNG DẪN 3 BƯỚC KÍCH HOẠT NHANH:
1. Đăng nhập vào hệ thống tại: ${appUrl}
2. Nhấn vào biểu tượng "Chuông thông báo" 🔔 hoặc huy hiệu "Nâng cấp gói" trên thanh menu
3. Điền mã key "${k.license_key}" vào ô "Mã kích hoạt bản quyền" và nhấn "Kích hoạt bản quyền ngay". Toàn bộ tính năng cao cấp sẽ được mở khóa tức thì!

Nếu cần hỗ trợ kỹ thuật hoặc xuất hóa đơn VAT, Quý khách vui lòng liên hệ:
• Hotline / Zalo hỗ trợ 24/7: 0394264400
• Website: ${appUrl}

Trân trọng cảm ơn Quý đối tác đã tin tưởng và đồng hành cùng OMNI ASSETS!`;

    return { subject, body };
  };

  const handleOpenGmailWeb = () => {
    if (!selectedKeyForSend) return;
    const { subject, body } = getEmailContent(selectedKeyForSend, sendKeyEmail);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(sendKeyEmail.trim())}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMailto = () => {
    if (!selectedKeyForSend) return;
    const { subject, body } = getEmailContent(selectedKeyForSend, sendKeyEmail);
    const mailtoUrl = `mailto:${encodeURIComponent(sendKeyEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyEmailTemplate = () => {
    if (!selectedKeyForSend) return;
    const { subject, body } = getEmailContent(selectedKeyForSend, sendKeyEmail);
    const fullText = `Tiêu đề: ${subject}\n\n${body}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText);
      setCopiedEmailText(true);
      setTimeout(() => setCopiedEmailText(false), 2500);
    } else {
      prompt('Nội dung thư bàn giao Key:', fullText);
    }
  };

  const handleAssignKeyToCompany = async () => {
    if (!selectedKeyForSend) return;
    if (!sendKeyCompanyId) {
      alert('Vui lòng chọn một doanh nghiệp để phát thông báo chuông!');
      return;
    }
    const targetComp = companies.find(c => c.id === sendKeyCompanyId);
    try {
      setLoading(true);
      await api.updateSuperAdminKey(selectedKeyForSend.id, {
        company_id: sendKeyCompanyId,
        company_name: targetComp?.company_name || selectedKeyForSend.company_name
      });
      fetchData();
      alert(`Đã gán và phát thông báo thành công cho doanh nghiệp "${targetComp?.company_name}"!\n\nKhi tài khoản của doanh nghiệp này đăng nhập, biểu tượng Chuông 🔔 sẽ sáng lên kèm mã Key để họ kích hoạt.`);
    } catch (err) {
      alert(err.message || 'Lỗi khi gán mã bản quyền');
    } finally {
      setLoading(false);
    }
  };

  // Thu hồi / khôi phục Key
  const handleToggleRevokeKey = async (k) => {
    const isRevoked = k.status === 'REVOKED';
    const nextStatus = isRevoked ? 'ACTIVE' : 'REVOKED';
    if (!window.confirm(`Bạn có chắc chắn muốn ${isRevoked ? 'khôi phục' : 'thu hồi'} mã Key "${k.license_key}"?`)) return;

    try {
      setLoading(true);
      await api.updateSuperAdminKey(k.id, { status: nextStatus });
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật Key');
    } finally {
      setLoading(false);
    }
  };

  // Xóa Key
  const handleDeleteKey = async (k) => {
    if (!window.confirm(`Xác nhận xóa mã Key "${k.license_key}" khỏi hệ thống?`)) return;
    try {
      setLoading(true);
      await api.deleteSuperAdminKey(k.id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa Key');
    } finally {
      setLoading(false);
    }
  };

  // Xem danh sách người dùng (users) của một doanh nghiệp
  const handleViewCompanyUsers = async (comp) => {
    setSelectedCompanyForUsers(comp);
    setIsCompanyUsersModalOpen(true);
    try {
      setLoadingUsers(true);
      const res = await api.getCompanyUsers(comp.id);
      setCompanyUsersList(res?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setCompanyUsersList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Lọc danh sách công ty
  const filteredCompanies = companies.filter((c) => {
    const matchSearch =
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPlan = filterPlan === 'ALL' || c.plan_code === filterPlan;
    const matchStatus = filterStatus === 'ALL' || c.license_status === filterStatus;

    return matchSearch && matchPlan && matchStatus;
  });

  // Lọc danh sách keys
  const filteredKeys = keys.filter((k) => {
    const matchSearch =
      k.license_key?.toLowerCase().includes(searchKey.toLowerCase()) ||
      k.company_name?.toLowerCase().includes(searchKey.toLowerCase()) ||
      k.plan_name?.toLowerCase().includes(searchKey.toLowerCase()) ||
      k.notes?.toLowerCase().includes(searchKey.toLowerCase());

    const matchStatus = filterKeyStatus === 'ALL' || k.status === filterKeyStatus;
    return matchSearch && matchStatus;
  });

  const calculatedTotalUsers = companies.reduce((acc, c) => acc + (Number(c.user_count) || 0), 0);
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.license_status === 'ACTIVE').length,
    trialCompanies: companies.filter((c) => c.plan_code === 'TRIAL_2M').length,
    expiredCompanies: companies.filter((c) => c.license_status === 'EXPIRED').length,
    lockedCompanies: companies.filter((c) => c.license_status === 'LOCKED').length,
    totalRevenue: companies.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0),
    totalOrders: orders.length,
    totalUsers: overview?.stats?.totalUsers || calculatedTotalUsers,
    totalKeys: keys.length,
    activeKeys: keys.filter((k) => k.status === 'ACTIVE').length,
    usedKeys: keys.filter((k) => k.status === 'USED').length
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Super Admin Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-purple-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <ShieldAlert size={14} className="text-purple-300" />
              Cổng Quản Trị Nền Tảng Tối Cao (Master Account)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Trị Doanh Nghiệp, Cấp Quyền & Tạo Keys
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Dành riêng cho Quản trị viên Nền tảng: Duyệt & phân quyền tổ chức, tạo mã Keys bản quyền đóng gói gửi khách hàng, giám sát người dùng (users) và doanh thu gói cước toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition backdrop-blur-md cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={() => handleOpenCreateKey()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-amber-300 text-xs font-bold transition backdrop-blur-md cursor-pointer"
            >
              <KeyRound size={15} />
              Tạo Key Bản Quyền
            </button>
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition transform active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              Thêm Doanh Nghiệp
            </button>
          </div>
        </div>

        {/* Global Key Metrics - Includes Users and Keys */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-purple-500/20">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-purple-200/70 font-medium">Tổng Doanh Nghiệp</div>
            <div className="text-xl font-bold mt-1 text-white">{stats.totalCompanies}</div>
            <div className="text-[10px] text-purple-300/60 mt-0.5">{stats.activeCompanies} đang hoạt động</div>
          </div>

          <div className="bg-sky-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-sky-500/20">
            <div className="text-[11px] text-sky-200 font-medium flex items-center justify-between">
              <span>Tổng Số Users</span>
              <Users size={13} className="text-sky-300" />
            </div>
            <div className="text-xl font-bold mt-1 text-sky-300">{stats.totalUsers}</div>
            <div className="text-[10px] text-sky-200/70 mt-0.5">Người dùng toàn hệ thống</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-500/20">
            <div className="text-[11px] text-amber-200 font-medium flex items-center justify-between">
              <span>Keys Bản Quyền</span>
              <KeyRound size={13} className="text-amber-300" />
            </div>
            <div className="text-xl font-bold mt-1 text-amber-300">{stats.totalKeys}</div>
            <div className="text-[10px] text-amber-200/70 mt-0.5">{stats.usedKeys} key đã kích hoạt</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/20">
            <div className="text-[11px] text-emerald-300 font-medium">Cấp Quyền Đang Chạy</div>
            <div className="text-xl font-bold mt-1 text-emerald-400">{stats.activeCompanies}</div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">{stats.trialCompanies} dùng thử 2T</div>
          </div>

          <div className="bg-rose-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-rose-500/20">
            <div className="text-[11px] text-rose-300 font-medium">Hết Hạn / Tạm Khóa</div>
            <div className="text-xl font-bold mt-1 text-rose-400">
              {(Number(stats.expiredCompanies) || 0) + (Number(stats.lockedCompanies) || 0)}
            </div>
            <div className="text-[10px] text-rose-200/70 mt-0.5">Cần nhắc gia hạn</div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20">
            <div className="text-[11px] text-purple-200 font-medium flex items-center justify-between">
              <span>Doanh Thu Gói</span>
              <TrendingUp size={13} className="text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold mt-1 text-amber-300 truncate">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">
              Từ {stats.totalOrders || 0} đơn hàng
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: 5 Tabs Dedicated to Platform Admin */}
      <div className="flex items-center gap-2 border-b border-pastel-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={15} />
          Thống Kê Nền Tảng & User
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'companies'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={15} />
          Duyệt Doanh Nghiệp ({companies.length})
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'keys'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound size={15} />
          Tạo Keys Bản Quyền ({keys.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package size={15} />
          Xây Dựng Gói Dịch Vụ ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'revenue'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt size={15} />
          Doanh Thu & Hóa Đơn ({orders.length})
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 0: TỔNG QUAN NỀN TẢNG & THỐNG KÊ NGƯỜI DÙNG      */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Quick Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
              <div className="flex items-center justify-between pb-3 border-b border-pastel-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={15} className="text-sky-500" />
                  Quy Mô Người Dùng Hệ Thống
                </span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  {stats.totalUsers} users
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Trung bình mỗi doanh nghiệp:</span>
                  <span className="font-bold text-slate-800">
                    {stats.totalCompanies > 0 ? (stats.totalUsers / stats.totalCompanies).toFixed(1) : 0} users/cty
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Doanh nghiệp có người dùng:</span>
                  <span className="font-bold text-emerald-600">
                    {companies.filter((c) => (c.user_count || 0) > 0).length} / {stats.totalCompanies}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tài khoản Quản trị Platform:</span>
                  <span className="font-bold text-purple-700">1 (Master Account)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
              <div className="flex items-center justify-between pb-3 border-b border-pastel-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={15} className="text-amber-500" />
                  Tình Trạng Keys Bản Quyền
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {stats.totalKeys} keys
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Key sẵn sàng gửi khách:</span>
                  <span className="font-bold text-emerald-600">{stats.activeKeys} keys</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Key đã kích hoạt sử dụng:</span>
                  <span className="font-bold text-sky-600">{stats.usedKeys} keys</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Key đã thu hồi:</span>
                  <span className="font-bold text-rose-500">{keys.filter((k) => k.status === 'REVOKED').length} keys</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-pastel-200/80 shadow-soft">
              <div className="flex items-center justify-between pb-3 border-b border-pastel-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={15} className="text-purple-500" />
                  Cơ Cấu Gói Cước Doanh Nghiệp
                </span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  {plans.length} gói
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gói Vĩnh Viễn (Lifetime):</span>
                  <span className="font-bold text-amber-600">
                    {companies.filter((c) => c.plan_code === 'LIFETIME' || c.plan_code === 'LIFETIME_PRO').length} cty
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gói Tiêu Chuẩn 1 Năm:</span>
                  <span className="font-bold text-indigo-600">
                    {companies.filter((c) => c.plan_code === 'ANNUAL_1Y').length} cty
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gói Dùng Thử 2 Tháng:</span>
                  <span className="font-bold text-slate-600">{stats.trialCompanies} cty</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Distribution by Company Table */}
          <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-pastel-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  Thống Kê Số Lượng Người Dùng (Users) Theo Doanh Nghiệp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi số lượng nhân sự, phân quyền và trạng thái hoạt động của từng tổ chức trên nền tảng.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('companies')}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem quản lý ({companies.length})</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Tên Doanh Nghiệp</th>
                    <th className="py-3 px-4">Người Đại Diện & Email</th>
                    <th className="py-3 px-4">Gói Bản Quyền</th>
                    <th className="py-3 px-4">Số Lượng Users</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Chi Tiết Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu doanh nghiệp.
                      </td>
                    </tr>
                  ) : (
                    companies
                      .slice()
                      .sort((a, b) => (Number(b.user_count) || 0) - (Number(a.user_count) || 0))
                      .map((comp, idx) => (
                        <tr key={comp.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{comp.company_name}</div>
                            <div className="text-[10px] text-slate-400">MST: {comp.tax_id || 'Chưa cập nhật'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700">{comp.admin_name || '—'}</div>
                            <div className="text-[10px] text-slate-400">{comp.admin_email || '—'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                              {comp.plan_code || 'TRIAL_2M'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-black">
                              <Users size={12} className="text-sky-600" />
                              {comp.user_count || 0} users
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {comp.license_status === 'ACTIVE' ? (
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            ) : comp.license_status === 'LOCKED' ? (
                              <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                                <Lock size={11} /> Tạm khóa
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle size={11} /> Hết hạn
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleViewCompanyUsers(comp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition border border-sky-200 cursor-pointer"
                            >
                              <Users size={12} />
                              Xem Users
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: QUẢN LÝ DOANH NGHIỆP & CẤP QUYỀN SỬ DỤNG      */}
      {/* ==================================================== */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm tên doanh nghiệp, MST, người đại diện, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-700 font-medium"
              >
                <option value="ALL">Mọi Gói Cước</option>
                <option value="TRIAL_2M">Gói Dùng thử 2 tháng</option>
                <option value="ANNUAL_1Y">Gói 1 Năm</option>
                <option value="LIFETIME">Gói Vĩnh Viễn</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-700 font-medium"
              >
                <option value="ALL">Mọi Trạng Thái</option>
                <option value="ACTIVE">Đang Hoạt Động (ACTIVE)</option>
                <option value="LOCKED">Bị Tạm Khóa (LOCKED)</option>
                <option value="EXPIRED">Đã Hết Hạn (EXPIRED)</option>
              </select>
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Doanh Nghiệp / MST</th>
                    <th className="py-3.5 px-4">Đại Diện / Liên Hệ</th>
                    <th className="py-3.5 px-4">Gói Cước Đăng Ký</th>
                    <th className="py-3.5 px-4">Số Users</th>
                    <th className="py-3.5 px-4">Thời Hạn & Ngày Hết</th>
                    <th className="py-3.5 px-4">Doanh Thu Thu Được</th>
                    <th className="py-3.5 px-4">Trạng Thái Bản Quyền</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác Cấp Quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Building2 size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        Chưa tìm thấy doanh nghiệp nào phù hợp tiêu chí lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => {
                      const isExpired = c.license_status === 'EXPIRED';
                      const isLocked = c.license_status === 'LOCKED';
                      const isActive = c.license_status === 'ACTIVE';

                      return (
                        <tr key={c.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-sm">{c.company_name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              MST: {c.tax_id || 'Chưa cập nhật'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-700">{c.admin_name || '—'}</div>
                            <div className="text-[11px] text-slate-500">{c.admin_email || '—'}</div>
                            {c.admin_phone && (
                              <div className="text-[10px] text-slate-400">{c.admin_phone}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {c.plan_code === 'LIFETIME' || c.plan_code === 'LIFETIME_PRO' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                                <Award size={12} className="text-amber-500" />
                                Vĩnh Viễn (Lifetime)
                              </span>
                            ) : c.plan_code === 'ANNUAL_1Y' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                                Gói 1 Năm
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                                Dùng thử 2 tháng
                              </span>
                            )}
                          </td>

                          {/* Users Column */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleViewCompanyUsers(c)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer"
                              title="Bấm để xem chi tiết danh sách người dùng của doanh nghiệp này"
                            >
                              <Users size={12} className="text-sky-600" />
                              <span>{c.user_count || 0} users</span>
                              <ExternalLink size={10} className="text-sky-400" />
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-700">
                              Hết hạn: <span className="font-bold">{formatDate(c.expire_date)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Bắt đầu: {formatDate(c.start_date)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {formatCurrency(c.revenue)}
                          </td>

                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                                <Lock size={11} />
                                Bị Tạm Khóa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                                <AlertTriangle size={11} />
                                Hết Hạn
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewCompanyUsers(c)}
                                className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition cursor-pointer"
                                title="Xem danh sách người dùng / users"
                              >
                                <Users size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenCreateKey(c)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                                title="Tạo mã Key bản quyền cấp cho doanh nghiệp này"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenLicense(c)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition border border-purple-200 cursor-pointer"
                                title="Cấp quyền sử dụng / Gia hạn / Đổi gói"
                              >
                                <Sparkles size={13} />
                                Cấp quyền
                              </button>

                              <button
                                onClick={() => handleToggleLockCompany(c)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isLocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                                title={isLocked ? 'Mở khóa doanh nghiệp' : 'Tạm khóa doanh nghiệp'}
                              >
                                {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>

                              <button
                                onClick={() => handleDeleteCompany(c)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                title="Xóa doanh nghiệp"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TẠO KEYS BẢN QUYỀN ĐÓNG GÓI & PHÂN PHỐI       */}
      {/* ==================================================== */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          {/* Header & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm mã Key, tên doanh nghiệp, gói cước, ghi chú..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterKeyStatus}
                onChange={(e) => setFilterKeyStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-700 font-medium"
              >
                <option value="ALL">Mọi Trạng Thái Key</option>
                <option value="ACTIVE">Sẵn sàng (Chưa kích hoạt)</option>
                <option value="USED">Đã kích hoạt sử dụng</option>
                <option value="REVOKED">Đã thu hồi (REVOKED)</option>
              </select>

              <button
                onClick={() => handleOpenCreateKey()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-soft transition cursor-pointer"
              >
                <Plus size={15} />
                Tạo Mã Key Mới
              </button>
            </div>
          </div>

          {/* Keys Table */}
          <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã Key Bản Quyền</th>
                    <th className="py-3.5 px-4">Gói Cước & Thời Hạn</th>
                    <th className="py-3.5 px-4">Doanh Nghiệp Sử Dụng</th>
                    <th className="py-3.5 px-4">Giá Gói (VND)</th>
                    <th className="py-3.5 px-4">Trạng Thái Key</th>
                    <th className="py-3.5 px-4">Ngày Tạo / Kích Hoạt</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <KeyRound size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        Chưa tìm thấy mã Key nào phù hợp tiêu chí lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((k) => {
                      const isUsed = k.status === 'USED';
                      const isRevoked = k.status === 'REVOKED';
                      const isActive = k.status === 'ACTIVE';
                      const isCopied = copiedKeyId === k.id;

                      return (
                        <tr key={k.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs select-all">
                                {k.license_key}
                              </span>
                              <button
                                onClick={() => handleCopyKey(k.license_key, k.id)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                                title="Sao chép mã Key để gửi cho khách hàng"
                              >
                                {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                            {k.notes && (
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                Ghi chú: {k.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{k.plan_name || k.plan_code}</div>
                            <div className="text-[11px] text-slate-500">
                              {k.duration_months >= 999 ? 'Vĩnh viễn (Lifetime)' : `${k.duration_months || 12} tháng`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {k.company_name ? (
                              <div>
                                <span className="font-bold text-slate-800">{k.company_name}</span>
                                {k.activated_by_email && (
                                  <div className="text-[10px] text-slate-400">
                                    Bởi: {k.activated_by_email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Sẵn sàng (Bất kỳ doanh nghiệp nào)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {formatCurrency(k.price)}
                          </td>

                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Sẵn Sàng Kích Hoạt
                              </span>
                            ) : isUsed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold">
                                <CheckCircle2 size={12} className="text-sky-600" />
                                Đã Kích Hoạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                                <AlertTriangle size={12} className="text-rose-600" />
                                Đã Thu Hồi
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-[11px] text-slate-600 font-medium">
                              Tạo: {formatDate(k.created_at?.slice(0, 10))}
                            </div>
                            {k.activated_at && (
                              <div className="text-[10px] text-sky-600">
                                Kích hoạt: {formatDate(k.activated_at?.slice(0, 10))}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleCopyKey(k.license_key, k.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 cursor-pointer transition"
                                title="Sao chép Key"
                              >
                                <Copy size={12} />
                                {isCopied ? 'Đã chép' : 'Chép'}
                              </button>

                              <button
                                onClick={() => handleOpenSendKey(k)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer transition"
                                title="Gửi mã qua Gmail hoặc chuông thông báo"
                              >
                                <Mail size={12} />
                                Gửi
                              </button>

                              <button
                                onClick={() => handleToggleRevokeKey(k)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isRevoked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                                title={isRevoked ? 'Khôi phục Key' : 'Thu hồi Key'}
                              >
                                {isRevoked ? <Unlock size={13} /> : <Lock size={13} />}
                              </button>

                              <button
                                onClick={() => handleDeleteKey(k)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                title="Xóa Key"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: XÂY DỰNG & QUẢN LÝ GÓI DỊCH VỤ (PRICING PLANS) */}
      {/* ==================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cấu Hình Danh Mục Gói Dịch Vụ Nền Tảng</h2>
              <p className="text-xs text-slate-500">
                Tự do thiết kế gói dùng thử 2 tháng, gói theo năm (1 năm, 2 năm), hoặc gói vĩnh viễn không giới hạn.
              </p>
            </div>
            <button
              onClick={() => handleOpenPlanModal(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-soft transition"
            >
              <Plus size={15} />
              Xây Dựng Gói Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              let featureList = [];
              try {
                featureList = typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [];
              } catch {
                featureList = p.features ? [p.features] : [];
              }

              const isLifetime = p.code === 'LIFETIME' || p.duration_months >= 999;
              const isTrial = p.code === 'TRIAL_2M' || p.price === 0;

              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl bg-white border p-6 flex flex-col justify-between shadow-soft hover:shadow-soft-lg transition ${
                    isLifetime
                      ? 'border-amber-300 ring-2 ring-amber-400/20'
                      : isTrial
                      ? 'border-slate-200'
                      : 'border-purple-300 ring-2 ring-purple-400/20'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute top-5 right-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isLifetime
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isTrial
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Mã gói: {p.code}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{p.name}</h3>
                    </div>

                    <div className="pt-2 pb-4 border-b border-pastel-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          {p.price === 0 ? 'Miễn Phí' : formatCurrency(p.price)}
                        </span>
                        {p.price > 0 && (
                          <span className="text-xs text-slate-400 font-medium">
                            / {isLifetime ? 'Trọn đời' : `${p.duration_months} tháng`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Thời hạn hiệu lực: {isLifetime ? 'Không giới hạn thời gian' : `${p.duration_months} tháng kể từ ngày kích hoạt`}
                      </p>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2 py-2">
                      <div className="text-xs font-bold text-slate-700">Quyền lợi bao gồm:</div>
                      {featureList.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-pastel-100 flex items-center justify-between gap-2 mt-4">
                    <span
                      className={`text-[11px] font-bold ${
                        p.is_active ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {p.is_active ? '● Đang cung cấp' : '○ Tạm ẩn'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPlanModal(p)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Chỉnh sửa gói"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                        title="Xóa gói"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: DOANH THU & HÓA ĐƠN GIAO DỊCH GÓI             */}
      {/* ==================================================== */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Lịch Sử Giao Dịch & Dòng Tiền Đăng Ký Gói</h2>
              <p className="text-xs text-slate-500">
                Toàn bộ đơn hàng đăng ký gói bản quyền được ghi nhận và đối soát tự động từ các doanh nghiệp.
              </p>
            </div>
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-soft transition"
            >
              <Plus size={15} />
              Tạo Đơn Thu Tiền
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã Đơn / Ngày Tạo</th>
                    <th className="py-3.5 px-4">Doanh Nghiệp Thanh Toán</th>
                    <th className="py-3.5 px-4">Gói Đăng Ký</th>
                    <th className="py-3.5 px-4">Số Tiền (VND)</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Chưa có lịch sử giao dịch nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{ord.id}</div>
                          <div className="text-[11px] text-slate-400">{formatDate(ord.order_date)}</div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {ord.company_name}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 text-[11px]">
                            {ord.plan_name || ord.plan_code}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-black text-slate-900">
                          {formatCurrency(ord.amount)}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 size={12} />
                            Đã Thanh Toán
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {ord.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: CẤP QUYỀN SỬ DỤNG / GIA HẠN DOANH NGHIỆP     */}
      {/* ==================================================== */}
      <Modal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        title={`Cấp Quyền & Bản Quyền: ${selectedCompany?.company_name || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveLicense} className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
            Cấp quyền hoặc nâng cấp gói cước cho doanh nghiệp. Sau khi lưu, trạng thái bản quyền sẽ có hiệu lực tức thì trên toàn hệ thống.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gói Cước Phân Bổ</label>
            <select
              value={licenseForm.plan_code}
              onChange={(e) => {
                const code = e.target.value;
                const p = plans.find((x) => x.code === code);
                const months = p ? p.duration_months : 12;
                const d = new Date();
                d.setMonth(d.getMonth() + months);
                setLicenseForm((prev) => ({
                  ...prev,
                  plan_code: code,
                  expire_date: d.toISOString().slice(0, 10),
                  add_revenue: p ? p.price : 0
                }));
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.price === 0 ? 'Miễn phí' : formatCurrency(p.price)} - {p.duration_months >= 999 ? 'Vĩnh viễn' : `${p.duration_months} tháng`})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trạng Thái Bản Quyền</label>
              <select
                value={licenseForm.license_status}
                onChange={(e) => setLicenseForm({ ...licenseForm, license_status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="ACTIVE">Đang Hoạt Động (ACTIVE)</option>
                <option value="LOCKED">Tạm Khóa Quyền (LOCKED)</option>
                <option value="EXPIRED">Đã Hết Hạn (EXPIRED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Hết Hạn</label>
              <input
                type="date"
                value={licenseForm.expire_date}
                onChange={(e) => setLicenseForm({ ...licenseForm, expire_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi Nhận Doanh Thu Thu Thêm (VND)
            </label>
            <input
              type="number"
              value={licenseForm.add_revenue}
              onChange={(e) => setLicenseForm({ ...licenseForm, add_revenue: Number(e.target.value) })}
              placeholder="0"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <span className="text-[10px] text-slate-400">
              Nếu nhập {'>'} 0, hệ thống sẽ tự động tạo một hóa đơn thanh toán mới và cộng vào doanh thu tổng.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Cấp Quyền</label>
            <textarea
              rows={2}
              value={licenseForm.notes}
              onChange={(e) => setLicenseForm({ ...licenseForm, notes: e.target.value })}
              placeholder="Lý do gia hạn, số hợp đồng giấy, người duyệt..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pastel-100">
            <button
              type="button"
              onClick={() => setIsLicenseModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft transition"
            >
              Lưu & Kích Hoạt
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: THÊM DOANH NGHIỆP MỚI THỦ CÔNG              */}
      {/* ==================================================== */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title="Thêm Doanh Nghiệp Mới Vào Hệ Thống"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCompany} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Doanh Nghiệp / Công Ty <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyForm.company_name}
              onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
              placeholder="Ví dụ: Công ty Cổ Phần Công Nghệ OMNI"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
              <input
                type="text"
                value={companyForm.tax_id}
                onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                placeholder="0109988776"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gói Cước Ban Đầu</label>
              <select
                value={companyForm.plan_code}
                onChange={(e) => setCompanyForm({ ...companyForm, plan_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ Tên Quản Trị Viên</label>
              <input
                type="text"
                value={companyForm.admin_name}
                onChange={(e) => setCompanyForm({ ...companyForm, admin_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Quản Trị</label>
              <input
                type="email"
                value={companyForm.admin_email}
                onChange={(e) => setCompanyForm({ ...companyForm, admin_email: e.target.value })}
                placeholder="admin@congty.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
              <input
                type="text"
                value={companyForm.admin_phone}
                onChange={(e) => setCompanyForm({ ...companyForm, admin_phone: e.target.value })}
                placeholder="0988776655"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doanh Thu Thu Được (VND)</label>
              <input
                type="number"
                value={companyForm.revenue}
                onChange={(e) => setCompanyForm({ ...companyForm, revenue: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Bắt Đầu</label>
              <input
                type="date"
                value={companyForm.start_date}
                onChange={(e) => setCompanyForm({ ...companyForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày Hết Hạn (Bỏ trống = Tự tính)
              </label>
              <input
                type="date"
                value={companyForm.expire_date}
                onChange={(e) => setCompanyForm({ ...companyForm, expire_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú</label>
            <input
              type="text"
              value={companyForm.notes}
              onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
              placeholder="Thông tin thêm..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pastel-100">
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft transition"
            >
              Tạo Doanh Nghiệp
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: XÂY DỰNG / CHỈNH SỬA GÓI DỊCH VỤ             */}
      {/* ==================================================== */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={planForm.id ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Xây Dựng Gói Dịch Vụ Mới'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Gói (Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={planForm.code}
                onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                placeholder="ANNUAL_1Y, LIFETIME..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Gói Hiển Thị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Gói Tiêu Chuẩn 1 Năm"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời Hạn (Tháng)</label>
              <input
                type="number"
                min="1"
                value={planForm.duration_months}
                onChange={(e) => setPlanForm({ ...planForm, duration_months: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-[10px] text-slate-400">999 = Vĩnh viễn</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giá Tiền (VND)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
              />
              <span className="text-[10px] text-slate-400">0 = Dùng thử</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Huy Hiệu (Badge)</label>
              <input
                type="text"
                value={planForm.badge}
                onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                placeholder="Phổ biến, VIP..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Danh Sách Quyền Lợi / Tính Năng (Mỗi dòng 1 tính năng)
            </label>
            <textarea
              rows={4}
              value={planForm.features}
              onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
              placeholder="Không giới hạn thiết bị tài sản&#10;Phân quyền không giới hạn nhân sự&#10;Quản lý doanh thu & dòng tiền"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="plan_is_active"
              checked={planForm.is_active === 1}
              onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked ? 1 : 0 })}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="plan_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
              Đang mở bán / Kích hoạt hiển thị cho khách hàng
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pastel-100">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft transition"
            >
              Lưu Gói Dịch Vụ
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: TẠO ĐƠN THU TIỀN THỦ CÔNG                   */}
      {/* ==================================================== */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Ghi Nhận Đơn Hàng & Thu Tiền Bản Quyền"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveOrder} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Doanh Nghiệp Thanh Toán <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={orderForm.company_name}
              onChange={(e) => setOrderForm({ ...orderForm, company_name: e.target.value })}
              placeholder="Tên doanh nghiệp..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gói Cước</label>
              <select
                value={orderForm.plan_code}
                onChange={(e) => {
                  const code = e.target.value;
                  const p = plans.find((x) => x.code === code);
                  setOrderForm({
                    ...orderForm,
                    plan_code: code,
                    plan_name: p ? p.name : code,
                    amount: p ? p.price : orderForm.amount
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền (VND)</label>
              <input
                type="number"
                value={orderForm.amount}
                onChange={(e) => setOrderForm({ ...orderForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Đơn Hàng</label>
            <input
              type="text"
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="Chuyển khoản, hóa đơn VAT số..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pastel-100">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition"
            >
              Ghi Nhận Thu Tiền
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 5: TẠO MÃ KEY BẢN QUYỀN MỚI                    */}
      {/* ==================================================== */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Tạo Mã Key Bản Quyền Gói Dịch Vụ Mới"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveKey} className="space-y-3.5">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
            Tạo mã Key đóng gói sẵn để gửi cho khách hàng tự kích hoạt vào tài khoản của họ.
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Mã Key Bản Quyền <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const newCode = generateRandomKey(keyForm.plan_code);
                  setKeyForm({ ...keyForm, license_key: newCode });
                }}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                🎲 Sinh ngẫu nhiên
              </button>
            </div>
            <input
              type="text"
              required
              value={keyForm.license_key}
              onChange={(e) => setKeyForm({ ...keyForm, license_key: e.target.value.toUpperCase() })}
              placeholder="OMNI-ENT-XXXX-XXXX-XXXX"
              className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gói Cước</label>
              <select
                value={keyForm.plan_code}
                onChange={(e) => {
                  const code = e.target.value;
                  const p = plans.find((x) => x.code === code);
                  setKeyForm({
                    ...keyForm,
                    plan_code: code,
                    plan_name: p ? p.name : code,
                    duration_months: p ? p.duration_months : 12,
                    price: p ? p.price : keyForm.price,
                    license_key: generateRandomKey(code)
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời Hạn (Tháng)</label>
              <input
                type="number"
                min="1"
                value={keyForm.duration_months}
                onChange={(e) => setKeyForm({ ...keyForm, duration_months: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giá Bán (VND)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={keyForm.price}
                onChange={(e) => setKeyForm({ ...keyForm, price: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gán Riêng Cho Cty (Tùy chọn)
              </label>
              <select
                value={keyForm.company_id}
                onChange={(e) => {
                  const cId = e.target.value;
                  const comp = companies.find((x) => x.id === cId);
                  setKeyForm({
                    ...keyForm,
                    company_id: cId,
                    company_name: comp ? comp.company_name : ''
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- Mọi doanh nghiệp --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Key</label>
            <input
              type="text"
              value={keyForm.notes}
              onChange={(e) => setKeyForm({ ...keyForm, notes: e.target.value })}
              placeholder="VD: Khách hàng chuyển khoản Vietcombank, ưu đãi..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-pastel-100">
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-soft transition cursor-pointer"
            >
              Tạo & Lưu Mã Key
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 6: XEM DANH SÁCH USERS CỦA MỘT DOANH NGHIỆP    */}
      {/* ==================================================== */}
      <Modal
        isOpen={isCompanyUsersModalOpen}
        onClose={() => setIsCompanyUsersModalOpen(false)}
        title={`Danh Sách Người Dùng: ${selectedCompanyForUsers?.company_name || ''}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-100">
            <div>
              <p className="text-xs text-slate-500">
                Toàn bộ tài khoản nhân sự đang hoạt động trong doanh nghiệp này.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                MST: {selectedCompanyForUsers?.tax_id || 'Chưa cập nhật'} • Gói cước:{' '}
                <span className="font-bold text-purple-700">{selectedCompanyForUsers?.plan_code}</span>
              </p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              {companyUsersList.length} thành viên
            </span>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-purple-500" />
              <p className="text-xs">Đang tải danh sách người dùng...</p>
            </div>
          ) : companyUsersList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users size={36} className="mx-auto mb-2 text-slate-300 opacity-60" />
              <p className="text-xs">Doanh nghiệp này chưa có tài khoản người dùng nào được tạo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-pastel-200">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Họ Tên & Tài Khoản</th>
                    <th className="py-2.5 px-3">Email & Điện Thoại</th>
                    <th className="py-2.5 px-3">Vai Trò (Role)</th>
                    <th className="py-2.5 px-3">Phòng Ban</th>
                    <th className="py-2.5 px-3">Ngày Tham Gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {companyUsersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-pastel-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{u.name}</div>
                            <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-slate-700 font-medium">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                      </td>

                      <td className="py-2.5 px-3">
                        {u.role === 'ADMIN' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Quản Trị Viên (Admin)
                          </span>
                        ) : u.role === 'MANAGER' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Quản Lý (Manager)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                            Nhân Viên (Staff)
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {u.department || 'Chung'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {formatDate(u.created_at?.slice(0, 10))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-pastel-100">
            <button
              onClick={() => setIsCompanyUsersModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 6: GỬI KEY CHO ĐỐI TÁC (GMAIL & THÔNG BÁO)     */}
      {/* ==================================================== */}
      <Modal
        isOpen={isSendKeyModalOpen}
        onClose={() => setIsSendKeyModalOpen(false)}
        title="Gửi Mã Kích Hoạt Bản Quyền Cho Đối Tác"
        maxWidth="max-w-2xl"
      >
        {selectedKeyForSend && (
          <div className="space-y-4">
            {/* Header thông tin Key */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  Mã bản quyền phát hành
                </div>
                <div className="font-mono font-black text-sm text-purple-900 mt-0.5">
                  {selectedKeyForSend.license_key}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Gói: <span className="font-bold text-slate-700">{selectedKeyForSend.plan_name}</span> ({selectedKeyForSend.duration_months >= 999 ? 'Trọn đời' : `${selectedKeyForSend.duration_months} tháng`})
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {selectedKeyForSend.status === 'ACTIVE' ? 'Sẵn sàng kích hoạt' : selectedKeyForSend.status}
                </span>
                <div className="text-xs font-extrabold text-slate-800 mt-1">
                  {formatCurrency(selectedKeyForSend.price)}
                </div>
              </div>
            </div>

            {/* Tabs chuyển đổi: Gửi Gmail / Phát chuông thông báo */}
            <div className="flex items-center gap-2 border-b border-pastel-200 pb-2">
              <button
                type="button"
                onClick={() => setSendKeyTab('gmail')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sendKeyTab === 'gmail'
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Mail size={14} className="text-red-600" />
                Gửi Qua Gmail / Email
              </button>

              <button
                type="button"
                onClick={() => setSendKeyTab('bell')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  sendKeyTab === 'bell'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Bell size={14} className="text-amber-600" />
                Phát Chuông Thông Báo (In-App)
              </button>
            </div>

            {/* TAB CONTENT 1: GMAIL & EMAIL */}
            {sendKeyTab === 'gmail' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa chỉ Email người nhận (Đối tác / Khách hàng):
                  </label>
                  <input
                    type="email"
                    value={sendKeyEmail}
                    onChange={(e) => setSendKeyEmail(e.target.value)}
                    placeholder="nguoidung@congty.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Hệ thống tự động điền Email quản trị viên nếu Key đã được liên kết với một doanh nghiệp trong danh sách.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xem trước nội dung thư gửi đi:
                  </label>
                  <div className="p-3 bg-slate-50 border border-pastel-200 rounded-xl text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed select-all">
                    {getEmailContent(selectedKeyForSend, sendKeyEmail).body}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenGmailWeb}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-soft transition cursor-pointer"
                  >
                    <Mail size={14} />
                    Mở Gmail Soạn Sẵn
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMailto}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-soft transition cursor-pointer"
                  >
                    <Send size={14} />
                    Mở Outlook / Mail App
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEmailTemplate}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition cursor-pointer"
                  >
                    {copiedEmailText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedEmailText ? 'Đã chép nội dung!' : 'Chép nội dung thư'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PHÁT THÔNG BÁO VÀO TÀI KHOẢN (CHUÔNG 🔔) */}
            {sendKeyTab === 'bell' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <Bell size={14} />
                    Cách thức chuông thông báo hoạt động:
                  </div>
                  <p className="mt-1 leading-relaxed">
                    Khi bạn chọn và gán mã Key này cho một Doanh nghiệp, người dùng thuộc doanh nghiệp đó khi đăng nhập vào hệ thống sẽ thấy ngay thông báo tại <strong>Chuông thông báo 🔔 trên thanh menu</strong> kèm mã kích hoạt để họ bấm kích hoạt tức thì.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Doanh nghiệp nhận thông báo chuông:
                  </label>
                  <select
                    value={sendKeyCompanyId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSendKeyCompanyId(cid);
                      const comp = companies.find(c => c.id === cid);
                      if (comp && comp.admin_email) {
                        setSendKeyEmail(comp.admin_email);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  >
                    <option value="">-- Chọn doanh nghiệp đối tác --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} {c.admin_email ? `(${c.admin_email})` : ''} - Gói hiện tại: {c.plan_code}
                      </option>
                    ))}
                  </select>
                </div>

                {sendKeyCompanyId && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      Doanh nghiệp: <strong>{companies.find(c => c.id === sendKeyCompanyId)?.company_name}</strong>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Chuông thông báo đã được thiết lập sẵn. Nhấn nút bên dưới để xác nhận phát thông báo ngay.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-pastel-100">
                  <button
                    type="button"
                    onClick={() => setIsSendKeyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignKeyToCompany}
                    disabled={loading || !sendKeyCompanyId}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-soft transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Bell size={13} />
                    Phát Chuông Thông Báo Ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
