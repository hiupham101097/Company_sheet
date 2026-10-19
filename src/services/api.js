const API_BASE = '/api';

async function request(endpoint, options = {}) {
  let userRole = 'STAFF';
  let userId = '';
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const u = JSON.parse(userStr);
      userRole = u.role || 'STAFF';
      userId = u.id || '';
    }
  } catch {}

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
      'x-user-id': userId,
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Lỗi kết nối máy chủ');
  }
  return data;
}

export const api = {
  // Xác thực đăng nhập
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Quản lý Danh mục động (Categories API)
  getCategories: (type) => request(type ? `/categories?type=${type}` : '/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Tổng quan & Báo cáo
  getDashboardSummary: () => request('/reports/dashboard-summary'),
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
  getHandovers: () => request('/contracts/handover/list'),
  createHandover: (data) => request('/contracts/handover/create', { method: 'POST', body: JSON.stringify(data) }),

  // Chấm công
  getAttendance: () => request('/attendance'),
  getAttendanceSummary: () => request('/attendance/summary'),
  checkAttendance: (data) => request('/attendance/check', { method: 'POST', body: JSON.stringify(data) }),

  // Người dùng
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Cài đặt hệ thống & chấm công
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Cấu hình kết nối hệ thống
  getCloudflareStatus: () => request('/cloudflare/status'),
  testCloudflare: (data) => request('/cloudflare/test', { method: 'POST', body: JSON.stringify(data) }),
  saveCloudflare: (data) => request('/cloudflare/save', { method: 'POST', body: JSON.stringify(data) }),
  syncCloudflareSchema: () => request('/cloudflare/sync-schema', { method: 'POST' }),
};
