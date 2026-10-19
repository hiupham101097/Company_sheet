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
  Award
} from 'lucide-react';
import { Modal } from '../Common/Modal';
import { Badge } from '../Common/Badge';
import { api } from '../../services/api';

export function SuperAdminPortal({ currentUser }) {
  const [activeTab, setActiveTab] = useState('companies'); // 'companies' | 'plans' | 'revenue' | 'overview'
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

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

  // Tải dữ liệu toàn bộ
  const fetchData = async () => {
    try {
      setLoading(true);
      const [overRes, compRes, planRes, ordRes] = await Promise.all([
        api.getSuperAdminOverview(),
        api.getSuperAdminCompanies(),
        api.getSuperAdminPlans(),
        api.getSuperAdminOrders()
      ]);

      setOverview(overRes?.data || null);
      setCompanies(compRes?.data || []);
      setPlans(planRes?.data || []);
      setOrders(ordRes?.data || []);
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

  const stats = overview?.stats || {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.license_status === 'ACTIVE').length,
    trialCompanies: companies.filter((c) => c.plan_code === 'TRIAL_2M').length,
    expiredCompanies: companies.filter((c) => c.license_status === 'EXPIRED').length,
    lockedCompanies: companies.filter((c) => c.license_status === 'LOCKED').length,
    totalRevenue: companies.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0),
    totalOrders: orders.length
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
              Quản Trị Doanh Nghiệp & Doanh Thu Gói
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tài khoản riêng biệt dành cho bạn: Cấp quyền hoạt động, kiểm soát các tổ chức/doanh nghiệp, xây dựng các gói cước (1 năm, vĩnh viễn, dùng thử 2 tháng) và giám sát dòng tiền đăng ký.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition backdrop-blur-md"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition transform active:scale-95"
            >
              <Plus size={16} />
              Thêm Doanh Nghiệp
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-purple-500/20">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
            <div className="text-[11px] text-purple-200/70 font-medium">Tổng Doanh Nghiệp</div>
            <div className="text-xl font-bold mt-1 text-white">{stats.totalCompanies}</div>
            <div className="text-[10px] text-purple-300/60 mt-0.5">Khách hàng hệ thống</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/20">
            <div className="text-[11px] text-emerald-300 font-medium">Đang Hoạt Động</div>
            <div className="text-xl font-bold mt-1 text-emerald-400">{stats.activeCompanies}</div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Được cấp quyền</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-500/20">
            <div className="text-[11px] text-amber-300 font-medium">Dùng Thử (2 Tháng)</div>
            <div className="text-xl font-bold mt-1 text-amber-400">{stats.trialCompanies}</div>
            <div className="text-[10px] text-amber-200/70 mt-0.5">Tiềm năng chuyển đổi</div>
          </div>

          <div className="bg-rose-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-rose-500/20">
            <div className="text-[11px] text-rose-300 font-medium">Hết Hạn / Tạm Khóa</div>
            <div className="text-xl font-bold mt-1 text-rose-400">
              {(Number(stats.expiredCompanies) || 0) + (Number(stats.lockedCompanies) || 0)}
            </div>
            <div className="text-[10px] text-rose-200/70 mt-0.5">Cần nhắc gia hạn</div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20 col-span-2 sm:col-span-2">
            <div className="text-[11px] text-purple-200 font-medium flex items-center justify-between">
              <span>Doanh Thu Gói Thu Được</span>
              <TrendingUp size={13} className="text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold mt-1 text-amber-300">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-[10px] text-purple-300/70 mt-0.5">
              Từ {stats.totalOrders || 0} đơn hàng kích hoạt
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-pastel-200 pb-2">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'companies'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 size={15} />
          Quản Lý Doanh Nghiệp ({companies.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'revenue'
              ? 'bg-purple-600 text-white shadow-soft'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt size={15} />
          Doanh Thu & Hóa Đơn Gói ({orders.length})
        </button>
      </div>

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
                    <th className="py-3.5 px-4">Thời Hạn & Ngày Hết</th>
                    <th className="py-3.5 px-4">Doanh Thu Thu Được</th>
                    <th className="py-3.5 px-4">Trạng Thái Bản Quyền</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác Cấp Quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-100 text-xs">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
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
                            {c.plan_code === 'LIFETIME' ? (
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
                                onClick={() => handleOpenLicense(c)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition border border-purple-200"
                                title="Cấp quyền sử dụng / Gia hạn / Đổi gói"
                              >
                                <Sparkles size={13} />
                                Cấp quyền
                              </button>

                              <button
                                onClick={() => handleToggleLockCompany(c)}
                                className={`p-1.5 rounded-lg border transition ${
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
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
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
    </div>
  );
}
