import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Globe,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Bell,
  Calendar,
  Coffee,
  Info,
  RefreshCw,
  Crown,
  Key,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Mail,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  Megaphone,
  X,
  Search,
  Plus,
  Trash2,
  UserCheck,
  Laptop,
  CheckSquare,
  FileText,
  TrendingUp,
  CalendarCheck,
  Sliders
} from 'lucide-react';
import { api } from '../../services/api';
import { getDefaultPermissionsForDepartment } from '../../utils/permissionHelper';

const PERMISSION_MODULES = [
  {
    id: 'assets',
    name: 'Tài Sản & Thiết Bị',
    icon: Laptop,
    badgeColor: 'bg-emerald-100 text-emerald-800',
    permissions: [
      { id: 'assets_view', label: 'Xem danh sách tài sản & thiết bị' },
      { id: 'assets_create', label: 'Thêm mới tài sản & trang thiết bị' },
      { id: 'assets_edit', label: 'Chỉnh sửa & báo hỏng / chuyển bảo trì' },
      { id: 'assets_delete', label: 'Xóa & thanh lý tài sản' },
      { id: 'assets_handover', label: 'Lập biên bản bàn giao & thu hồi máy' },
    ]
  },
  {
    id: 'tasks',
    name: 'Công Việc & Tiến Độ',
    icon: CheckSquare,
    badgeColor: 'bg-blue-100 text-blue-800',
    permissions: [
      { id: 'tasks_view', label: 'Xem danh sách công việc & nhắc hạn' },
      { id: 'tasks_create', label: 'Khởi tạo việc & giao cho nhân viên' },
      { id: 'tasks_edit', label: 'Chỉnh sửa tiến độ & gia hạn công việc' },
      { id: 'tasks_delete', label: 'Xóa & hủy bỏ công việc' },
    ]
  },
  {
    id: 'attendance',
    name: 'Chấm Công & Giờ Làm Việc',
    icon: CalendarCheck,
    badgeColor: 'bg-teal-100 text-teal-800',
    permissions: [
      { id: 'attendance_checkin', label: 'Điểm danh Check-in / Check-out ca làm' },
      { id: 'attendance_view_all', label: 'Xem bảng tổng hợp công toàn công ty' },
      { id: 'attendance_approve', label: 'Phê duyệt giải trình đi muộn & nghỉ phép' },
      { id: 'attendance_send_timesheet', label: 'Gửi email phiếu công tháng đến nhân viên' },
    ]
  },
  {
    id: 'contracts',
    name: 'Hợp Đồng & Biên Bản Pháp Lý',
    icon: FileText,
    badgeColor: 'bg-amber-100 text-amber-800',
    permissions: [
      { id: 'contracts_view', label: 'Xem danh sách hợp đồng & đối tác' },
      { id: 'contracts_create', label: 'Tạo mới hợp đồng & phụ lục' },
      { id: 'contracts_ai', label: 'Trợ lý AI Soạn thảo & học mẫu hợp đồng' },
      { id: 'contracts_delete', label: 'Xóa & lưu trữ hợp đồng' },
    ]
  },
  {
    id: 'finance',
    name: 'Tài Chính & Doanh Thu - Chi Phí',
    icon: TrendingUp,
    badgeColor: 'bg-indigo-100 text-indigo-800',
    permissions: [
      { id: 'finance_view', label: 'Xem tổng quan dòng tiền & lợi nhuận' },
      { id: 'finance_create', label: 'Lập phiếu thu / phiếu chi mới' },
      { id: 'finance_export', label: 'Xuất báo cáo tài chính & bảng kê' },
    ]
  },
  {
    id: 'users',
    name: 'Quản Lý Nhân Sự & Tài Khoản',
    icon: Users,
    badgeColor: 'bg-rose-100 text-rose-800',
    permissions: [
      { id: 'users_view', label: 'Xem danh sách hồ sơ nhân sự' },
      { id: 'users_create', label: 'Thêm nhân viên mới & cấp tài khoản' },
      { id: 'users_edit', label: 'Chỉnh sửa phòng ban, chức vụ & đổi vai trò' },
      { id: 'users_lock', label: 'Khóa / Mở khóa quyền truy cập của nhân viên' },
    ]
  }
];



export function SettingsManager({ 
  users = [],
  currentUser,
  userRole = 'ADMIN', 
  companySettings,
  onRefresh, 
  licenseInfo, 
  onOpenUpgrade,
  onNavigate
}) {
  const [activeSubTab, setActiveSubTab] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Email Test States
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingMail, setTestingMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState(null);
  const [sendingRemindersNow, setSendingRemindersNow] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [customRecipientInput, setCustomRecipientInput] = useState('');

  // Permissions Management States
  const [permMode, setPermMode] = useState('DEPARTMENT'); // 'DEPARTMENT' | 'USER'
  const [categoriesDept, setCategoriesDept] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permSaveSuccess, setPermSaveSuccess] = useState(false);
  const [updatingUserRole, setUpdatingUserRole] = useState(false);

  // Broadcast & Direct Dispatch Center States
  const [broadcastRecipientType, setBroadcastRecipientType] = useState('ALL'); // 'ALL' | 'SINGLE' | 'DEPARTMENT'
  const [broadcastTargetEmail, setBroadcastTargetEmail] = useState('');
  const [broadcastTargetDept, setBroadcastTargetDept] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastUrgency, setBroadcastUrgency] = useState('NORMAL'); // 'NORMAL' | 'URGENT' | 'ANNOUNCEMENT'
  const [broadcastSenderType, setBroadcastSenderType] = useState('tasks');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [staffUsers, setStaffUsers] = useState(users || []);
  
  // 1-Click Management Notification States (Resend -> notifications@omniassets.ryug.id.vn)
  const [sendingManagerNotice, setSendingManagerNotice] = useState(false);
  const [managerNoticeResult, setManagerNoticeResult] = useState(null);
  const [managerCustomMessage, setManagerCustomMessage] = useState('');
  const [showManagerCustomInput, setShowManagerCustomInput] = useState(false);

  // Support Request States (Gửi về hieupham101097@gmail.com)
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportResult, setSupportResult] = useState(null);

  // Settings State Form
  const [settings, setSettings] = useState({
    // Attendance
    work_start_time: '08:30',
    work_end_time: '17:30',
    late_grace_minutes: '15',
    overtime_start_time: '18:00',
    work_days: 'Thứ 2 - Thứ 6',
    require_late_reason: 'true',
    lunch_break_start: '12:00',
    lunch_break_end: '13:30',
    // Web & General
    company_name: 'OMNI ASSETS & LOGISTICS',
    system_title: 'Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp',
    company_email: 'contact@omniassets.vn',
    company_phone: '1900 6868',
    company_address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, TP. Hồ Chí Minh',
    tax_id: '0109887766',
    currency: 'VND',
    system_announcement: 'Chào mừng bạn đến với hệ thống quản trị vận hành OMNI ASSETS!',
    allow_user_registration: 'false',
    // Role-based permissions matrix
    dept_permissions: '',
    user_permissions: '',
    // Email Service (Master Gateway & Tenant Preferences)
    mail_provider: 'resend',
    mail_api_key: '',
    mail_sender_name: 'OMNIASSETS',
    mail_sender_email: 'support@omniassets.ryug.id.vn',
    mail_reply_to: 'support@omniassets.ryug.id.vn',
    mail_support_inbox: 'support@omniassets.ryug.id.vn',
    mail_report_recipients: '',
    mail_notify_new_user: 'true',
    mail_notify_reminders: 'true',
    mail_notify_timesheet: 'true'
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.data?.settings) {
        setSettings((prev) => ({
          ...prev,
          ...res.data.settings
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải cài đặt:', err);
      setStatusMessage({ type: 'error', text: 'Không thể tải cài đặt từ máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    // 1. Lấy danh mục phòng ban chuẩn theo cơ cấu tổ chức của doanh nghiệp
    api.getCategories('DEPARTMENT')
      .then((res) => {
        const list = res?.data || [];
        const names = list.map(c => c.name).filter(Boolean);
        if (names.length > 0) {
          setCategoriesDept(names);
        }
      })
      .catch((err) => console.error('Lỗi tải danh mục phòng ban:', err));

    // 2. Lấy danh sách nhân sự thực tế
    api.getUsers()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.users || []);
        if (list && list.length > 0) {
          setStaffUsers(list);
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách nhân sự:', err));
  }, []);

  useEffect(() => {
    if (users && users.length > 0) {
      setStaffUsers(users);
    }
  }, [users]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'SUPER_ADMIN') {
      alert('Bạn không có quyền thay đổi cài đặt hệ thống');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.updateSettings(settings);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Đã lưu và áp dụng cài đặt mới thành công!' });
        if (onRefresh) onRefresh();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Lỗi khi lưu cài đặt' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ khi lưu' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    if (e) e.preventDefault();
    try {
      setTestingMail(true);
      setTestMailResult(null);
      const target = testEmailRecipient.trim() || settings.company_email;
      const res = await api.sendTestEmail({ email: target });
      if (res.success) {
        setTestMailResult({
          type: 'success',
          text: res.message || `Đã gửi thành công email thử nghiệm đến ${target}!`
        });
      } else {
        setTestMailResult({
          type: 'error',
          text: res.message || 'Lỗi khi gửi email thử nghiệm'
        });
      }
    } catch (err) {
      setTestMailResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối tới dịch vụ email'
      });
    } finally {
      setTestingMail(false);
    }
  };

  const currentRecipientsList = useMemo(() => {
    return (settings.mail_report_recipients || '')
      .split(/[,;\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }, [settings.mail_report_recipients]);

  const handleAddRecipient = (emailToAdd) => {
    const clean = (emailToAdd || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    const current = (settings.mail_report_recipients || '')
      .split(/[,;\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!current.includes(clean)) {
      current.push(clean);
      handleChange('mail_report_recipients', current.join(', '));
    }
  };

  const handleRemoveRecipient = (emailToRemove) => {
    const clean = (emailToRemove || '').trim().toLowerCase();
    const current = (settings.mail_report_recipients || '')
      .split(/[,;\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const updated = current.filter((e) => e !== clean);
    handleChange('mail_report_recipients', updated.join(', '));
  };

  const handleToggleRecipient = (email) => {
    const clean = (email || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    if (currentRecipientsList.includes(clean)) {
      handleRemoveRecipient(clean);
    } else {
      handleAddRecipient(clean);
    }
  };

  const handleSelectAllStaff = () => {
    const allEmails = staffUsers
      .map((u) => (u.email || '').trim().toLowerCase())
      .filter((e) => e && e.includes('@'));
    const merged = Array.from(new Set([...currentRecipientsList, ...allEmails]));
    handleChange('mail_report_recipients', merged.join(', '));
  };

  const handleSelectManagers = () => {
    const managerEmails = staffUsers
      .filter((u) => u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN')
      .map((u) => (u.email || '').trim().toLowerCase())
      .filter((e) => e && e.includes('@'));
    const merged = Array.from(new Set([...currentRecipientsList, ...managerEmails]));
    handleChange('mail_report_recipients', merged.join(', '));
  };

  const handleClearAllRecipients = () => {
    handleChange('mail_report_recipients', '');
  };

  const handleSendDailyRemindersNow = async () => {
    try {
      setSendingRemindersNow(true);
      setTestMailResult(null);
      const target = settings.mail_report_recipients || testEmailRecipient.trim() || settings.company_email;
      const res = await api.sendDailyRemindersEmail({ email: target });
      if (res.success) {
        setTestMailResult({
          type: 'success',
          text: res.message || `Đã gửi bản tin nhắc hạn 06:00 AM thành công!`
        });
      } else {
        setTestMailResult({
          type: 'error',
          text: res.message || 'Lỗi gửi bản tin nhắc hạn'
        });
      }
    } catch (err) {
      setTestMailResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi bản tin nhắc hạn'
      });
    } finally {
      setSendingRemindersNow(false);
    }
  };

  const handleBroadcastEmail = async (e) => {
    if (e) e.preventDefault();
    setBroadcastResult(null);

    if (!broadcastSubject.trim()) {
      setBroadcastResult({ type: 'error', text: 'Vui lòng nhập tiêu đề email thông báo' });
      return;
    }
    if (!broadcastContent.trim()) {
      setBroadcastResult({ type: 'error', text: 'Vui lòng nhập nội dung thông báo' });
      return;
    }
    if (broadcastRecipientType === 'SINGLE' && (!broadcastTargetEmail.trim() || !broadcastTargetEmail.includes('@'))) {
      setBroadcastResult({ type: 'error', text: 'Vui lòng nhập hoặc chọn địa chỉ email người nhận hợp lệ' });
      return;
    }

    try {
      setBroadcasting(true);
      const res = await api.broadcastEmail({
        recipient_type: broadcastRecipientType,
        target_email: broadcastTargetEmail.trim(),
        target_department: broadcastTargetDept,
        subject: broadcastSubject.trim(),
        content: broadcastContent.trim(),
        urgency: broadcastUrgency,
        sender_type: broadcastSenderType
      });

      if (res.success) {
        setBroadcastResult({
          type: 'success',
          text: res.message || 'Đã phát thư thành công!',
          details: res.data
        });
        setBroadcastContent('');
      } else {
        setBroadcastResult({
          type: 'error',
          text: res.message || 'Lỗi khi phát thư'
        });
      }
    } catch (err) {
      setBroadcastResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi phát thư'
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSendSupport = async (e) => {
    if (e) e.preventDefault();
    setSupportResult(null);

    if (!supportMessage.trim()) {
      setSupportResult({ type: 'error', text: 'Vui lòng nhập nội dung cần hỗ trợ' });
      return;
    }

    try {
      setSendingSupport(true);
      const res = await api.sendSupportEmail({
        subject: supportSubject.trim() || 'Yêu cầu hỗ trợ từ doanh nghiệp',
        message: supportMessage.trim(),
        sender_name: settings.company_name,
        sender_email: settings.company_email,
        sender_phone: settings.company_phone,
        company_name: settings.company_name
      });

      if (res.success) {
        setSupportResult({
          type: 'success',
          text: res.message || 'Đã gửi yêu cầu hỗ trợ thành công đến Ban Quản Trị OMNIASSETS!'
        });
        setSupportMessage('');
        setSupportSubject('');
      } else {
        setSupportResult({
          type: 'error',
          text: res.message || 'Lỗi gửi yêu cầu hỗ trợ'
        });
      }
    } catch (err) {
      setSupportResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi yêu cầu'
      });
    } finally {
      setSendingSupport(false);
    }
  };

  // ================= 1-CLICK MANAGEMENT NOTIFICATION (ADMIN & MANAGER) =================
  const adminAndManagerUsers = useMemo(() => {
    return staffUsers.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN');
  }, [staffUsers]);

  const handleSendManagementNotification = async (customText = '') => {
    try {
      setSendingManagerNotice(true);
      setManagerNoticeResult(null);
      const res = await api.sendManagementNotification({
        message: customText || managerCustomMessage || undefined,
        sender_name: settings.company_name
      });
      if (res.success) {
        setManagerNoticeResult({
          type: 'success',
          text: res.message || 'Đã tự động gửi email thành công qua Resend đến toàn bộ Admin & Manager!'
        });
        setStatusMessage({
          type: 'success',
          text: res.message || 'Đã gửi thông báo đến các Admin & Manager thành công!'
        });
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setManagerNoticeResult({
          type: 'error',
          text: res.message || 'Lỗi khi gửi email đến cấp quản lý'
        });
      }
    } catch (err) {
      setManagerNoticeResult({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi email thông báo'
      });
    } finally {
      setSendingManagerNotice(false);
    }
  };

  // ================= PERMISSION & ROLE MANAGEMENT HELPERS =================
  const deptPermissionsMap = useMemo(() => {
    try {
      if (settings.dept_permissions) {
        const parsed = typeof settings.dept_permissions === 'string'
          ? JSON.parse(settings.dept_permissions)
          : settings.dept_permissions;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi parse dept_permissions:', e);
    }
    return {};
  }, [settings.dept_permissions]);

  const userPermissionsMap = useMemo(() => {
    try {
      if (settings.user_permissions) {
        const parsed = typeof settings.user_permissions === 'string'
          ? JSON.parse(settings.user_permissions)
          : settings.user_permissions;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi parse user_permissions:', e);
    }
    return {};
  }, [settings.user_permissions]);

  const availableDepartments = useMemo(() => {
    const list = new Set();

    // 1. Nguồn ưu tiên số 1: Danh mục Cơ cấu tổ chức / Phòng ban chính thức từ API
    categoriesDept.forEach(d => {
      if (d && String(d).trim()) list.add(String(d).trim());
    });

    // 2. Bổ sung các phòng ban thực tế mà nhân sự đang làm việc
    staffUsers.forEach(u => {
      if (u.department && String(u.department).trim()) list.add(String(u.department).trim());
    });

    return Array.from(list);
  }, [categoriesDept, staffUsers]);

  // Tự động đồng bộ phòng ban hợp lệ đầu tiên nếu phòng ban đang chọn chưa được chọn hoặc không có trong danh mục
  useEffect(() => {
    if (availableDepartments.length > 0) {
      if (!selectedDept || !availableDepartments.includes(selectedDept)) {
        setSelectedDept(availableDepartments[0]);
      }
      if (!broadcastTargetDept || !availableDepartments.includes(broadcastTargetDept)) {
        setBroadcastTargetDept(availableDepartments[0]);
      }
    }
  }, [availableDepartments, selectedDept, broadcastTargetDept]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId && staffUsers.length > 0) {
      return staffUsers[0];
    }
    return staffUsers.find(u => String(u.id) === String(selectedUserId)) || staffUsers[0] || null;
  }, [selectedUserId, staffUsers]);

  const handleToggleDeptPermission = (deptName, permId) => {
    const currentList = deptPermissionsMap[deptName] || getDefaultPermissionsForDepartment(deptName);
    let updatedList;
    if (currentList.includes(permId)) {
      updatedList = currentList.filter(id => id !== permId);
    } else {
      updatedList = [...currentList, permId];
    }
    const updatedMap = {
      ...deptPermissionsMap,
      [deptName]: updatedList
    };
    handleChange('dept_permissions', JSON.stringify(updatedMap));
  };

  const handleSelectAllDeptPerms = (deptName) => {
    const allPermIds = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.id));
    const updatedMap = {
      ...deptPermissionsMap,
      [deptName]: allPermIds
    };
    handleChange('dept_permissions', JSON.stringify(updatedMap));
  };

  const handleClearDeptPerms = (deptName) => {
    const updatedMap = {
      ...deptPermissionsMap,
      [deptName]: []
    };
    handleChange('dept_permissions', JSON.stringify(updatedMap));
  };

  const handleSetReadOnlyDeptPerms = (deptName) => {
    const viewOnlyPerms = PERMISSION_MODULES.flatMap(m => 
      m.permissions.filter(p => p.id.endsWith('_view') || p.id === 'attendance_checkin').map(p => p.id)
    );
    const updatedMap = {
      ...deptPermissionsMap,
      [deptName]: viewOnlyPerms
    };
    handleChange('dept_permissions', JSON.stringify(updatedMap));
  };

  const handleResetDeptToDefault = (deptName) => {
    const defaultPerms = getDefaultPermissionsForDepartment(deptName);
    const updatedMap = {
      ...deptPermissionsMap,
      [deptName]: defaultPerms
    };
    handleChange('dept_permissions', JSON.stringify(updatedMap));
  };

  const handleToggleUserOverride = (userId, permId) => {
    if (!userId) return;
    const currentList = userPermissionsMap[userId] || [];
    let updatedList;
    if (currentList.includes(permId)) {
      updatedList = currentList.filter(id => id !== permId);
    } else {
      updatedList = [...currentList, permId];
    }
    const updatedMap = {
      ...userPermissionsMap,
      [userId]: updatedList
    };
    handleChange('user_permissions', JSON.stringify(updatedMap));
  };

  const handleResetUserOverrides = (userId) => {
    if (!userId) return;
    const updatedMap = { ...userPermissionsMap };
    delete updatedMap[userId];
    handleChange('user_permissions', JSON.stringify(updatedMap));
  };

  const handleQuickChangeUserRole = async (userId, newRole) => {
    if (!userId || !newRole) return;
    try {
      setUpdatingUserRole(true);
      const res = await api.updateUser(userId, { role: newRole });
      if (res?.success) {
        setStaffUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, role: newRole } : u));
        setStatusMessage({ type: 'success', text: `Đã cập nhật vai trò nhân sự thành ${newRole}!` });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert(res?.message || 'Không thể cập nhật vai trò');
      }
    } catch (e) {
      alert(e.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setUpdatingUserRole(false);
    }
  };

  // Hàm chuyển đổi 'HH:mm' thành số phút chính xác (tránh lỗi 00 phút bị rơi vào default do falsy)
  const parseTimeToMinutes = (timeStr, defaultH = 8, defaultM = 0) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
      return defaultH * 60 + defaultM;
    }
    const [h, m] = timeStr.split(':').map(Number);
    const validH = Number.isFinite(h) && h >= 0 && h <= 23 ? h : defaultH;
    const validM = Number.isFinite(m) && m >= 0 && m <= 59 ? m : defaultM;
    return validH * 60 + validM;
  };

  const startTotalMinutes = parseTimeToMinutes(settings.work_start_time, 8, 0);
  const endTotalMinutes = parseTimeToMinutes(settings.work_end_time, 17, 30);
  const graceMinutes = Number(settings.late_grace_minutes) || 0;
  const lateMinutes = startTotalMinutes + graceMinutes;
  const lateH = Math.floor(lateMinutes / 60).toString().padStart(2, '0');
  const lateM = (lateMinutes % 60).toString().padStart(2, '0');

  // Tính thời lượng làm việc chuẩn trừ giờ nghỉ trưa
  let netWorkMinutes = endTotalMinutes - startTotalMinutes;
  if (settings.lunch_break_start && settings.lunch_break_end) {
    const lunchStart = parseTimeToMinutes(settings.lunch_break_start, 12, 0);
    const lunchEnd = parseTimeToMinutes(settings.lunch_break_end, 13, 30);
    const lunchDuration = lunchEnd - lunchStart;
    if (lunchDuration > 0 && lunchDuration < netWorkMinutes) {
      netWorkMinutes -= lunchDuration;
    }
  }
  const standardWorkHours = netWorkMinutes > 0 ? (netWorkMinutes / 60).toFixed(1) : '8.0';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pastel-100 text-pastel-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <span>Cài Đặt Hệ Thống & Vận Hành</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tùy biến quy định chấm công, ca làm việc, thông tin đơn vị và giao diện ứng dụng web.
          </p>
        </div>

        {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadSettings}
              disabled={loading || saving}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Tải lại cài đặt"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border animate-scale-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'attendance'
              ? 'border-pastel-500 text-pastel-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Clock size={15} />
          <span>Thời Gian Chấm Công</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('website')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'website'
              ? 'border-pastel-500 text-pastel-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Globe size={15} />
          <span>Thông Tin Doanh Nghiệp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'email'
              ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Mail size={15} className={activeSubTab === 'email' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>{userRole === 'SUPER_ADMIN' ? 'Cổng Email Nền Tảng (Master Gateway)' : 'Hệ Thống Email & Thông Báo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
            activeSubTab === 'permissions'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <ShieldCheck size={15} className={activeSubTab === 'permissions' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Phân Quyền Nội Bộ</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">Phòng ban &amp; Nhân viên</span>
        </button>

        {userRole === 'SUPER_ADMIN' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('rules')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeSubTab === 'rules'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Shield size={15} className="text-indigo-600" />
              <span>Hạ Tầng &amp; Bảo Mật Cơ Sở Dữ Liệu</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">Master</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('license')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeSubTab === 'license'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Crown size={15} className="text-amber-500" />
              <span>Bản Quyền Nền Tảng (Enterprise)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Active</span>
            </button>
          </>
        )}
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ================= TAB 1: ATTENDANCE SETTINGS ================= */}
        {activeSubTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Working Hours Card */}
              <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-pastel-600" />
                    <h3 className="text-sm font-bold text-slate-800">Quy Định Khung Giờ Ca Làm Việc</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-pastel-600 bg-pastel-50 px-2.5 py-1 rounded-full border border-pastel-200">
                    Áp dụng toàn công ty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ vào ca chuẩn (Check-in) *
                    </label>
                    <input
                      type="time"
                      value={settings.work_start_time}
                      onChange={(e) => handleChange('work_start_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Khung giờ bắt đầu ca làm việc buổi sáng</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ tan ca chuẩn (Check-out) *
                    </label>
                    <input
                      type="time"
                      value={settings.work_end_time}
                      onChange={(e) => handleChange('work_end_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 focus:bg-white bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Khung giờ kết thúc giờ làm việc chính thức</p>
                  </div>
                </div>

                {/* Grace Period & OT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Thời gian ân hạn đi muộn (Phút) *</span>
                      <span className="text-[10px] text-pastel-700 font-bold bg-pastel-100 px-2 py-0.5 rounded-md">
                        {settings.late_grace_minutes} phút
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={settings.late_grace_minutes}
                        onChange={(e) => handleChange('late_grace_minutes', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check-in trước <strong>{lateH}:{lateM}</strong> vẫn được tính đúng giờ
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giờ bắt đầu tính làm thêm (OT)
                    </label>
                    <input
                      type="time"
                      value={settings.overtime_start_time}
                      onChange={(e) => handleChange('overtime_start_time', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Check-out sau giờ này sẽ ghi nhận ca làm ngoài giờ</p>
                  </div>
                </div>

                {/* Lunch Break Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Coffee size={14} className="text-amber-500" />
                      <span>Bắt đầu nghỉ trưa</span>
                    </label>
                    <input
                      type="time"
                      value={settings.lunch_break_start}
                      onChange={(e) => handleChange('lunch_break_start', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Coffee size={14} className="text-amber-500" />
                      <span>Kết thúc nghỉ trưa</span>
                    </label>
                    <input
                      type="time"
                      value={settings.lunch_break_end}
                      onChange={(e) => handleChange('lunch_break_end', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-pastel-200/90 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                    />
                  </div>
                </div>

                {/* Working Days Select */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-pastel-600" />
                    <span>Lịch ngày làm việc trong tuần</span>
                  </label>
                  <select
                    value={settings.work_days}
                    onChange={(e) => handleChange('work_days', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  >
                    <option value="Thứ 2 - Thứ 6">Thứ 2 đến Thứ 6 (Nghỉ Thứ 7 & Chủ Nhật)</option>
                    <option value="Thứ 2 - Thứ 7">Thứ 2 đến Thứ 7 (Nghỉ Chủ Nhật)</option>
                    <option value="Thứ 2 - Thứ 7 (Thứ 7 nửa ngày)">Thứ 2 đến Thứ 7 (Thứ 7 làm việc buổi sáng)</option>
                    <option value="Tất cả các ngày">Làm việc ca xoay vòng (Cả tuần)</option>
                  </select>
                </div>

                {/* Require late reason switch */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pastel-50/50 border border-pastel-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Yêu cầu ghi chú khi đi muộn</p>
                    <p className="text-[11px] text-slate-500">
                      Bắt buộc nhân sự ghi rõ lý do vào ca trễ để quản lý phê duyệt
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_late_reason === 'true'}
                    onChange={(e) => handleChange('require_late_reason', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded text-pastel-600 focus:ring-pastel-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Live Attendance Rule Preview */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-pastel-500 to-pastel-700 text-white p-6 rounded-3xl shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pastel-200">
                    Xem Trước Quy Tắc Chấm Công
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-bold tracking-tight">
                    {settings.work_start_time} - {settings.work_end_time}
                  </h4>
                  <p className="text-xs text-pastel-100">
                    Thời lượng ca làm việc tiêu chuẩn: {standardWorkHours} giờ/ngày
                  </p>
                </div>

                <div className="pt-3 border-t border-white/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-pastel-200">Giờ vào chuẩn:</span>
                    <span className="font-bold">{settings.work_start_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pastel-200">Ân hạn cho phép:</span>
                    <span className="font-bold">+{settings.late_grace_minutes} phút</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-200 font-semibold">
                    <span>Đúng giờ đến:</span>
                    <span className="bg-emerald-500/40 px-2 py-0.5 rounded-md">≤ {lateH}:{lateM}</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-200 font-semibold">
                    <span>Tính đi muộn:</span>
                    <span className="bg-rose-500/40 px-2 py-0.5 rounded-md">&gt; {lateH}:{lateM}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-200 font-semibold pt-1 border-t border-white/10">
                    <span>Bắt đầu tính OT:</span>
                    <span>Từ {settings.overtime_start_time}</span>
                  </div>
                </div>

                <div className="text-[11px] text-pastel-100 bg-white/10 p-3 rounded-xl border border-white/15">
                  💡 <em>Lưu ý: Mọi thay đổi về giờ chấm công sẽ được áp dụng tự động cho các lượt Check-in/Check-out tiếp theo ngay sau khi bạn nhấn "Lưu Thay Đổi".</em>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: WEBSITE & COMPANY SETTINGS ================= */}
        {activeSubTab === 'website' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-pastel-600" />
                  <h3 className="text-sm font-bold text-slate-800">Thông Tin Nhận Diện Doanh Nghiệp & Trang Web</h3>
                </div>
                <span className="text-[11px] font-semibold text-pastel-600 bg-pastel-50 px-2.5 py-1 rounded-full border border-pastel-200">
                  Hiển thị trên giao diện & biên bản bàn giao
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên Doanh Nghiệp / Đơn Vị *
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="VD: CÔNG TY TNHH VẬN HÀNH TÀI SẢN..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Sử dụng trong tiêu đề trang, biên bản và báo cáo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu Đề Hệ Thống Ứng Dụng *
                  </label>
                  <input
                    type="text"
                    value={settings.system_title}
                    onChange={(e) => handleChange('system_title', e.target.value)}
                    placeholder="VD: Hệ Thống Quản Lý Tài Sản & Vận Hành Doanh Nghiệp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Xuất hiện trên tiêu đề trang web</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Liên Hệ Hệ Thống
                  </label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    placeholder="contact@company.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hotline / Điện Thoại Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={settings.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    placeholder="1900 xxxx hoặc 028 xxx..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa Chỉ Trụ Sở Doanh Nghiệp
                  </label>
                  <input
                    type="text"
                    value={settings.company_address}
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    placeholder="Địa chỉ số nhà, đường, quận/huyện, tỉnh/thành phố..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Địa chỉ in ở đầu các mẫu Biên bản bàn giao tài sản chuẩn A4</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã Số Thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={settings.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value)}
                    placeholder="010xxxxxxx..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Đơn Vị Tiền Tệ Mặc Định
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  >
                    <option value="VND">Việt Nam Đồng (VND - ₫)</option>
                    <option value="USD">Đô la Mỹ (USD - $)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Bell size={14} className="text-pastel-600" />
                    <span>Thông Báo Chung Toàn Hệ Thống (Hiển thị bảng tin)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={settings.system_announcement}
                    onChange={(e) => handleChange('system_announcement', e.target.value)}
                    placeholder="Nhập thông báo gửi tới toàn thể nhân viên khi đăng nhập vào hệ thống..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: EMAIL SERVICE & AUTOMATION ================= */}
        {activeSubTab === 'email' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-soft relative overflow-hidden">
              <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
                <Mail size={180} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase mb-2 text-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    <span>Cổng Gửi Mail Tự Động Doanh Nghiệp</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Hệ Thống Dịch Vụ Email &amp; Tự Động Hóa</h3>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
                    Hạ tầng đám mây phân phối thư bảo mật qua máy chủ xác thực DKIM &amp; SPF 100%. Mọi thông báo vận hành nội bộ được gửi tự động và an toàn.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs shrink-0">
                  <div className="text-[11px] text-emerald-200 uppercase font-semibold">Tên Miền Xác Thực</div>
                  <div className="text-sm font-bold mt-0.5 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <span>omniassets.ryug.id.vn</span>
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-1 font-medium">
                    {userRole === 'SUPER_ADMIN' ? 'Hạ Tầng Toàn Nền Tảng' : 'Đang Hoạt Động (Active)'}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= GIAO DIỆN DÀNH CHO SUPER ADMIN ================= */}
            {userRole === 'SUPER_ADMIN' ? (
              <>
                {/* Master Gateway Config */}
                <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-soft space-y-5">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-800">
                        1. Cấu Hình Email Toàn Hệ Thống (Master Gateway)
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                      Quyền Quản Trị Tối Cao
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Cấu hình này áp dụng chung cho toàn bộ nền tảng. Khi các doanh nghiệp thành viên gửi thông báo hoặc bản tin, hệ thống sẽ tự động dùng cổng Master này để phân phối an toàn.
                  </p>

                  {/* Provider Radio Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Nhà Cung Cấp Dịch Vụ Email Master *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        onClick={() => handleChange('mail_provider', 'resend')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          settings.mail_provider === 'resend'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.mail_provider === 'resend' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                              {settings.mail_provider === 'resend' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-bold text-slate-800">Resend Mail API (Khuyên dùng)</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Domain Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 pl-6">
                          Đã xác thực tên miền omniassets.ryug.id.vn, tốc độ gửi dưới 500ms, tỷ lệ vào Hộp thư đến 99.9%.
                        </p>
                      </div>

                      <div
                        onClick={() => handleChange('mail_provider', 'brevo')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          settings.mail_provider === 'brevo'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.mail_provider === 'brevo' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                              {settings.mail_provider === 'brevo' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-bold text-slate-800">Brevo (Sendinblue API v3)</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            Dự Phòng
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 pl-6">
                          Cổng gửi dự phòng qua API Key v3 khi cần chuyển đổi nhà cung cấp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        API Key Master ({settings.mail_provider === 'resend' ? 'Resend' : 'Brevo'}) *
                      </label>
                      <a
                        href={settings.mail_provider === 'resend' ? 'https://resend.com/api-keys' : 'https://app.brevo.com/settings/keys/api'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <span>Quản lý API Key</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.mail_api_key}
                        onChange={(e) => handleChange('mail_api_key', e.target.value)}
                        placeholder="Nhập API Key gửi mail..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                      >
                        {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Master Sender, Reply-To & Support Inbox */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Người Gửi Master *
                      </label>
                      <input
                        type="email"
                        value={settings.mail_sender_email}
                        onChange={(e) => handleChange('mail_sender_email', e.target.value)}
                        placeholder="notifications@omniassets.ryug.id.vn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Nhận Phản Hồi (Reply-To Master) *
                      </label>
                      <input
                        type="email"
                        value={settings.mail_reply_to}
                        onChange={(e) => handleChange('mail_reply_to', e.target.value)}
                        placeholder="hieupham101097@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Hộp Thư Nhận Hỗ Trợ (Support Inbox) *
                      </label>
                      <input
                        type="email"
                        value={settings.mail_support_inbox}
                        onChange={(e) => handleChange('mail_support_inbox', e.target.value)}
                        placeholder="support@omniassets.ryug.id.vn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                    </div>
                  </div>

                  {/* Connection verification for Super Admin */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Kiểm Tra Trạng Thái Kết Nối Cổng Master Gateway
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="hieupham101097@gmail.com"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-indigo-200 text-xs font-semibold text-slate-800 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={testingMail}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {testingMail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>Gửi Thư Xác Nhận</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Dedicated Mailboxes Overview for Super Admin */}
                <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        2. Danh Mục 7 Hộp Thư Nghiệp Vụ Chuyên Dụng Nền Tảng
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                      @omniassets.ryug.id.vn
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Platform Mailboxes */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-indigo-600" />
                          Hộp Thư Nền Tảng (Super Admin)
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          2 Hộp Thư
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900">notifications@omniassets.ryug.id.vn</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">Hệ Thống &amp; Gói Cước</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">Thông báo chung toàn sàn, phát thư bảng giá gói dịch vụ, kích hoạt tài khoản.</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900">support@omniassets.ryug.id.vn</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">Hỗ Trợ Khách Hàng</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">Hòm thư giải đáp kỹ thuật và tiếp nhận yêu cầu từ các công ty.</p>
                        </div>
                      </div>
                    </div>

                    {/* Tenant Mailboxes */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Building size={14} className="text-emerald-600" />
                          Hộp Thư Vận Hành Doanh Nghiệp (Tenants)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          5 Hộp Thư Nghiệp Vụ
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">attendance@omniassets.ryug.id.vn</span>
                          <span className="text-[11px] text-slate-500">Chấm Công &amp; Đi Trễ</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">tasks@omniassets.ryug.id.vn</span>
                          <span className="text-[11px] text-slate-500">Giao Việc &amp; Tài Khoản</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">assets@omniassets.ryug.id.vn</span>
                          <span className="text-[11px] text-slate-500">Quản Lý Tài Sản</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">contracts@omniassets.ryug.id.vn</span>
                          <span className="text-[11px] text-slate-500">Quản Lý Hợp Đồng</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">reports@omniassets.ryug.id.vn</span>
                          <span className="text-[11px] text-slate-500">Bản Tin Nhắc Hạn 06:00 AM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Default Enterprise Sender Identity */}
                <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      3. Thông Tin Nhận Diện Doanh Nghiệp Mặc Định
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Hiển Thị Của Doanh Nghiệp (Sender Name) *
                      </label>
                      <input
                        type="text"
                        value={settings.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ Á CHÂU"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Xuất hiện ở mục Người gửi (From) trong hộp thư nhân viên</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Phản Hồi Nội Bộ Của Doanh Nghiệp (Reply-To Công Ty) *
                      </label>
                      <input
                        type="email"
                        value={settings.company_email}
                        onChange={(e) => handleChange('company_email', e.target.value)}
                        placeholder="contact@tencongty.vn hoặc hr@tencongty.vn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Khi nhân viên nhấn Trả lời thư, phản hồi sẽ gửi về email này</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ================= GIAO DIỆN DÀNH RIÊNG CHO DOANH NGHIỆP (TENANT ADMIN & MANAGER) ================= */
              <>
                {/* 1. Nhận Diện Thương Hiệu Doanh Nghiệp */}
                <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Building size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          1. Thông Tin Nhận Diện Thương Hiệu Khi Gửi Email
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Cấu hình tên người gửi và email tiếp nhận phản hồi từ cán bộ nhân viên công ty
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Thương Hiệu Doanh Nghiệp
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Doanh Nghiệp Hiển Thị (Sender Name) *
                      </label>
                      <input
                        type="text"
                        value={settings.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ Á CHÂU"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tên xuất hiện trong tiêu đề người gửi (From) của mọi email gửi đến nhân viên
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Phản Hồi Nội Bộ Của Doanh Nghiệp (Reply-To Công Ty) *
                      </label>
                      <input
                        type="email"
                        value={settings.company_email}
                        onChange={(e) => handleChange('company_email', e.target.value)}
                        placeholder="contact@tencongty.vn hoặc hr@tencongty.vn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-pastel-50/40"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Khi nhân sự bấm "Trả lời thư", phản hồi sẽ chuyển trực tiếp về email công ty của bạn
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. 5 Luồng Email Nghiệp Vụ Tự Động Của Doanh Nghiệp */}
                <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                        <Mail size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          2. Các Luồng Thông Báo Tự Động Nội Bộ Của Doanh Nghiệp
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Hệ thống tự động kích hoạt 5 kênh gửi thư phân theo từng nghiệp vụ quản trị
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                      Tự Động Kích Hoạt (DKIM 100%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Luồng 1: Chấm công */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Clock size={15} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Chấm Công &amp; Đi Trễ</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Kích hoạt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Thông báo vào ca, tan ca, nhắc nhở đi trễ, thiếu công và gửi phiếu công tháng.
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                        <div className="text-slate-400">Hòm thư hệ thống: <span className="font-medium text-slate-700">attendance@omniassets.ryug.id.vn</span></div>
                        <div className="text-slate-400">Tên hiển thị: <span className="font-semibold text-emerald-700">{settings.company_name || 'Doanh Nghiệp'} (Chấm Công)</span></div>
                      </div>
                    </div>

                    {/* Luồng 2: Công việc */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <CheckSquare size={15} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Giao Việc &amp; Tài Khoản</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Kích hoạt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Cấp tài khoản mới, giao việc, cập nhật tiến độ công việc và nhắc hạn hoàn thành.
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                        <div className="text-slate-400">Hòm thư hệ thống: <span className="font-medium text-slate-700">tasks@omniassets.ryug.id.vn</span></div>
                        <div className="text-slate-400">Tên hiển thị: <span className="font-semibold text-indigo-700">{settings.company_name || 'Doanh Nghiệp'} (Quản Lý Công Việc)</span></div>
                      </div>
                    </div>

                    {/* Luồng 3: Tài sản */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                            <ShieldAlert size={15} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Quản Lý Tài Sản</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Kích hoạt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Biên bản bàn giao, kê khai tài sản, thu hồi thiết bị và thông báo kỳ kiểm kê.
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                        <div className="text-slate-400">Hòm thư hệ thống: <span className="font-medium text-slate-700">assets@omniassets.ryug.id.vn</span></div>
                        <div className="text-slate-400">Tên hiển thị: <span className="font-semibold text-teal-700">{settings.company_name || 'Doanh Nghiệp'} (Quản Lý Tài Sản)</span></div>
                      </div>
                    </div>

                    {/* Luồng 4: Hợp đồng */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <FileText size={15} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Hợp Đồng &amp; Hồ Sơ</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Kích hoạt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Cảnh báo hợp đồng sắp hết hạn (30 ngày), thủ tục tái ký và thanh toán công nợ.
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                        <div className="text-slate-400">Hòm thư hệ thống: <span className="font-medium text-slate-700">contracts@omniassets.ryug.id.vn</span></div>
                        <div className="text-slate-400">Tên hiển thị: <span className="font-semibold text-blue-700">{settings.company_name || 'Doanh Nghiệp'} (Quản Lý Hợp Đồng)</span></div>
                      </div>
                    </div>

                    {/* Luồng 5: Bản tin 06:00 AM */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all space-y-2 md:col-span-2 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Bell size={15} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Bản Tin Tổng Hợp 06:00 AM Hàng Ngày</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          06:00 AM Sáng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tự động quét công việc quá hạn/đến hạn và hợp đồng sắp hết hạn để gửi bản tin tóm tắt cho Ban Giám Đốc và các Quản lý vào đầu mỗi buổi sáng.
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>Hòm thư: <span className="font-medium text-slate-700">reports@omniassets.ryug.id.vn</span></div>
                        <div>Tên hiển thị: <span className="font-semibold text-amber-700">{settings.company_name || 'Doanh Nghiệp'} (Báo Cáo Định Kỳ)</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2.2 Setup Danh Sách Email Nhận Báo Cáo & Nhắc Hạn Định Kỳ */}
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {userRole === 'SUPER_ADMIN' ? '3. Thiết Lập Danh Sách Email Nhận Báo Cáo & Nhắc Hạn' : '2. Thiết Lập Danh Sách Email Nhận Báo Cáo & Nhắc Hạn Định Kỳ'}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  06:00 AM Hàng Ngày
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống sẽ quét các <strong>công việc quá hạn / đến hạn hôm nay</strong> và <strong>hợp đồng sắp hết hạn (trong vòng 30 ngày)</strong> để tự động gửi bản tin tóm tắt lúc <strong>06:00 AM mỗi sáng</strong> đến tất cả các email trong danh sách này (Ban Giám Đốc, Kế Toán Trưởng, Quản Lý Vận Hành).
              </p>

              {/* Quick Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Đã cấu hình: <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">{currentRecipientsList.length}</span> email nhận thư
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectManagers}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all"
                  >
                    <UserCheck size={13} className="text-indigo-600" />
                    <span>+ Chọn Tất Cả Quản Lý (Admin &amp; Manager)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAllStaff}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all"
                  >
                    <Users size={13} className="text-emerald-600" />
                    <span>+ Chọn Toàn Bộ Nhân Sự ({staffUsers.filter(u => u.email && u.email.includes('@')).length})</span>
                  </button>

                  {currentRecipientsList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRecipients}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 active:scale-95 transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Xóa Hết</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách nhân sự với Checkbox & Tìm kiếm */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-600" />
                    <span>Chọn Nhân Sự Trong Công Ty (Bấm để tích / bỏ chọn):</span>
                  </label>

                  {/* Search box */}
                  <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Tìm theo tên, email, phòng ban..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Staff selection grid */}
                <div className="max-h-56 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {staffUsers
                    .filter((u) => {
                      if (!u.email || !u.email.includes('@')) return false;
                      if (!recipientSearch.trim()) return true;
                      const q = recipientSearch.toLowerCase();
                      return (
                        (u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.department || '').toLowerCase().includes(q) ||
                        (u.role || '').toLowerCase().includes(q)
                      );
                    })
                    .map((user) => {
                      const isSelected = currentRecipientsList.includes(user.email.toLowerCase().trim());
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleRecipient(user.email)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/50 shadow-2xs'
                              : 'bg-white border-slate-200/80 hover:bg-slate-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div onClick
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 cursor-pointer pointer-events-none"
                          />
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 border border-slate-200">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                user.role === 'MANAGER' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {user.role === 'ADMIN' ? 'Admin' : user.role === 'MANAGER' ? 'Quản lý' : 'Nhân sự'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
                          </div>
                        </div>
                      );
                    })}

                  {staffUsers.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400">
                      Chưa có dữ liệu nhân sự. Bạn có thể thêm email bên ngoài ở khung bên dưới.
                    </div>
                  )}
                </div>
              </div>

              {/* Thêm Email Ngoài (Đối Tác / Ban Giám Đốc / Gmail) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Hoặc Nhập Thêm Email Ngoài (Gmail, Đối Tác, Ban Giám Đốc...):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={customRecipientInput}
                      onChange={(e) => setCustomRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customRecipientInput.trim()) {
                            handleAddRecipient(customRecipientInput.trim());
                            setCustomRecipientInput('');
                          }
                        }
                      }}
                      placeholder="VD: giamdoc@gmail.com, ketoan@doitac.vn (Gõ rồi nhấn Enter hoặc bấm Thêm)..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customRecipientInput.trim()) {
                        handleAddRecipient(customRecipientInput.trim());
                        setCustomRecipientInput('');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shrink-0"
                  >
                    <Plus size={14} />
                    <span>+ Thêm Email Này</span>
                  </button>
                </div>
              </div>

              {/* Tag Chips Danh Sách Đang Nhận Báo Cáo */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Danh Sách Đang Tiếp Nhận Báo Cáo 06:00 AM:</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                      {currentRecipientsList.length} email
                    </span>
                  </span>
                  {currentRecipientsList.length > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Bấm vào biểu tượng ✕ trên thẻ để hủy nhận
                    </span>
                  )}
                </div>

                {currentRecipientsList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-pastel-50/50 border border-pastel-200/70 min-h-12">
                    {currentRecipientsList.map((mail) => {
                      const matchedUser = staffUsers.find((u) => (u.email || '').toLowerCase() === mail);
                      return (
                        <span
                          key={mail}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-medium border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {matchedUser ? matchedUser.name.charAt(0).toUpperCase() : '@'}
                          </div>
                          <div className="flex items-center gap-1">
                            {matchedUser && (
                              <span className="font-bold text-slate-800">{matchedUser.name} &bull;</span>
                            )}
                            <span className="text-slate-600 text-[11px] font-medium">{mail}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(mail)}
                            className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa email này khỏi danh sách"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-800 flex items-center gap-2">
                    <Info size={16} className="text-amber-600 shrink-0" />
                    <span>
                      Chưa chọn email riêng. Hệ thống sẽ tự động gửi bản tin 06:00 AM về email chính của doanh nghiệp: <strong className="font-bold text-amber-900">{settings.company_email || 'Email Doanh Nghiệp'}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Instant Test Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400">
                  Hệ thống sử dụng hòm thư <code>reports@omniassets.ryug.id.vn</code>. Phản hồi sẽ chuyển về email công ty.
                </p>

                <button
                  type="button"
                  onClick={handleSendDailyRemindersNow}
                  disabled={sendingRemindersNow || testingMail}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold shadow-soft transition-all disabled:opacity-50"
                >
                  {sendingRemindersNow ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Đang gửi báo cáo đến danh sách...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Kích Hoạt Gửi Ngay Báo Cáo Đến {currentRecipientsList.length > 0 ? `${currentRecipientsList.length} Email Đã Chọn` : 'Email Công Ty'}</span>
                    </>
                  )}
                </button>
              </div>

                {testMailResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-scale-in ${
                      testMailResult.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testMailResult.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{testMailResult.type === 'success' ? 'Gửi thành công!' : 'Có lỗi khi gửi mail'}</p>
                      <p className="font-normal text-[11px] mt-0.5 opacity-90">{testMailResult.text}</p>
                    </div>
                  </div>
                )}
            </div>

            {/* 2.3 Automations Toggles */}
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Zap size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  {userRole === 'SUPER_ADMIN' ? '4. Các Loại Email Tự Động Hóa (Automations)' : '3. Bật / Tắt Các Loại Email Tự Động Định Kỳ'}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Automation 1: 6 AM Daily Reminders */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pastel-50/50 border border-pastel-200/80">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Bản tin tổng hợp nhắc hạn vận hành lúc 06:00 AM hàng ngày</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full font-bold">Cron 06:00 AM</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tự động quét công việc quá hạn/đến hạn và hợp đồng sắp hết hạn (30 ngày) để gửi email tóm tắt đến Danh Sách Email ở trên vào đầu mỗi buổi sáng.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.mail_notify_reminders === 'true'}
                      onChange={(e) => handleChange('mail_notify_reminders', e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Automation 2: New User Welcome */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pastel-50/50 border border-pastel-200/80">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Gửi email cấp tài khoản &amp; mật khẩu khi tạo nhân sự mới</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">Khuyên Dùng</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tự động gửi thông tin tài khoản, mật khẩu khởi tạo và đường link đăng nhập hệ thống đến email của nhân sự ngay khi Admin bấm Thêm Nhân Sự.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.mail_notify_new_user === 'true'}
                      onChange={(e) => handleChange('mail_notify_new_user', e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Automation 3: Monthly Timesheet */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pastel-50/50 border border-pastel-200/80">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Kích hoạt tính năng gửi phiếu chấm công qua email nhân viên</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full font-bold">Kế Toán / HR</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Cho phép Phòng Kế toán / Nhân sự gửi email phiếu báo cáo số ngày công chuẩn, giờ làm, số lần đi muộn tới từng nhân viên tại trang Chấm Công.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.mail_notify_timesheet === 'true'}
                      onChange={(e) => handleChange('mail_notify_timesheet', e.target.checked ? 'true' : 'false')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* 2.4 Trung Tâm Soạn & Phát Thư Doanh Nghiệp (Broadcast & Direct Dispatch) */}
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {userRole === 'SUPER_ADMIN' ? '5. Trung Tâm Soạn & Phát Thư Nội Bộ' : '4. Trung Tâm Soạn & Phát Thư Nội Bộ (Email Broadcast)'}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  HTML Template Đẳng Cấp
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Soạn và phát thông báo quan trọng đến hộp thư của <strong>1 cá nhân cụ thể</strong>, <strong>Toàn bộ nhân sự công ty</strong> hoặc <strong>Nhân sự thuộc phòng ban riêng biệt</strong>. Email được tự động đóng gói trong khung nhận diện thương hiệu chuyên nghiệp.
              </p>

              {/* Recipient Target Selector: 3 options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chọn Đối Tượng Người Nhận Thư *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBroadcastRecipientType('ALL')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      broadcastRecipientType === 'ALL'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className={broadcastRecipientType === 'ALL' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold text-slate-800">Toàn Bộ Nhân Sự</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Gửi đồng loạt đến tất cả nhân viên trong công ty</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastRecipientType('SINGLE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      broadcastRecipientType === 'SINGLE'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail size={16} className={broadcastRecipientType === 'SINGLE' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold text-slate-800">Gửi Cho 1 Người Cụ Thể</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Gửi riêng cho 1 nhân viên hoặc email đối tác bên ngoài</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastRecipientType('DEPARTMENT')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      broadcastRecipientType === 'DEPARTMENT'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building size={16} className={broadcastRecipientType === 'DEPARTMENT' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="text-xs font-bold text-slate-800">Gửi Theo Phòng Ban</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Gửi tới tất cả nhân sự thuộc phòng ban được chỉ định</p>
                  </button>
                </div>
              </div>

              {/* If SINGLE: show input / picker */}
              {broadcastRecipientType === 'SINGLE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-pastel-50/40 border border-pastel-200/70 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn Nhanh Nhân Viên Trong Công Ty
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) setBroadcastTargetEmail(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium"
                    >
                      <option value="">-- Chọn nhân viên để điền nhanh email --</option>
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.email}>
                          {u.name} ({u.email}) - {u.department || 'Nhân sự'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hoặc Nhập Địa Chỉ Email Người Nhận *
                    </label>
                    <input
                      type="email"
                      value={broadcastTargetEmail}
                      onChange={(e) => setBroadcastTargetEmail(e.target.value)}
                      placeholder="nhanvien@congty.vn hoặc doitao@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* If DEPARTMENT: show dept picker dynamically from API */}
              {broadcastRecipientType === 'DEPARTMENT' && (
                <div className="p-3.5 rounded-2xl bg-pastel-50/40 border border-pastel-200/70 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Phòng Ban Cần Phát Thư *
                  </label>
                  <select
                    value={broadcastTargetDept}
                    onChange={(e) => setBroadcastTargetDept(e.target.value)}
                    className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium"
                  >
                    {availableDepartments.length === 0 ? (
                      <option value="">Chưa có dữ liệu phòng ban nào</option>
                    ) : (
                      availableDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Sender Mailbox, Subject & Urgency Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hộp Thư Gửi Đi (Sender Mailbox) *
                  </label>
                  <select
                    value={broadcastSenderType}
                    onChange={(e) => setBroadcastSenderType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    <option value="tasks">tasks@ (Quản Lý Công Việc &amp; Nội Bộ)</option>
                    <option value="attendance">attendance@ (Chấm Công &amp; Nhân Sự)</option>
                    <option value="assets">assets@ (Quản Lý Tài Sản &amp; Thiết Bị)</option>
                    <option value="contracts">contracts@ (Quản Lý Hợp Đồng)</option>
                    <option value="reports">reports@ (Báo Cáo &amp; Định Kỳ)</option>
                    {userRole === 'SUPER_ADMIN' && (
                      <>
                        <option value="notifications">notifications@ (Thông Báo Toàn Hệ Thống)</option>
                        <option value="support">support@ (Hỗ Trợ Khách Hàng)</option>
                      </>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {broadcastSenderType === 'notifications' || broadcastSenderType === 'support'
                      ? 'Reply-To: hieupham101097@gmail.com'
                      : `Reply-To: ${settings.company_email || 'Email Công Ty'}`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu Đề Email Thông Báo *
                  </label>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="VD: [Thông Báo] Lịch họp toàn công ty &amp; Kế hoạch..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mức Độ / Thể Loại Thư
                  </label>
                  <select
                    value={broadcastUrgency}
                    onChange={(e) => setBroadcastUrgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    <option value="NORMAL">✉️ Thông báo nội bộ bình thường</option>
                    <option value="URGENT">🚨 Khẩn cấp / Quan trọng</option>
                    <option value="ANNOUNCEMENT">📢 Công văn / Quyết định chính thức</option>
                  </select>
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội Dung Thư *
                </label>
                <textarea
                  rows={5}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Nhập nội dung thông điệp gửi tới nhân sự (Hỗ trợ xuống dòng phân đoạn rõ ràng)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nội dung sẽ được tự động đóng gói trong khung thiết kế thương hiệu của <strong>{settings.company_name || 'Doanh Nghiệp'}</strong>, hiển thị tối ưu trên cả Gmail Mobile &amp; Desktop.
                </p>
              </div>

              {/* Action Button & Sender Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-500">
                  Gửi từ: <strong className="text-slate-800">{settings.company_name}</strong> &lt;support@omniassets.ryug.id.vn&gt;
                </div>

                <button
                  type="button"
                  onClick={handleBroadcastEmail}
                  disabled={broadcasting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
                >
                  {broadcasting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Đang phát email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>
                        {broadcastRecipientType === 'ALL'
                          ? 'Phát Thư Cho Toàn Bộ Nhân Sự'
                          : broadcastRecipientType === 'DEPARTMENT'
                          ? `Phát Thư Cho Phòng ${broadcastTargetDept}`
                          : 'Gửi Thư Đến Người Nhận Này'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Banner */}
              {broadcastResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 animate-scale-in ${
                    broadcastResult.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {broadcastResult.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">{broadcastResult.text}</p>
                    {broadcastResult.details && (
                      <p className="text-[11px] font-normal opacity-90">
                        Tổng cộng: {broadcastResult.details.sentCount}/{broadcastResult.details.total} thư đã được gửi thành công.
                        {broadcastResult.details.failedCount > 0 && ` (${broadcastResult.details.failedCount} thư lỗi)`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2.5 Hộp Thư Gửi Hỗ Trợ Kỹ Thuật & Yêu Cầu Tính Năng (Direct Support Desk) */}
            <div className="bg-gradient-to-br from-white to-pastel-50/50 p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-pastel-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {userRole === 'SUPER_ADMIN' ? '6. Hộp Thư Hỗ Trợ Khách Hàng (Support Desk)' : '5. Gửi Yêu Cầu Hỗ Trợ Trực Tiếp Đến Ban Quản Trị OMNIASSETS'}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-pastel-700 bg-pastel-100 px-2.5 py-0.5 rounded-full font-mono">
                  support@omniassets.ryug.id.vn
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Khi gặp sự cố kỹ thuật, cần mở rộng tính năng hoặc tư vấn nâng cấp gói cước doanh nghiệp, bạn có thể gửi yêu cầu trực tiếp tại đây. Ban Quản Trị OMNIASSETS sẽ tiếp nhận và phản hồi nhanh chóng qua email của bạn.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu Đề Yêu Cầu Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="VD: Cần hỗ trợ xuất báo cáo Excel nâng cao / Hướng dẫn phân quyền..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội Dung Cần Hỗ Trợ *
                  </label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Mô tả chi tiết câu hỏi hoặc khó khăn bạn đang gặp phải trên hệ thống..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-white leading-relaxed"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-400">
                    Phản hồi sẽ được gửi về: <strong className="text-slate-700 font-mono">{settings.company_email}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendSupport}
                    disabled={sendingSupport}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-pastel-600 hover:bg-pastel-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-soft transition-all disabled:opacity-50"
                  >
                    {sendingSupport ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Đang chuyển yêu cầu đến Ban Quản Trị...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Gửi Yêu Cầu Hỗ Trợ Ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {supportResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-scale-in ${
                      supportResult.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {supportResult.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="flex-1">{supportResult.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: PHÂN QUYỀN & CẤP QUYỀN (ENTERPRISE PERMISSIONS MATRIX) ================= */}
        {activeSubTab === 'permissions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Hero Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 border border-indigo-200/80 shadow-soft">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Phân Quyền Doanh Nghiệp
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Cấu hình ma trận phân quyền chức năng
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mt-1">
                      Phân Quyền Thao Tác Nội Bộ (Theo Phòng Ban &amp; Nhân Viên)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ban Quản Lý doanh nghiệp có thể tinh chỉnh các quyền thao tác cho từng Phòng Ban hoặc đặc cách cấp thêm quyền riêng cho từng nhân viên trong công ty mình.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setPermMode('DEPARTMENT')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        permMode === 'DEPARTMENT'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building size={14} className={permMode === 'DEPARTMENT' ? 'text-indigo-600' : 'text-slate-400'} />
                      <span>Theo Bộ Phận ({availableDepartments.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPermMode('USER')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        permMode === 'USER'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users size={14} className={permMode === 'USER' ? 'text-indigo-600' : 'text-slate-400'} />
                      <span>Cấp Riêng Nhân Viên ({staffUsers.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= MODE 1: DEPARTMENT PERMISSIONS ================= */}
            {permMode === 'DEPARTMENT' && (
              <div className="space-y-5">
                {/* Department Selection Bar */}
                <div className="bg-white p-4 rounded-3xl border border-pastel-200/90 shadow-soft">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Building size={14} className="text-indigo-600" />
                      <span>Chọn Phòng Ban / Bộ Phận Cần Thiết Lập Quyền</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tất cả nhân sự thuộc bộ phận sẽ tự động thừa hưởng các quyền này
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {availableDepartments.length === 0 ? (
                      <div className="w-full p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                        <Building size={28} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Chưa Có Danh Mục Phòng Ban</p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Hệ thống hiện không áp đặt cấu trúc cứng. Vui lòng thiết lập cơ cấu tổ chức phòng ban trong Danh Mục hoặc thêm nhân viên mới.
                        </p>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('categories')}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <span>Đi Đến Quản Lý Danh Mục</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      availableDepartments.map((deptName) => {
                        const isSelected = selectedDept === deptName;
                        const deptMembersCount = staffUsers.filter(u => (u.department || '').trim().toLowerCase() === deptName.trim().toLowerCase()).length;
                        const deptPerms = deptPermissionsMap[deptName] || getDefaultPermissionsForDepartment(deptName);
                        
                        return (
                          <button
                            key={deptName}
                            type="button"
                            onClick={() => setSelectedDept(deptName)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-200'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <Building size={14} className={isSelected ? 'text-indigo-200' : 'text-slate-400'} />
                            <span>{deptName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-indigo-500/80 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                            }`}>
                              {deptMembersCount} nhân sự • {deptPerms.length} quyền
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Department Overview & Quick Actions */}
                {selectedDept ? (
                  <>
                    <div className="bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                          {selectedDept.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-800">{selectedDept}</h4>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {(deptPermissionsMap[selectedDept] || getDefaultPermissionsForDepartment(selectedDept)).length} / {PERMISSION_MODULES.reduce((acc, m) => acc + m.permissions.length, 0)} quyền kích hoạt
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Áp dụng mặc định cho {staffUsers.filter(u => (u.department || '').trim().toLowerCase() === selectedDept.trim().toLowerCase()).length} thành viên trong phòng ban này.
                          </p>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAllDeptPerms(selectedDept)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/80 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Chọn Tất Cả Quyền</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetReadOnlyDeptPerms(selectedDept)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5"
                        >
                          <Eye size={13} />
                          <span>Chế Độ Chỉ Xem</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetDeptToDefault(selectedDept)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} />
                          <span>Khôi Phục Chuẩn Mặc Định</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleClearDeptPerms(selectedDept)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>Xóa Hết</span>
                        </button>
                      </div>
                    </div>

                    {/* 6 Permission Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PERMISSION_MODULES.map((module) => {
                        const ModuleIcon = module.icon;
                        const currentDeptPerms = deptPermissionsMap[selectedDept] || getDefaultPermissionsForDepartment(selectedDept);
                        const activeCount = module.permissions.filter(p => currentDeptPerms.includes(p.id)).length;
                        const allActive = activeCount === module.permissions.length;

                    return (
                      <div
                        key={module.id}
                        className="bg-white rounded-3xl border border-pastel-200/90 shadow-soft overflow-hidden flex flex-col justify-between"
                      >
                        {/* Module Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                              <ModuleIcon size={16} />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">{module.name}</h5>
                              <span className="text-[10px] text-slate-400">
                                {activeCount} / {module.permissions.length} quyền
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            allActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : activeCount > 0
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {allActive ? 'Toàn quyền' : activeCount > 0 ? 'Phần quyền' : 'Khóa'}
                          </span>
                        </div>

                        {/* Permissions List */}
                        <div className="p-4 space-y-2.5 flex-1">
                          {module.permissions.map((perm) => {
                            const isChecked = currentDeptPerms.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-indigo-50/60 border-indigo-200/80 text-indigo-900 shadow-2xs'
                                    : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleDeptPermission(selectedDept, perm.id)}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                                />
                                <div className="flex-1 text-xs">
                                  <span className={`font-semibold block ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                                    {perm.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {perm.id}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Vui lòng chọn hoặc thêm phòng ban để tiến hành phân quyền.
              </div>
            )}
          </div>
        )}

            {/* ================= MODE 2: INDIVIDUAL EMPLOYEE OVERRIDES ================= */}
            {permMode === 'USER' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Staff Member List & Selector (4 cols) */}
                  <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-pastel-200/90 shadow-soft space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" />
                        <span>Danh Sách Nhân Sự ({staffUsers.length})</span>
                      </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Tìm theo tên, email, phòng..."
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {/* Staff List */}
                    <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {staffUsers
                        .filter(u => {
                          const q = recipientSearch.toLowerCase();
                          return !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q);
                        })
                        .map(u => {
                          const isSelected = selectedUser && String(selectedUser.id) === String(u.id);
                          const userCustomPerms = userPermissionsMap[u.id] || [];

                          return (
                            <div
                              key={u.id}
                              onClick={() => setSelectedUserId(u.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-indigo-50/90 border-indigo-400 shadow-soft ring-2 ring-indigo-500/20'
                                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {(u.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{u.department || 'Chưa xếp phòng'}</div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                                    ? 'bg-rose-100 text-rose-700'
                                    : u.role === 'MANAGER'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {u.role || 'STAFF'}
                                </span>
                                {userCustomPerms.length > 0 && (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-full">
                                    +{userCustomPerms.length} quyền riêng
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Column: Selected Employee Settings & Overrides (8 cols) */}
                  <div className="lg:col-span-8 space-y-4">
                    {selectedUser ? (
                      <>
                        {/* Employee Profile Header & Role Switcher */}
                        <div className="bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-soft">
                                {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-slate-800">{selectedUser.name}</h4>
                                  <span className="text-xs font-mono text-slate-400">({selectedUser.email})</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Phòng ban: <strong className="text-indigo-700">{selectedUser.department || 'Chưa có bộ phận'}</strong> • ID: <span className="font-mono">{selectedUser.id}</span>
                                </p>
                              </div>
                            </div>

                            {/* Reset custom override button */}
                            {(userPermissionsMap[selectedUser.id] || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleResetUserOverrides(selectedUser.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                              >
                                <RefreshCw size={13} />
                                <span>Gỡ Quyền Cấp Riêng</span>
                              </button>
                            )}
                          </div>

                          {/* Quick Role Elevation */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block">Vai Trò Hệ Thống (System Role):</span>
                              <span className="text-[11px] text-slate-400">
                                Cấp bậc tài khoản quyết định quyền hạn quản lý các chức năng.
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {['STAFF', 'MANAGER', 'ADMIN'].map((roleKey) => {
                                const isCurrent = selectedUser.role === roleKey;
                                return (
                                  <button
                                    key={roleKey}
                                    type="button"
                                    disabled={updatingUserRole}
                                    onClick={() => handleQuickChangeUserRole(selectedUser.id, roleKey)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                      isCurrent
                                        ? roleKey === 'ADMIN'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : roleKey === 'MANAGER'
                                          ? 'bg-amber-600 text-white shadow-sm'
                                          : 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                  >
                                    {roleKey === 'ADMIN' ? '👑 Quản Trị (ADMIN)' : roleKey === 'MANAGER' ? '⭐ Quản Lý (MANAGER)' : '👤 Nhân Viên (STAFF)'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Custom Permission Overrides Grid */}
                        <div className="bg-white p-5 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-600" />
                                <span>Cấp Quyền Bổ Sung Riêng Biệt Cho {selectedUser.name}</span>
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Các quyền có nhãn <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Bộ phận</span> đã tự động có hiệu lực. Tích chọn thêm quyền bên dưới để cấp riêng cho nhân sự này.
                              </p>
                            </div>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                              {(userPermissionsMap[selectedUser.id] || []).length} quyền cấp thêm
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PERMISSION_MODULES.map((module) => {
                              const userDept = selectedUser.department || '';
                              const inheritedFromDept = deptPermissionsMap[userDept] || getDefaultPermissionsForDepartment(userDept);
                              const userOverrides = userPermissionsMap[selectedUser.id] || [];
                              const ModuleIcon = module.icon;

                              return (
                                <div
                                  key={module.id}
                                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3"
                                >
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <ModuleIcon size={15} className="text-indigo-600" />
                                    <span>{module.name}</span>
                                  </div>

                                  <div className="space-y-2">
                                    {module.permissions.map((perm) => {
                                      const isInherited = inheritedFromDept.includes(perm.id);
                                      const isCustomGranted = userOverrides.includes(perm.id);
                                      const isActive = isInherited || isCustomGranted;

                                      return (
                                        <label
                                          key={perm.id}
                                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                                            isCustomGranted
                                              ? 'bg-purple-50/90 border-purple-300 text-purple-900 font-semibold'
                                              : isInherited
                                              ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-medium'
                                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isActive}
                                            disabled={isInherited}
                                            onChange={() => handleToggleUserOverride(selectedUser.id, perm.id)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer disabled:opacity-70"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="truncate">{perm.label}</span>
                                              {isInherited ? (
                                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded shrink-0">
                                                  Bộ phận
                                                </span>
                                              ) : isCustomGranted ? (
                                                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded shrink-0">
                                                  Cấp riêng
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white p-12 rounded-3xl border border-pastel-200/90 shadow-soft text-center text-slate-400 space-y-2">
                        <Users size={32} className="mx-auto text-slate-300" />
                        <p className="text-sm font-bold text-slate-600">Vui lòng chọn một nhân viên từ danh sách bên trái</p>
                        <p className="text-xs">Để xem và cấu hình quyền thao tác riêng cho nhân sự đó.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: OPERATION & DATABASE SECURITY RULES (SUPER ADMIN ONLY) ================= */}
        {activeSubTab === 'rules' && userRole === 'SUPER_ADMIN' && (
          <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Thông Số Hạ Tầng Cơ Sở Dữ Liệu &amp; Bảo Mật Toàn Nền Tảng</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <p className="text-[11px] font-bold text-indigo-700 uppercase">Múi Giờ Hệ Thống</p>
                <h4 className="text-base font-bold text-slate-800 mt-1">Asia/Ho_Chi_Minh</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Múi giờ chuẩn Việt Nam (UTC+7)</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <p className="text-[11px] font-bold text-indigo-700 uppercase">Cơ Chế Lưu Trữ Đám Mây</p>
                <h4 className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloudflare D1 Multi-region</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Tự động sao lưu và đồng bộ thời gian thực</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <p className="text-[11px] font-bold text-indigo-700 uppercase">Phiên Bản Nền Tảng</p>
                <h4 className="text-base font-bold text-slate-800 mt-1">OMNIASSETS Enterprise v2.5</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Kiến trúc đa doanh nghiệp (Multi-tenant)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Chính sách phân quyền &amp; Kiểm soát kỹ thuật cốt lõi:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                <li><strong>Quản Trị Tối Cao (SUPER_ADMIN):</strong> Toàn quyền kiểm soát Cổng Email Master, Tạo key bản quyền, Duyệt doanh nghiệp, Cấu hình hạ tầng Cloudflare D1.</li>
                <li><strong>Quản Trị Doanh Nghiệp (ADMIN):</strong> Quản lý danh sách nhân sự, phân bổ tài sản, hợp đồng, chi phí và nhận thông báo nội bộ của doanh nghiệp.</li>
                <li><strong>Quản Lý Bộ Phận (MANAGER):</strong> Quản lý công việc và duyệt chấm công phòng ban.</li>
                <li><strong>Nhân Viên (STAFF):</strong> Điểm danh ca làm việc và theo dõi tài sản, nhiệm vụ được giao.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PLATFORM LICENSE (SUPER ADMIN ONLY) ================= */}
        {activeSubTab === 'license' && userRole === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            {/* Status Hero Card Transparent */}
            {(() => {
              const isFreeTrial = (licenseInfo?.isTrial || licenseInfo?.plan_code === 'TRIAL_2M') && !licenseInfo?.isExpired;
              const isPaidPlan = !licenseInfo?.isTrial && !licenseInfo?.isDemo && licenseInfo?.plan_code !== 'TRIAL_2M' && licenseInfo?.plan_code !== 'DEMO' && !licenseInfo?.isExpired;
              const isLifetime = licenseInfo?.plan_code === 'LIFETIME';

              return (
                <div className={`p-6 rounded-3xl border-2 shadow-soft space-y-4 ${
                  isPaidPlan
                    ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-300'
                    : isFreeTrial
                    ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white border-amber-300'
                    : 'bg-gradient-to-br from-rose-50/90 via-red-50/50 to-white border-rose-300'
                }`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md text-white shrink-0 ${
                        isPaidPlan
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : isFreeTrial
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                          : 'bg-rose-500'
                      }`}>
                        {isPaidPlan ? <Crown size={28} /> : isFreeTrial ? <Zap size={28} className="fill-white" /> : <AlertCircle size={28} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full border shadow-2xs ${
                            isPaidPlan
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isFreeTrial
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            {isPaidPlan
                              ? '✅ ĐÃ MUA & KÍCH HOẠT BẢN QUYỀN'
                              : isFreeTrial
                              ? '🎁 ĐANG DÙNG THỬ 0Đ (CHƯA MUA GÓI TRẢ PHÍ)'
                              : '⚠️ BẢN DÙNG THỬ ĐÃ HẾT HẠN'}
                          </span>

                          <span className="text-xs font-bold text-slate-700">
                            {licenseInfo?.plan_name || (isFreeTrial ? 'Gói Dùng Thử 2 Tháng (Trial 60 Ngày)' : 'Bản Demo Giới Hạn')}
                          </span>

                          {isLifetime ? (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <ShieldCheck size={14} /> Vĩnh viễn (∞)
                            </span>
                          ) : licenseInfo?.days_remaining !== undefined && licenseInfo?.days_remaining !== null ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              (licenseInfo.days_remaining ?? 0) > 10 ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              Còn {licenseInfo.days_remaining} ngày
                            </span>
                          ) : null}
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mt-1">
                          {isPaidPlan
                            ? `Bản Quyền Doanh Nghiệp • ${licenseInfo?.plan_name}`
                            : isFreeTrial
                            ? 'Bạn Đang Dùng Gói Trải Nghiệm Miễn Phí (Trial 60 Ngày)'
                            : 'Hệ Thống Đang Bị Giới Hạn (Cần Nâng Cấp Bản Quyền)'}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {isPaidPlan
                            ? `Mã bản quyền: ${licenseInfo?.key || 'OMNI-ENTERPRISE-VERIFIED'}`
                            : isFreeTrial
                            ? `Tài khoản được tặng 60 ngày dùng thử miễn phí đến ${licenseInfo?.expire_date || 'hết hạn'}. Bạn chưa bị trừ bất kỳ khoản tiền nào.`
                            : 'Nâng cấp bản quyền để gỡ bỏ giới hạn 5 tài sản, 4 nhân viên và xuất biên bản A4 sạch đẹp.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenUpgrade && onOpenUpgrade()}
                      className={`px-5 py-3 rounded-2xl font-bold text-xs shadow-soft flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer ${
                        isPaidPlan
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                          : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-amber-500/20'
                      }`}
                    >
                      <Key size={16} className={isPaidPlan ? 'text-indigo-600' : 'text-amber-200'} />
                      <span>{isPaidPlan ? 'Xem Gói / Gia Hạn Bản Quyền' : 'Bảng Giá & Chọn Mua Gói Trả Phí'}</span>
                    </button>
                  </div>

                  {/* 4 Thước Đo Tường Minh */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Chi Phí Đã Trả</span>
                      <p className={`text-sm font-black mt-1 ${isPaidPlan ? 'text-emerald-700' : isFreeTrial ? 'text-amber-700' : 'text-slate-600'}`}>
                        {isPaidPlan ? 'Đã Thanh Toán' : isFreeTrial ? '0 VNĐ (Miễn Phí)' : 'Chưa Mua Gói'}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{isPaidPlan ? 'Bản quyền hợp lệ' : isFreeTrial ? 'Tặng 60 ngày trải nghiệm' : 'Đã hết hạn dùng thử'}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Hạn Dùng Đến Ngày</span>
                      <p className="text-sm font-black text-slate-800 mt-1">
                        {isLifetime ? 'Vĩnh Viễn (∞)' : licenseInfo?.expire_date || 'Chưa xác định'}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{isLifetime ? 'Trọn đời không gia hạn' : licenseInfo?.start_date ? `Bắt đầu: ${licenseInfo.start_date}` : 'Theo chu kỳ gói'}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Thời Gian Còn Lại</span>
                      <p className={`text-sm font-black mt-1 ${
                        isLifetime ? 'text-emerald-700' : (licenseInfo?.days_remaining ?? 0) > 10 ? 'text-indigo-700' : 'text-rose-600'
                      }`}>
                        {isLifetime ? 'Vĩnh Viễn (∞)' : licenseInfo?.days_remaining !== undefined && licenseInfo?.days_remaining !== null ? `Còn ${licenseInfo.days_remaining} ngày` : 'N/A'}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{isLifetime ? 'Sở hữu trọn đời' : (licenseInfo?.days_remaining ?? 0) <= 0 ? 'Đã hết hạn sử dụng' : 'Tính từ hôm nay'}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Quyền Quản Trị</span>
                      <p className={`text-sm font-black mt-1 ${isPaidPlan ? 'text-emerald-700' : isFreeTrial ? 'text-amber-700' : 'text-rose-600'}`}>
                        {isPaidPlan ? 'Mở Khóa Toàn Bộ (Full)' : isFreeTrial ? 'Dùng Thử Có Hạn Chế' : 'Bị Khóa (Hết Hạn)'}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{isPaidPlan ? 'Toàn quyền không giới hạn' : isFreeTrial ? 'Giới hạn 20 tài sản, 3 nhân sự' : 'Tối đa 5 tài sản (Demo)'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quota Limits Cards */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="text-sm font-bold text-slate-800">Hạn Mức &amp; Định Lượng Tài Nguyên Hệ Thống</h4>
                <span className="text-xs text-slate-500">
                  {licenseInfo?.plan_code === 'TRIAL_2M' || licenseInfo?.isTrial 
                    ? '⚠️ Bản Dùng Thử 2 Tháng (0đ): Hạn chế theo hạn ngạch trải nghiệm' 
                    : !licenseInfo?.isDemo && !licenseInfo?.isExpired
                    ? '✅ Bản Quyền Chính Thức: Mở khóa toàn diện không giới hạn'
                    : '⚠️ Bản dùng thử đã hết hạn: Đang ở chế độ giới hạn nghiêm ngặt'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Tài sản & Thiết bị',
                    current: licenseInfo?.limits?.assets?.current ?? 0,
                    max: (!licenseInfo?.isTrial && !licenseInfo?.isDemo && !licenseInfo?.isExpired && licenseInfo?.plan_code !== 'TRIAL_2M')
                      ? '∞' 
                      : (licenseInfo?.limits?.assets?.max ?? (licenseInfo?.isTrial ? 20 : 5)),
                    trialMax: 20,
                    desc: 'Máy tính, laptop, màn hình...'
                  },
                  {
                    label: 'Nhân sự & Người dùng',
                    current: licenseInfo?.limits?.users?.current ?? 0,
                    max: (!licenseInfo?.isTrial && !licenseInfo?.isDemo && !licenseInfo?.isExpired && licenseInfo?.plan_code !== 'TRIAL_2M')
                      ? '∞' 
                      : (licenseInfo?.limits?.users?.max ?? (licenseInfo?.isTrial ? 3 : 2)),
                    trialMax: 3,
                    desc: 'Tài khoản nhân viên công ty'
                  },
                  {
                    label: 'Hợp đồng & Biên bản',
                    current: licenseInfo?.limits?.contracts?.current ?? 0,
                    max: (!licenseInfo?.isTrial && !licenseInfo?.isDemo && !licenseInfo?.isExpired && licenseInfo?.plan_code !== 'TRIAL_2M')
                      ? '∞' 
                      : (licenseInfo?.limits?.contracts?.max ?? (licenseInfo?.isTrial ? 5 : 2)),
                    trialMax: 5,
                    desc: 'Hợp đồng & biên bản giao nhận'
                  },
                  {
                    label: 'Giao dịch Thu / Chi',
                    current: licenseInfo?.limits?.finance?.current ?? 0,
                    max: (!licenseInfo?.isTrial && !licenseInfo?.isDemo && !licenseInfo?.isExpired && licenseInfo?.plan_code !== 'TRIAL_2M')
                      ? '∞' 
                      : (licenseInfo?.limits?.finance?.max ?? (licenseInfo?.isTrial ? 10 : 5)),
                    trialMax: 10,
                    desc: 'Phiếu thu, chi và hóa đơn'
                  }
                ].map((item, idx) => {
                  const isPaid = !licenseInfo?.isTrial && !licenseInfo?.isDemo && !licenseInfo?.isExpired && licenseInfo?.plan_code !== 'TRIAL_2M';
                  const isMax = !isPaid && item.max !== '∞' && Number(item.current) >= Number(item.max);
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl bg-white border shadow-soft transition-all ${
                        isMax ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                        {isPaid ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Vô hạn (∞)
                          </span>
                        ) : licenseInfo?.isTrial || licenseInfo?.plan_code === 'TRIAL_2M' ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isMax ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isMax ? 'Đã chạm trần' : 'Dùng thử'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Hết hạn
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800">{item.current}</span>
                        <span className="text-xs text-slate-400 font-semibold">/ {item.max}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rights Breakdown List */}
            <div className="bg-white p-6 rounded-3xl border border-pastel-200/90 shadow-soft space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Quyền Lợi Giữa 2 Gói</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Lock size={15} />
                    <span>Giới hạn trên Bản Dùng Thử (Demo):</span>
                  </div>
                  <ul className="space-y-1.5 text-amber-900/80 pl-5 list-disc text-[11px]">
                    <li>Khóa sau khi đạt tối đa 5 tài sản công ty.</li>
                    <li>Giới hạn 4 nhân sự trong danh sách nhân viên.</li>
                    <li>Tối đa 3 hợp đồng thỏa thuận và biên bản bàn giao.</li>
                    <li>Biên bản in khổ A4 có đóng dấu mờ (Watermark) bản quyền.</li>
                    <li>Khóa tính năng xuất báo cáo ra file Excel.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Unlock size={15} />
                    <span>Quyền lợi Bản Quyền Doanh Nghiệp (Enterprise):</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-900/80 pl-5 list-disc text-[11px]">
                    <li>Mở khóa 100% tài sản không giới hạn số lượng.</li>
                    <li>Toàn bộ nhân sự, phòng ban và phân quyền đầy đủ.</li>
                    <li>Xuất biên bản A4 in ấn chuẩn văn bản nhà nước sạch sẽ.</li>
                    <li>Xuất dữ liệu Excel / CSV toàn bộ hệ thống.</li>
                    <li>Bảo hành và cập nhật phiên bản mới nhất vĩnh viễn.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') && (
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pastel-200/80 shadow-soft">
            <span className="text-xs text-slate-500">
              Nhấn <strong>Lưu Thay Đổi</strong> để áp dụng các giá trị cài đặt mới vào hệ thống dữ liệu.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-pastel-500 hover:bg-pastel-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi Cài Đặt'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
