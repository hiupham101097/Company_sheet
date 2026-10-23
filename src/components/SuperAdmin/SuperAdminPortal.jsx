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
  Mail,
  Send,
  Bell,
  Share2,
  Megaphone,
  Zap,
  Sliders,
  HelpCircle,
  MessageSquare,
  Phone,
  Inbox,
  XCircle,
  Filter
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

  // Orders Filter, Search & Action States
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [approvingOrderId, setApprovingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

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

  // Super Admin Announcements & Plans Dispatcher States
  const [announcementSender, setAnnouncementSender] = useState('notifications'); // 'notifications' | 'support'
  const [announcementTargetType, setAnnouncementTargetType] = useState('ALL_COMPANIES'); // 'ALL_COMPANIES' | 'SINGLE_COMPANY'
  const [announcementTargetCompanyId, setAnnouncementTargetCompanyId] = useState('');
  const [announcementSubject, setAnnouncementSubject] = useState('🚀 [OmniAssets] Ra Mắt Bảng Gói Cước Mới & Tính Năng Tự Động Hóa 2026');
  const [announcementMessage, setAnnouncementMessage] = useState('Ban Quản Trị Nền Tảng trân trọng giới thiệu bảng gói cước dịch vụ mới với hàng loạt đặc quyền: Quản trị tài sản không giới hạn, Tự động phân quyền phòng ban theo cơ cấu tổ chức, và Báo cáo kiểm kê chuyên nghiệp.');
  const [announcementIncludePlans, setAnnouncementIncludePlans] = useState(true);
  const [announcementCtaText, setAnnouncementCtaText] = useState('Khám Phá Các Gói Cước & Nhận Ưu Đãi');
  const [announcementCtaUrl, setAnnouncementCtaUrl] = useState('https://company-sheet.hieupham101097.workers.dev');
  const [recipientsData, setRecipientsData] = useState(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState(null);

  // Super Admin Support Tickets Desk States
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyResult, setReplyResult] = useState(null);
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'REPLIED'

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
      const [overRes, compRes, planRes, ordRes, keyRes, ticketRes] = await Promise.all([
        api.getSuperAdminOverview(),
        api.getSuperAdminCompanies(),
        api.getSuperAdminPlans(),
        api.getSuperAdminOrders(),
        api.getSuperAdminKeys(),
        api.getSuperAdminSupportTickets().catch(() => ({ data: [] }))
      ]);

      setOverview(overRes?.data || null);
      setCompanies(compRes?.data || []);
      setPlans(planRes?.data || []);
      setOrders(ordRes?.data || []);
      setKeys(keyRes?.data || []);
      setSupportTickets(ticketRes?.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Quản trị Tổng:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await api.getSuperAdminSupportTickets();
      if (res?.success) {
        setSupportTickets(res.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu hỗ trợ:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'support-desk') {
      fetchSupportTickets();
    }
  }, [activeTab]);

  const handleReplyTicket = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTicket) return;
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung thư phản hồi!');
      return;
    }

    try {
      setSendingReply(true);
      setReplyResult(null);
      const res = await api.replySuperAdminSupportTicket({
        ticketId: selectedTicket.id,
        replyMessage: replyText.trim()
      });

      if (res?.success) {
        setReplyResult({
          type: 'success',
          text: res.message || 'Đã gửi thư phản hồi chính thức thành công đến khách hàng!'
        });
        const updatedTicket = {
          ...selectedTicket,
          status: 'REPLIED',
          reply_message: replyText.trim(),
          replied_at: new Date().toISOString(),
          replied_by: currentUser?.email || 'adminManager@gmail.com'
        };
        setSelectedTicket(updatedTicket);
        setSupportTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t))
        );
        setReplyText('');
      } else {
        setReplyResult({
          type: 'error',
          text: res?.message || 'Lỗi gửi phản hồi'
        });
      }
    } catch (err) {
      setReplyResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi phản hồi'
      });
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = supportTickets.filter((t) => {
    const term = ticketSearchTerm.toLowerCase();
    const matchSearch =
      !term ||
      t.id?.toLowerCase().includes(term) ||
      t.company_name?.toLowerCase().includes(term) ||
      t.sender_name?.toLowerCase().includes(term) ||
      t.sender_email?.toLowerCase().includes(term) ||
      t.subject?.toLowerCase().includes(term) ||
      t.message?.toLowerCase().includes(term);

    const matchStatus = ticketFilterStatus === 'ALL' || t.status === ticketFilterStatus;
    return matchSearch && matchStatus;
  });

  const fetchAnnouncementRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const res = await api.getSuperAdminAnnouncementRecipients();
      if (res.success) {
        setRecipientsData(res.data);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách nhận tin Super Admin:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncementRecipients();
    }
  }, [activeTab]);

  const applyAnnouncementTemplate = (templateKey) => {
    if (templateKey === 'PLAN_NEW') {
      setAnnouncementSender('notifications');
      setAnnouncementSubject('🚀 [OmniAssets] Thông Báo Phát Hành Bảng Gói Cước Dịch Vụ Mới 2026');
      setAnnouncementMessage('Ban Quản Trị Nền Tảng OMNI ASSETS trân trọng thông báo tới Quý Doanh nghiệp về việc chính thức phát hành bảng gói cước dịch vụ mới: Gói Dùng Thử 2 Tháng (Trial 60N), Gói Tiêu Chuẩn 1 Năm và Gói Doanh Nghiệp Vĩnh Viễn. Mọi tính năng quản trị tài sản, phân quyền phòng ban, chấm công và in biên bản A4 đều được mở khóa toàn diện.');
      setAnnouncementIncludePlans(true);
      setAnnouncementCtaText('Xem Bảng Gói Cước & Đăng Ký');
      setAnnouncementCtaUrl('https://company-sheet.hieupham101097.workers.dev');
    } else if (templateKey === 'LICENSE_GRANTED') {
      setAnnouncementSender('notifications');
      setAnnouncementSubject('🎉 [Xác Nhận] Thông Báo Cấp Quyền & Kích Hoạt Bản Quyền Doanh Nghiệp Thành Công');
      setAnnouncementMessage('Ban Quản Trị Nền Tảng OMNI ASSETS trân trọng xác nhận: Doanh nghiệp của Quý khách đã được duyệt và cấp quyền bản quyền thành công trên hệ thống. Toàn bộ các giới hạn tính năng đã được gỡ bỏ để Quý công ty vận hành và số hóa tài sản, nhân sự trơn tru.');
      setAnnouncementIncludePlans(false);
      setAnnouncementCtaText('Truy Cập Nền Tảng Vận Hành Ngay');
      setAnnouncementCtaUrl('https://company-sheet.hieupham101097.workers.dev');
    } else if (templateKey === 'NEW_SERVICE') {
      setAnnouncementSender('notifications');
      setAnnouncementSubject('🌟 [Dịch Vụ Mới] Giới Thiệu Tính Năng & Dịch Vụ Nâng Cao Mới Cho Doanh Nghiệp');
      setAnnouncementMessage('Hệ thống OMNI ASSETS vừa chính thức bổ sung loạt dịch vụ mới: Cổng gửi mail tự động xác thực DKIM/SPF, Cơ chế ma trận phân quyền theo cơ cấu tổ chức, Biên bản bàn giao tài sản chuẩn in ấn A4 có dấu mộc và Bản tin nhắc việc khẩn cấp 06:00 AM mỗi sáng. Trân trọng kính mời Quý Doanh nghiệp trải nghiệm.');
      setAnnouncementIncludePlans(false);
      setAnnouncementCtaText('Khám Phá Tính Năng Mới Ngay');
      setAnnouncementCtaUrl('https://company-sheet.hieupham101097.workers.dev');
    } else if (templateKey === 'SYSTEM_UPDATE') {
      setAnnouncementSender('support');
      setAnnouncementSubject('🔔 [Thông Báo] Sắp Có Bản Cập Nhật Hệ Thống & Nâng Cấp Tính Năng Mới');
      setAnnouncementMessage('Ban Quản Trị Nền Tảng trân trọng thông báo: Hệ thống OMNI ASSETS sắp có bản cập nhật nâng cấp giao diện, tối ưu hóa tốc độ truy xuất cơ sở dữ liệu và gia tăng bảo mật đa lớp. Mọi dữ liệu của Quý công ty được bảo đảm an toàn 100% trong quá trình cập nhật.');
      setAnnouncementIncludePlans(false);
      setAnnouncementCtaText('Mở Bàn Làm Việc Kiểm Tra');
      setAnnouncementCtaUrl('https://company-sheet.hieupham101097.workers.dev');
    }
  };

  const handleSendAnnouncement = async () => {
    const senderEmail = announcementSender === 'support' ? 'support@omniassets.ryug.id.vn' : 'notifications@omniassets.ryug.id.vn';
    const targetLabel = announcementTargetType === 'ALL_COMPANIES' 
      ? `TOÀN BỘ Admin & Manager của tất cả ${recipientsData?.totalCompanies || companies.length} doanh nghiệp khách hàng`
      : `doanh nghiệp "${companies.find(c => c.id === announcementTargetCompanyId)?.company_name || 'đã chọn'}"`;

    if (!window.confirm(`XÁC NHẬN PHÁT THƯ NỀN TẢNG:\n\n- Người gửi: Super Admin (adminManager@gmail.com)\n- Hòm thư đại diện: ${senderEmail}\n- Đối tượng nhận: ${targetLabel}\n- Tiêu đề: "${announcementSubject}"\n\nBạn có chắc chắn muốn phát thông báo qua Resend API ngay bây giờ?`)) {
      return;
    }

    try {
      setSendingAnnouncement(true);
      setAnnouncementResult(null);
      const res = await api.broadcastSuperAdminAnnouncement({
        sender_type: announcementSender,
        target_type: announcementTargetType,
        target_company_id: announcementTargetCompanyId || undefined,
        subject: announcementSubject,
        message: announcementMessage,
        include_plans: announcementIncludePlans,
        cta_text: announcementCtaText,
        cta_url: announcementCtaUrl
      });

      if (res.success) {
        setAnnouncementResult({
          type: 'success',
          text: res.message || 'Đã phát thông báo gói dịch vụ thành công qua Resend!'
        });
      } else {
        setAnnouncementResult({
          type: 'error',
          text: res.message || 'Lỗi khi phát thông báo'
        });
      }
    } catch (err) {
      setAnnouncementResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi thông báo'
      });
    } finally {
      setSendingAnnouncement(false);
    }
  };

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

  // Phê duyệt đơn hàng & kích hoạt bản quyền
  const handleApproveOrder = async (ord) => {
    const formattedAmount = formatCurrency(ord.amount);
    const confirmed = window.confirm(
      `⚡ XÁC NHẬN PHÊ DUYỆT ĐƠN HÀNG:\n\n` +
      `• Mã đơn: ${ord.id}\n` +
      `• Doanh nghiệp: ${ord.company_name}\n` +
      `• Gói cước: ${ord.plan_name || ord.plan_code}\n` +
      `• Số tiền: ${formattedAmount}\n\n` +
      `Hệ thống sẽ:\n` +
      `1. Chuyển trạng thái đơn sang ĐÃ THANH TOÁN\n` +
      `2. Kích hoạt toàn quyền bản quyền ACTIVE cho doanh nghiệp\n` +
      `3. Gia hạn/cập nhật thời hạn sử dụng tự động\n` +
      `4. Gửi Email thông báo chính thức cho quản trị viên doanh nghiệp\n\n` +
      `Bạn có chắc chắn muốn duyệt và kích hoạt ngay?`
    );
    if (!confirmed) return;

    try {
      setApprovingOrderId(ord.id);
      const res = await api.approveSuperAdminOrder(ord.id);
      if (res?.success) {
        alert(res.message || 'Duyệt đơn hàng và kích hoạt bản quyền thành công!');
        fetchData();
      } else {
        alert(res?.message || 'Lỗi khi duyệt đơn hàng');
      }
    } catch (err) {
      alert(err.message || 'Lỗi kết nối khi duyệt đơn hàng');
    } finally {
      setApprovingOrderId(null);
    }
  };

  // Hủy đơn hàng (Từ chối duyệt / không nhận được tiền)
  const handleCancelOrder = async (ord) => {
    const reason = window.prompt(
      `Nhập lý do hủy đơn hàng ${ord.id} của "${ord.company_name}":`,
      'Không nhận được chuyển khoản / Khách yêu cầu hủy'
    );
    if (reason === null) return;

    try {
      setCancellingOrderId(ord.id);
      const res = await api.cancelSuperAdminOrder(ord.id, { reason });
      if (res?.success) {
        alert('Đã hủy đơn hàng thành công!');
        fetchData();
      } else {
        alert(res?.message || 'Lỗi khi hủy đơn hàng');
      }
    } catch (err) {
      alert(err.message || 'Lỗi kết nối khi hủy đơn hàng');
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Mở thư thông báo nền tảng cho đơn hàng
  const handleOpenAnnouncementForOrder = (ord) => {
    const comp = companies.find(c => c.id === ord.company_id || c.company_name === ord.company_name);
    if (comp) {
      setAnnouncementTargetType('SINGLE_COMPANY');
      setAnnouncementTargetCompanyId(comp.id);
    }
    setAnnouncementSubject(`🎉 [Xác Nhận] Đơn Hàng & Cấp Bản Quyền Gói ${ord.plan_name || ord.plan_code} - ${ord.company_name}`);
    setAnnouncementMessage(`Kính gửi Quý Doanh Nghiệp ${ord.company_name},\n\nBan Quản Trị Nền Tảng OMNI ASSETS trân trọng thông báo: Đơn hàng bản quyền gói "${ord.plan_name || ord.plan_code}" với số tiền ${formatCurrency(ord.amount)} đã được kích hoạt thành công trên hệ thống.\n\nToàn bộ tính năng cao cấp không giới hạn đã sẵn sàng phục vụ Quý công ty.`);
    setActiveTab('announcements');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const pendingOrders = orders.filter((o) => o.payment_status === 'PENDING');
  const paidOrders = orders.filter((o) => o.payment_status === 'PAID');
  const cancelledOrders = orders.filter((o) => o.payment_status === 'CANCELLED');
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  // Lọc danh sách đơn hàng
  const filteredOrders = orders.filter((ord) => {
    if (orderFilterStatus !== 'ALL' && ord.payment_status !== orderFilterStatus) return false;
    if (orderSearchTerm.trim()) {
      const term = orderSearchTerm.trim().toLowerCase();
      const idMatch = (ord.id || '').toLowerCase().includes(term);
      const nameMatch = (ord.company_name || '').toLowerCase().includes(term);
      const planMatch = (ord.plan_name || ord.plan_code || '').toLowerCase().includes(term);
      const notesMatch = (ord.notes || '').toLowerCase().includes(term);
      return idMatch || nameMatch || planMatch || notesMatch;
    }
    return true;
  });

  const calculatedTotalUsers = companies.reduce((acc, c) => acc + (Number(c.user_count) || 0), 0);
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.license_status === 'ACTIVE').length,
    trialCompanies: companies.filter((c) => c.plan_code === 'TRIAL_2M').length,
    expiredCompanies: companies.filter((c) => c.license_status === 'EXPIRED').length,
    lockedCompanies: companies.filter((c) => c.license_status === 'LOCKED').length,
    totalRevenue: totalPaidRevenue || companies.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0),
    totalOrders: orders.length,
    pendingOrdersCount: pendingOrders.length,
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
          onClick={() => setActiveTab('support-desk')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'support-desk'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={15} />
          <span>Hòm Thư Hỗ Trợ (Tickets)</span>
          {supportTickets.filter(t => t.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {supportTickets.filter(t => t.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone size={15} />
          Phát Thư Gói Dịch Vụ (Resend)
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
          <span>Doanh Thu &amp; Đơn Hàng ({orders.length})</span>
          {pendingOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingOrders.length} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 0: TỔNG QUAN NỀN TẢNG & THỐNG KÊ NGƯỜI DÙNG      */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cảnh báo đơn hàng mua gói đang chờ duyệt (Highlight Alert) */}
          {pendingOrders.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 sm:p-5 rounded-3xl text-white shadow-lg border border-amber-300/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                  <Receipt size={24} className="text-white animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-1 backdrop-blur-xs">
                    <Clock size={11} />
                    <span>Yêu Cầu Duyệt Bản Quyền Mới</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black tracking-tight">
                    Có {pendingOrders.length} đơn hàng mua gói từ doanh nghiệp đang chờ duyệt!
                  </h4>
                  <p className="text-xs text-amber-100/90 mt-0.5 max-w-xl">
                    Doanh nghiệp đã quét VietQR hoàn tất thanh toán. Vui lòng đối soát và bấm duyệt để tự động kích hoạt bản quyền gói cho họ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderFilterStatus('PENDING');
                  setActiveTab('revenue');
                }}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-black text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem &amp; Duyệt Ngay ({pendingOrders.length})</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}
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
                                onClick={() => {
                                  setAnnouncementTargetType('SINGLE_COMPANY');
                                  setAnnouncementTargetCompanyId(c.id);
                                  applyAnnouncementTemplate('LICENSE_GRANTED');
                                  setActiveTab('announcements');
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                title="Gửi email thông báo cấp quyền cho doanh nghiệp này"
                              >
                                <Mail size={14} />
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
        <div className="space-y-5 animate-fade-in">
          {/* Top Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pastel-200/80 shadow-soft">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Receipt size={13} />
                <span>Quản Lý Doanh Thu &amp; Cấp Bản Quyền</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Lịch Sử Giao Dịch &amp; Đơn Hàng Mua Gói Doanh Nghiệp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối soát chuyển khoản VietQR, theo dõi doanh nghiệp mua gói và phê duyệt kích hoạt bản quyền tức thì.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-soft transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Tạo Đơn Thu Tiền</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pastel-200/80 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Doanh Thu Thực Thu
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrency(totalPaidRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {paidOrders.length} đơn hàng đã thanh toán
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-soft flex items-center justify-between transition-all ${
              pendingOrders.length > 0 
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/30' 
                : 'bg-white border-pastel-200/80'
            }`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Đơn Hàng Đang Chờ Duyệt
                  </span>
                  {pendingOrders.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                  {pendingOrders.length} đơn hàng
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5 font-medium">
                  {pendingOrders.length > 0 ? '⚡ Cần Admin kiểm tra & duyệt kích hoạt' : 'Hiện không có đơn tồn đọng'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock size={24} className={pendingOrders.length > 0 ? 'animate-pulse' : ''} />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pastel-200/80 shadow-soft flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Số Giao Dịch
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                  {orders.length} giao dịch
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {cancelledOrders.length} đơn đã hủy / không thành công
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Receipt size={24} />
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setOrderFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  orderFilterStatus === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setOrderFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  orderFilterStatus === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock size={13} />
                <span>Chờ Duyệt ({pendingOrders.length})</span>
                {pendingOrders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOrderFilterStatus('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  orderFilterStatus === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>Đã Thanh Toán ({paidOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderFilterStatus('CANCELLED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  orderFilterStatus === 'CANCELLED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <XCircle size={13} />
                <span>Đã Hủy ({cancelledOrders.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, tên công ty, ghi chú..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-pastel-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pastel-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã Đơn / Thời Gian</th>
                    <th className="py-3.5 px-4">Doanh Nghiệp Đặt Mua</th>
                    <th className="py-3.5 px-4">Gói Bản Quyền</th>
                    <th className="py-3.5 px-4">Số Tiền (VND)</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4">Ghi Chú &amp; Chi Tiết</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt size={32} className="text-slate-300" />
                          <p className="font-medium text-slate-500">
                            {orderFilterStatus === 'PENDING'
                              ? 'Hiện không có đơn hàng nào đang chờ duyệt!'
                              : 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isPending = ord.payment_status === 'PENDING';
                      const isPaid = ord.payment_status === 'PAID';
                      const isCancelled = ord.payment_status === 'CANCELLED';

                      // Tìm thông tin doanh nghiệp chi tiết nếu có
                      const matchedCompany = companies.find(
                        (c) => c.id === ord.company_id || c.company_name === ord.company_name
                      );

                      return (
                        <tr
                          key={ord.id}
                          className={`transition ${
                            isPending
                              ? 'bg-amber-50/30 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-800">{ord.id}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {ord.created_at ? ord.created_at.slice(0, 16) : formatDate(ord.order_date)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{ord.company_name}</div>
                            {matchedCompany && (
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                {matchedCompany.admin_email && (
                                  <span>{matchedCompany.admin_email}</span>
                                )}
                                {matchedCompany.admin_phone && (
                                  <span>• {matchedCompany.admin_phone}</span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-[11px] inline-block">
                              {ord.plan_name || ord.plan_code}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                            {formatCurrency(ord.amount)}
                          </td>

                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black animate-pulse">
                                <Clock size={12} className="text-amber-700" />
                                <span>Chờ Duyệt</span>
                              </span>
                            ) : isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold">
                                <CheckCircle2 size={12} />
                                <span>Đã Thanh Toán</span>
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-[11px] font-bold">
                                <XCircle size={12} />
                                <span>Đã Hủy</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">
                                {ord.payment_status}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs">
                            <p className="line-clamp-2 leading-relaxed">{ord.notes || '—'}</p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(ord)}
                                  disabled={approvingOrderId === ord.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                                  title="Duyệt đơn & kích hoạt bản quyền gói ngay cho doanh nghiệp"
                                >
                                  {approvingOrderId === ord.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Zap size={13} className="text-amber-300 fill-amber-300" />
                                  )}
                                  <span>Duyệt &amp; Kích Hoạt</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(ord)}
                                  disabled={cancellingOrderId === ord.id}
                                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                  title="Hủy đơn hàng này"
                                >
                                  <XCircle size={15} />
                                </button>
                              </div>
                            ) : isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAnnouncementForOrder(ord)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 transition cursor-pointer"
                                title="Mở cổng phát thư gửi email thông báo xác nhận bản quyền"
                              >
                                <Mail size={12} />
                                <span>Gửi Lại Thư</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Đã kết thúc</span>
                            )}
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
      {/* TAB 5: PHÁT THƯ GÓI DỊCH VỤ & THÔNG BÁO NỀN TẢNG (SUPER ADMIN) */}
      {/* ==================================================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <Megaphone size={14} className="text-purple-300" />
                  <span>Trung Tâm Phát Thông Báo Nền Tảng (Super Admin Dispatcher)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Phát Thư Gói Dịch Vụ &amp; Bản Quyền Cho Cấp Quản Lý Toàn Hệ Thống
                </h2>
                <p className="text-purple-200/80 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  Dành riêng cho Super Admin (<strong className="text-white font-mono">adminManager@gmail.com</strong>). Kết nối trực tiếp Resend API qua 2 hòm thư đại diện chính thức: <code className="bg-black/30 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">notifications@omniassets.ryug.id.vn</code> (Thông báo gói cước) và <code className="bg-black/30 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold">support@omniassets.ryug.id.vn</code> (Hỗ trợ khách hàng).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-center backdrop-blur-md min-w-[140px]">
                  <div className="text-[10px] text-purple-200 font-bold uppercase">Tổng Cán Bộ Nhận</div>
                  <div className="text-2xl font-black text-amber-300">
                    {loadingRecipients ? '...' : (recipientsData?.totalRecipients || 0)}
                  </div>
                  <div className="text-[10px] text-purple-200/70">
                    trên {recipientsData?.totalCompanies || companies.length} doanh nghiệp
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Templates Bar */}
          <div className="bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={15} className="text-purple-600" />
                <span>Mẫu Thư Nền Tảng Dựng Sẵn (1-Click Nạp Nội Dung)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Chọn mẫu để tự động điền tiêu đề, nội dung và cấu hình gửi chuẩn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => applyAnnouncementTemplate('PLAN_NEW')}
                className="p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-purple-900 group-hover:text-purple-950">
                  <span>🚀 Thông Báo Phát Hành Gói Mới</span>
                </div>
                <p className="text-[11px] text-purple-700/80 mt-1 line-clamp-2">
                  Phát thông báo bảng giá gói cước mới và ưu đãi nâng cấp cho doanh nghiệp.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyAnnouncementTemplate('LICENSE_GRANTED')}
                className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 group-hover:text-emerald-950">
                  <span>🎉 Thông Báo Cấp Quyền Thành Công</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1 line-clamp-2">
                  Xác nhận kích hoạt và mở khóa toàn diện bản quyền cho doanh nghiệp.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyAnnouncementTemplate('NEW_SERVICE')}
                className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 group-hover:text-amber-950">
                  <span>🌟 Thông Báo Dịch Vụ Mới</span>
                </div>
                <p className="text-[11px] text-amber-700/80 mt-1 line-clamp-2">
                  Giới thiệu các tính năng và dịch vụ mới vừa bổ sung trên nền tảng.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyAnnouncementTemplate('SYSTEM_UPDATE')}
                className="p-3.5 rounded-2xl border border-sky-200/80 bg-sky-50/50 hover:bg-sky-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-sky-900 group-hover:text-sky-950">
                  <span>🔔 Thông Báo Sắp Có Bản Cập Nhật</span>
                </div>
                <p className="text-[11px] text-sky-700/80 mt-1 line-clamp-2">
                  Thông báo lịch nâng cấp tính năng và bảo trì tối ưu hóa cơ sở dữ liệu.
                </p>
              </button>
            </div>
          </div>

          {/* Main Dispatch Composer & Target Audience */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Dispatch Form (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders size={16} className="text-purple-600" />
                <span>Soạn Thảo Thông Báo Gói Cước &amp; Cấu Hình Phát Thư</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender Mailbox */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hòm Thư Đại Diện Gửi Đi (Chính Thức) *
                  </label>
                  <select
                    value={announcementSender}
                    onChange={(e) => setAnnouncementSender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-purple-900 bg-purple-50/50 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="notifications">notifications@omniassets.ryug.id.vn (Thông Báo Gói Cước)</option>
                    <option value="support">support@omniassets.ryug.id.vn (Bộ Phận Hỗ Trợ Nền Tảng)</option>
                  </select>
                </div>

                {/* Target Audience Scope */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phạm Vi Người Nhận *
                  </label>
                  <select
                    value={announcementTargetType}
                    onChange={(e) => setAnnouncementTargetType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="ALL_COMPANIES">
                      🌐 Toàn Bộ Khách Hàng ({recipientsData?.totalCompanies || companies.length} Doanh Nghiệp • {recipientsData?.totalRecipients || 0} Cán Bộ)
                    </option>
                    <option value="SINGLE_COMPANY">
                      🏢 Gửi Riêng Cho 1 Doanh Nghiệp Chỉ Định
                    </option>
                  </select>
                </div>
              </div>

              {/* If Single Company: select company */}
              {announcementTargetType === 'SINGLE_COMPANY' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Doanh Nghiệp Nhận Thông Báo *
                  </label>
                  <select
                    value={announcementTargetCompanyId}
                    onChange={(e) => setAnnouncementTargetCompanyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="">-- Vui lòng chọn doanh nghiệp --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} (Admin: {c.admin_email || 'Chưa có email'} - Gói: {c.plan_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu Đề Thư Gửi Đến Cấp Quản Lý *
                </label>
                <input
                  type="text"
                  required
                  value={announcementSubject}
                  onChange={(e) => setAnnouncementSubject(e.target.value)}
                  placeholder="[OmniAssets] Thông báo cập nhật gói cước dịch vụ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội Dung Chi Tiết (Hiển thị nổi bật trong khung thư) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Nhập nội dung thông điệp gửi đến Quản trị viên và Quản lý các công ty..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none leading-relaxed"
                />
              </div>

              {/* Options: Include Pricing Plans */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-2xl flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementIncludePlans}
                    onChange={(e) => setAnnouncementIncludePlans(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-purple-900 block">
                      Tự động đính kèm Bảng Gói Cước Dịch Vụ (Official Pricing Table)
                    </span>
                    <span className="text-[11px] text-purple-700/70">
                      Hiển thị danh sách các gói cước đang áp dụng ({plans.length} gói: {plans.map(p => p.name).join(', ')})
                    </span>
                  </div>
                </label>
              </div>

              {/* CTA Button Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chữ Trên Nút Bấm Hành Động (CTA Button)
                  </label>
                  <input
                    type="text"
                    value={announcementCtaText}
                    onChange={(e) => setAnnouncementCtaText(e.target.value)}
                    placeholder="Khám Phá Các Gói Cước & Nhận Ưu Đãi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đường Dẫn Khi Bấm Vào Nút
                  </label>
                  <input
                    type="text"
                    value={announcementCtaUrl}
                    onChange={(e) => setAnnouncementCtaUrl(e.target.value)}
                    placeholder="https://company-sheet.hieupham101097.workers.dev"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Gửi tự động qua Resend API • Người gửi: <strong className="text-purple-700 font-mono">adminManager@gmail.com</strong>
                </span>

                <button
                  type="button"
                  disabled={sendingAnnouncement}
                  onClick={handleSendAnnouncement}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} className={sendingAnnouncement ? 'animate-pulse' : ''} />
                  <span>{sendingAnnouncement ? 'Đang phát thông báo qua Resend...' : '⚡ Nhấn Để Phát Thư Gói Dịch Vụ Ngay'}</span>
                </button>
              </div>

              {/* Result Banner */}
              {announcementResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 animate-scale-in ${
                    announcementResult.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {announcementResult.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">{announcementResult.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnnouncementResult(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Live Target Recipients Preview (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={15} className="text-emerald-600" />
                  <span>Danh Sách Người Nhận Thư</span>
                </span>
                <button
                  type="button"
                  onClick={fetchAnnouncementRecipients}
                  className="text-slate-400 hover:text-purple-600 p-1"
                  title="Tải lại danh sách"
                >
                  <RefreshCw size={13} className={loadingRecipients ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingRecipients ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-purple-600" />
                  Đang quét danh sách người dùng toàn hệ thống...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số doanh nghiệp:</span>
                      <strong className="text-slate-800">{recipientsData?.totalCompanies || companies.length} công ty</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số cán bộ nhận thư:</span>
                      <strong className="text-purple-700 font-black">{recipientsData?.totalRecipients || 0} cán bộ (Admin &amp; Manager)</strong>
                    </div>
                  </div>

                  <div className="max-h-[460px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {(recipientsData?.companyList || []).map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate" title={comp.company_name}>
                            {comp.company_name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {comp.plan_code}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {comp.recipients.map((rec, rIdx) => (
                            <div key={rIdx} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="font-mono truncate max-w-[180px]">{rec.email}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                                {rec.role}
                              </span>
                            </div>
                          ))}
                          {comp.recipients.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">Chưa có email quản lý</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4.5: HÒM THƯ YÊU CẦU HỖ TRỢ & PHẢN HỒI TICKETS    */}
      {/* ==================================================== */}
      {activeTab === 'support-desk' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <HelpCircle size={14} className="text-purple-300" />
                  <span>Trung Tâm Hỗ Trợ Kỹ Thuật &amp; Khách Hàng Nền Tảng (Support Desk)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Hòm Thư Yêu Cầu Hỗ Trợ &amp; Trả Lời Doanh Nghiệp
                </h2>
                <p className="text-purple-200/80 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  Tiếp nhận các yêu cầu trợ giúp kỹ thuật, báo cáo lỗi hoặc tư vấn gói cước từ doanh nghiệp khách hàng. Bạn có thể soạn thư trả lời trực tiếp từ hòm thư chính thức <strong className="text-emerald-300 font-mono">support@omniassets.ryug.id.vn</strong> ngay trên hệ thống.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={fetchSupportTickets}
                  disabled={loadingTickets}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition backdrop-blur-md cursor-pointer"
                >
                  <RefreshCw size={14} className={loadingTickets ? 'animate-spin' : ''} />
                  <span>Làm mới hòm thư</span>
                </button>
              </div>
            </div>

            {/* Support Desk Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-purple-500/20">
              <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="text-[11px] text-purple-200/80 font-medium">Tổng Số Tickets</div>
                <div className="text-xl font-bold mt-1 text-white">{supportTickets.length}</div>
                <div className="text-[10px] text-purple-300/60 mt-0.5">Yêu cầu từ doanh nghiệp</div>
              </div>

              <div className="bg-amber-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-500/20">
                <div className="text-[11px] text-amber-200 font-medium flex items-center justify-between">
                  <span>Chờ Phản Hồi</span>
                  <Clock size={13} className="text-amber-300" />
                </div>
                <div className="text-xl font-bold mt-1 text-amber-300">
                  {supportTickets.filter(t => t.status === 'PENDING').length}
                </div>
                <div className="text-[10px] text-amber-200/70 mt-0.5">Cần chuyên viên giải đáp</div>
              </div>

              <div className="bg-emerald-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/20">
                <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
                  <span>Đã Phản Hồi</span>
                  <CheckCircle2 size={13} className="text-emerald-300" />
                </div>
                <div className="text-xl font-bold mt-1 text-emerald-300">
                  {supportTickets.filter(t => t.status === 'REPLIED').length}
                </div>
                <div className="text-[10px] text-emerald-200/70 mt-0.5">Đã gửi mail chính thức</div>
              </div>

              <div className="bg-purple-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20">
                <div className="text-[11px] text-purple-200 font-medium flex items-center justify-between">
                  <span>Hòm Thư Phản Hồi</span>
                  <Mail size={13} className="text-purple-300" />
                </div>
                <div className="text-xs font-bold mt-1 text-purple-100 font-mono truncate">
                  support@omniassets.ryug.id.vn
                </div>
                <div className="text-[10px] text-purple-300/70 mt-0.5">Kênh đại diện chính thức</div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={ticketSearchTerm}
                onChange={(e) => setTicketSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo mã Ticket, công ty, người gửi, email hoặc nội dung câu hỏi..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-pastel-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setTicketFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ticketFilterStatus === 'ALL'
                    ? 'bg-purple-600 text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({supportTickets.length})
              </button>

              <button
                type="button"
                onClick={() => setTicketFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ticketFilterStatus === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-soft'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Chờ Phản Hồi ({supportTickets.filter(t => t.status === 'PENDING').length})
              </button>

              <button
                type="button"
                onClick={() => setTicketFilterStatus('REPLIED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ticketFilterStatus === 'REPLIED'
                    ? 'bg-emerald-600 text-white shadow-soft'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Đã Phản Hồi ({supportTickets.filter(t => t.status === 'REPLIED').length})
              </button>
            </div>
          </div>

          {/* Main 2-Column Split View: Tickets List (5 cols) & Ticket Viewer / Reply Composer (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tickets List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-bold uppercase tracking-wider">
                  Danh Sách Yêu Cầu ({filteredTickets.length})
                </span>
                <span>Bấm để xem chi tiết &amp; phản hồi</span>
              </div>

              {loadingTickets ? (
                <div className="bg-white p-8 rounded-2xl border border-pastel-200/80 shadow-soft text-center text-slate-400 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-purple-600" />
                  <p className="text-xs">Đang nạp danh sách hòm thư hỗ trợ...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-pastel-200/80 shadow-soft text-center text-slate-400 space-y-2">
                  <Inbox size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Không tìm thấy yêu cầu hỗ trợ nào phù hợp.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const isPending = t.status === 'PENDING';

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTicket(t);
                          setReplyResult(null);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-400 shadow-md ring-2 ring-purple-200'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-soft'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Clock size={11} />
                                <span>Chờ Phản Hồi</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} />
                                <span>Đã Phản Hồi</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">
                            {t.subject || 'Yêu cầu hỗ trợ hệ thống'}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-purple-700 font-semibold mt-0.5">
                            <Building2 size={12} className="shrink-0 text-purple-500" />
                            <span className="truncate">{t.company_name || 'Doanh Nghiệp'}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {t.message}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span className="truncate">Người gửi: <strong>{t.sender_name || 'Quản lý'}</strong></span>
                          <span className="font-mono text-slate-500 truncate max-w-[160px]">{t.sender_email}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Ticket Viewer & Direct Reply Composer */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="bg-white rounded-3xl border border-pastel-200/90 shadow-soft p-6 space-y-6">
                  {/* Ticket Header & Customer Metadata */}
                  <div className="border-b border-slate-100 pb-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            {selectedTicket.id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedTicket.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {selectedTicket.status === 'PENDING' ? 'Đang Chờ Xử Lý' : 'Đã Gửi Thư Phản Hồi'}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                          {selectedTicket.subject || 'Yêu cầu hỗ trợ hệ thống'}
                        </h3>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <div>Tiếp nhận lúc:</div>
                        <strong className="text-slate-600">
                          {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString('vi-VN') : '—'}
                        </strong>
                      </div>
                    </div>

                    {/* Requester Contact Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs">
                      <div>
                        <span className="text-[10px] text-purple-600 font-bold uppercase block">Doanh nghiệp</span>
                        <strong className="text-slate-800">{selectedTicket.company_name || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-600 font-bold uppercase block">Người liên hệ</span>
                        <strong className="text-slate-800">{selectedTicket.sender_name || 'Quản lý'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-600 font-bold uppercase block">Email nhận phản hồi</span>
                        <a
                          href={`mailto:${selectedTicket.sender_email}`}
                          className="font-mono text-purple-700 font-bold hover:underline truncate block"
                        >
                          {selectedTicket.sender_email || '—'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Customer Message Body */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-purple-600" />
                      <span>Nội Dung Yêu Cầu Của Khách Hàng:</span>
                    </label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Previous Reply Notice (if replied) */}
                  {selectedTicket.status === 'REPLIED' && selectedTicket.reply_message && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/90 space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Thư Phản Hồi Đã Gửi Thành Công:</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {selectedTicket.replied_at ? new Date(selectedTicket.replied_at).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      <div className="p-3 bg-white/90 rounded-xl border border-emerald-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.reply_message}
                      </div>
                      <div className="text-[11px] text-emerald-700 flex items-center justify-between">
                        <span>Đã phát từ: <strong className="font-mono">support@omniassets.ryug.id.vn</strong></span>
                        <span>Bởi: <strong className="font-mono">{selectedTicket.replied_by || 'adminManager@gmail.com'}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* 1-Click Official Reply Composer */}
                  <form onSubmit={handleReplyTicket} className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Send size={14} className="text-purple-600" />
                        <span>{selectedTicket.status === 'REPLIED' ? 'Gửi Thêm Phản Hồi Mới' : 'Soạn Thư Phản Hồi Khách Hàng'}</span>
                      </label>
                      <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-mono font-bold">
                        support@omniassets.ryug.id.vn
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Thư sẽ được hệ thống định dạng thương hiệu OMNIASSETS chuẩn chỉ và gửi trực tiếp qua Resend API đến hòm thư <strong className="text-slate-700 font-mono">{selectedTicket.sender_email}</strong>.
                    </p>

                    {/* Quick Response Helper Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyText('Ban Quản Trị OMNIASSETS đã tiếp nhận yêu cầu của bạn và hoàn tất xử lý trên hệ thống. Bạn vui lòng làm mới trang (F5) để kiểm tra lại nhé!')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-[11px] text-slate-700 font-medium transition cursor-pointer"
                      >
                        ✓ Đã xử lý xong &amp; F5
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyText('Chào bạn, để mở rộng thêm tính năng và số lượng nhân sự, bạn có thể tham khảo bảng gói cước Enterprise 1 Năm với ưu đãi 20%. Đội ngũ kỹ thuật sẵn sàng hỗ trợ kích hoạt Key cho doanh nghiệp.')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-[11px] text-slate-700 font-medium transition cursor-pointer"
                      >
                        🚀 Tư vấn nâng cấp gói
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyText('Cảm ơn đóng góp quý báu của bạn! Bộ phận phát triển sản phẩm đã ghi nhận tính năng này vào lộ trình cập nhật tiếp theo của OMNIASSETS.')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-[11px] text-slate-700 font-medium transition cursor-pointer"
                      >
                        💡 Ghi nhận góp ý tính năng
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập nội dung thư phản hồi chi tiết giải đáp cho khách hàng..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-400 outline-none leading-relaxed bg-white"
                    />

                    {replyResult && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-scale-in ${
                          replyResult.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {replyResult.type === 'success' ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="flex-1">{replyResult.text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Người gửi đại diện: <strong className="text-purple-700 font-mono">adminManager@gmail.com</strong>
                      </span>

                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-soft transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {sendingReply ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Đang gửi thư qua Resend...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Gửi Thư Phản Hồi Chính Thức</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft p-12 text-center text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                    <HelpCircle size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Chưa Chọn Yêu Cầu Hỗ Trợ</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Vui lòng chọn một ticket từ danh sách bên trái để đọc nội dung và soạn thư phản hồi chính thức cho khách hàng.
                  </p>
                </div>
              )}
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
