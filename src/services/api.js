const API_BASE = '/api';

async function request(endpoint, options = {}) {
  let userRole = 'STAFF';
  let userId = '';
  let companyId = '';
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const u = JSON.parse(userStr);
      userRole = u.role || 'STAFF';
      userId = u.id || '';
      companyId = u.company_id || '';
    }
  } catch {}

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
      'x-user-id': userId,
      'x-company-id': companyId,
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Lỗi kết nối máy chủ');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Bản Quyền & Giấy Phép (License & Paywall)
  getLicenseStatus: () => request('/license/status'),
  activateLicense: (data) => request('/license/activate', { method: 'POST', body: JSON.stringify(data) }),
  resetDemoLicense: () => request('/license/reset-demo', { method: 'POST' }),

  // Xác thực đăng nhập & Đăng ký doanh nghiệp
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  sendRegistrationOtp: (data) => request('/auth/send-registration-otp', { method: 'POST', body: JSON.stringify(data) }),
  registerCompany: (data) => request('/auth/register-company', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (id) => request(id ? `/auth/profile?id=${id}` : '/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Quản lý Danh mục động (Categories API)
  getCategories: (type) => request(type ? `/categories?type=${type}` : '/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Tổng quan & Báo cáo & Nhắc hạn 6:00 AM
  getDashboardSummary: () => request('/reports/dashboard-summary'),
  getRemindersStatus: () => request('/reminders/status'),
  refreshReminders: () => request('/reminders/refresh', { method: 'POST' }),
  getHealth: () => request('/health'),

  // Tài sản
  getAssets: () => request('/assets'),
  getAsset: (id) => request(`/assets/${id}`),
  createAsset: (data) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id, data) => request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: 'DELETE' }),

  // Tài chính & Doanh thu
  getFinance: () => request('/finance'),
  getMonthlySummary: () => request('/finance/monthly-summary'),
  createFinance: (data) => request('/finance', { method: 'POST', body: JSON.stringify(data) }),
  deleteFinance: (id) => request(`/finance/${id}`, { method: 'DELETE' }),

  // Công việc & Nhắc hạn
  getTasks: () => request('/tasks'),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Hợp đồng & Biên bản
  getContracts: () => request('/contracts'),
  createContract: (data) => request('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (id, data) => request(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContract: (id) => request(`/contracts/${id}`, { method: 'DELETE' }),
  addContractAppendix: (id, data) => request(`/contracts/${id}/appendices`, { method: 'POST', body: JSON.stringify(data) }),
  getHandovers: () => request('/contracts/handover/list'),
  createHandover: (data) => request('/contracts/handover/create', { method: 'POST', body: JSON.stringify(data) }),

  // AI Học & Tự Động Xây Dựng Hợp Đồng / Biên Bản
  getAiContractTemplates: () => request('/contracts/ai/templates'),
  saveAiContractTemplate: (data) => request('/contracts/ai/templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteAiContractTemplate: (id) => request(`/contracts/ai/templates/${id}`, { method: 'DELETE' }),
  learnAiContract: (data) => request('/contracts/ai/learn', { method: 'POST', body: JSON.stringify(data) }),
  generateAiContract: (data) => request('/contracts/ai/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Chấm công
  getAttendance: () => request('/attendance'),
  getAttendanceSummary: () => request('/attendance/summary'),
  checkAttendance: (data) => request('/attendance/check', { method: 'POST', body: JSON.stringify(data) }),

  // Người dùng
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Cài đặt hệ thống & chấm công
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Dịch vụ Email & Tự Động Hóa (Resend & Brevo)
  sendTestEmail: (data) => request('/mail/test', { method: 'POST', body: JSON.stringify(data || {}) }),
  sendTimesheetEmail: (data) => request('/mail/send-timesheet', { method: 'POST', body: JSON.stringify(data) }),
  sendDailyRemindersEmail: (data) => request('/mail/send-daily-reminders', { method: 'POST', body: JSON.stringify(data || {}) }),
  broadcastEmail: (data) => request('/mail/broadcast', { method: 'POST', body: JSON.stringify(data) }),
  sendSupportEmail: (data) => request('/mail/send-support', { method: 'POST', body: JSON.stringify(data) }),
  sendManagementNotification: (data) => request('/mail/send-management-notification', { method: 'POST', body: JSON.stringify(data || {}) }),

  // Trợ lý AI Linh vật
  aiChat: (data) => request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),

  // Cấu hình kết nối hệ thống
  getCloudflareStatus: () => request('/cloudflare/status'),
  testCloudflare: (data) => request('/cloudflare/test', { method: 'POST', body: JSON.stringify(data) }),
  saveCloudflare: (data) => request('/cloudflare/save', { method: 'POST', body: JSON.stringify(data) }),
  syncCloudflareSchema: () => request('/cloudflare/sync-schema', { method: 'POST' }),

  // Super Admin: Quản trị Doanh nghiệp, Cấp quyền & Gói Cước
  getSuperAdminOverview: () => request('/super-admin/overview'),
  getSuperAdminCompanies: () => request('/super-admin/companies'),
  createSuperAdminCompany: (data) => request('/super-admin/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompanyLicense: (id, data) => request(`/super-admin/companies/${id}/license`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSuperAdminCompany: (id) => request(`/super-admin/companies/${id}`, { method: 'DELETE' }),
  getCompanyUsers: (companyId) => request(`/super-admin/companies/${companyId}/users`),
  getSuperAdminKeys: () => request('/super-admin/keys'),
  createSuperAdminKey: (data) => request('/super-admin/keys', { method: 'POST', body: JSON.stringify(data) }),
  updateSuperAdminKey: (id, data) => request(`/super-admin/keys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSuperAdminKey: (id) => request(`/super-admin/keys/${id}`, { method: 'DELETE' }),
  getSuperAdminPlans: () => request('/super-admin/plans'),
  saveSuperAdminPlan: (data) => request('/super-admin/plans', { method: 'POST', body: JSON.stringify(data) }),
  deleteSuperAdminPlan: (id) => request(`/super-admin/plans/${id}`, { method: 'DELETE' }),
  getSuperAdminOrders: (params) => {
    const qs = params?.status ? `?status=${params.status}` : '';
    return request(`/super-admin/revenue-orders${qs}`);
  },
  createSuperAdminOrder: (data) => request('/super-admin/orders', { method: 'POST', body: JSON.stringify(data) }),
  approveSuperAdminOrder: (id) => request(`/super-admin/orders/${id}/approve`, { method: 'PUT' }),
  cancelSuperAdminOrder: (id, data) => request(`/super-admin/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify(data || {}) }),

  // Super Admin: Phát Thư Gói Dịch Vụ & Thông Báo Nền Tảng (notifications@omniassets.ryug.id.vn)
  getSuperAdminAnnouncementRecipients: () => request('/super-admin/announcements/recipients'),
  broadcastSuperAdminAnnouncement: (data) => request('/super-admin/announcements/broadcast', { method: 'POST', body: JSON.stringify(data) }),

  // Super Admin: Hòm Thư Yêu Cầu Hỗ Trợ (Tickets - support@omniassets.ryug.id.vn)
  getSuperAdminSupportTickets: () => request('/super-admin/support-tickets'),
  replySuperAdminSupportTicket: (data) => request('/super-admin/support-tickets/reply', { method: 'POST', body: JSON.stringify(data) }),
};

