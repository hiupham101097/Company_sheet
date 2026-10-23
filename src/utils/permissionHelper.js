// ==========================================
// CENTRAL PERMISSION & ROLE ENGINE
// Ma Trận Phân Quyền Tập Trung Của Doanh Nghiệp
// ==========================================

export const PERMISSION_MODULES = [
  {
    id: 'assets',
    name: 'Tài Sản & Thiết Bị',
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
    permissions: [
      { id: 'finance_view', label: 'Xem tổng quan dòng tiền & lợi nhuận' },
      { id: 'finance_create', label: 'Lập phiếu thu / phiếu chi mới' },
      { id: 'finance_export', label: 'Xuất báo cáo tài chính & bảng kê' },
    ]
  },
  {
    id: 'users',
    name: 'Quản Lý Nhân Sự & Tài Khoản',
    permissions: [
      { id: 'users_view', label: 'Xem danh sách hồ sơ nhân sự' },
      { id: 'users_create', label: 'Thêm nhân viên mới & cấp tài khoản' },
      { id: 'users_edit', label: 'Chỉnh sửa phòng ban, chức vụ & đổi vai trò' },
      { id: 'users_lock', label: 'Khóa / Mở khóa quyền truy cập của nhân viên' },
    ]
  }
];

/**
 * Khởi tạo quyền mặc định thông minh theo tên phòng ban (100% linh hoạt theo API, không fix cứng)
 */
export function getDefaultPermissionsForDepartment(deptName = '') {
  const lower = String(deptName).toLowerCase().trim();

  // Ban Giám Đốc / Ban Quản Lý / Lãnh đạo cấp cao: Toàn quyền
  if (lower.includes('giám đốc') || lower.includes('lãnh đạo') || lower.includes('quản trị') || lower.includes('bql') || lower.includes('hội đồng')) {
    return PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.id));
  }

  // Tài chính / Kế toán
  if (lower.includes('kế toán') || lower.includes('tài chính') || lower.includes('ngân quỹ') || lower.includes('thu chi')) {
    return [
      'finance_view', 'finance_create', 'finance_export',
      'contracts_view', 'contracts_create', 'contracts_ai',
      'assets_view',
      'attendance_checkin', 'attendance_view_all', 'attendance_send_timesheet',
      'tasks_view', 'tasks_create'
    ];
  }

  // Kỹ thuật / IT / Công nghệ / Hạ tầng
  if (lower.includes('kỹ thuật') || lower.includes('it') || lower.includes('công nghệ') || lower.includes('phần mềm') || lower.includes('hạ tầng')) {
    return [
      'assets_view', 'assets_create', 'assets_edit', 'assets_delete', 'assets_handover',
      'tasks_view', 'tasks_create', 'tasks_edit',
      'attendance_checkin',
      'contracts_view'
    ];
  }

  // Nhân sự / Hành chính / Tuyển dụng
  if (lower.includes('nhân sự') || lower.includes('hành chính') || lower.includes('hr') || lower.includes('tuyển dụng')) {
    return [
      'users_view', 'users_create', 'users_edit', 'users_lock',
      'attendance_checkin', 'attendance_view_all', 'attendance_approve', 'attendance_send_timesheet',
      'assets_view', 'assets_handover',
      'contracts_view', 'contracts_create',
      'tasks_view', 'tasks_create'
    ];
  }

  // Kinh doanh / Marketing / Bán hàng
  if (lower.includes('kinh doanh') || lower.includes('marketing') || lower.includes('sales') || lower.includes('bán hàng') || lower.includes('thị trường')) {
    return [
      'contracts_view', 'contracts_create', 'contracts_ai',
      'tasks_view', 'tasks_create', 'tasks_edit',
      'attendance_checkin',
      'finance_view'
    ];
  }

  // Mọi phòng ban / bộ phận thông thường khác: Quyền cơ bản của thành viên
  return [
    'assets_view',
    'tasks_view',
    'attendance_checkin'
  ];
}

// Proxy linh hoạt hỗ trợ truy cập dạng DEFAULT_DEPT_PERMISSIONS['Tên phòng ban bất kỳ']
export const DEFAULT_DEPT_PERMISSIONS = new Proxy({}, {
  get: (_, prop) => getDefaultPermissionsForDepartment(String(prop))
});

/**
 * Trích xuất danh sách toàn bộ các quyền hợp lệ của người dùng
 * (Kế thừa từ Phòng ban + Quyền được cấp riêng + Vai trò quản trị)
 */
export function getUserEffectivePermissions(user, companySettings) {
  if (!user) return new Set();

  const role = user.role || 'STAFF';

  // Super Admin và Admin có toàn quyền hệ thống
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    const allPerms = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.id));
    return new Set(allPerms);
  }

  const effectivePerms = new Set();

  // 1. Phân tích quyền kế thừa theo Bộ Phận
  let deptMap = {};
  if (companySettings?.dept_permissions) {
    try {
      const parsed = typeof companySettings.dept_permissions === 'string'
        ? JSON.parse(companySettings.dept_permissions)
        : companySettings.dept_permissions;
      if (parsed && typeof parsed === 'object') {
        deptMap = parsed;
      }
    } catch (e) {
      console.warn('Lỗi parse dept_permissions:', e);
    }
  }

  const userDept = (user.department || '').trim();
  let deptPerms = [];
  if (userDept) {
    const matchedKey = Object.keys(deptMap).find(k => k.trim().toLowerCase() === userDept.toLowerCase());
    if (matchedKey && Array.isArray(deptMap[matchedKey])) {
      deptPerms = deptMap[matchedKey];
    } else {
      deptPerms = getDefaultPermissionsForDepartment(userDept);
    }
  }
  deptPerms.forEach(p => effectivePerms.add(p));

  // 2. Phân tích quyền cấp riêng cho nhân sự (Overrides)
  if (companySettings?.user_permissions && user.id) {
    try {
      const parsed = typeof companySettings.user_permissions === 'string'
        ? JSON.parse(companySettings.user_permissions)
        : companySettings.user_permissions;
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed[user.id])) {
        parsed[user.id].forEach(p => effectivePerms.add(p));
      }
    } catch (e) {
      console.warn('Lỗi parse user_permissions:', e);
    }
  }

  // 3. Quyền tối thiểu theo vai trò MANAGER nếu chưa có trong bộ phận
  if (role === 'MANAGER') {
    effectivePerms.add('assets_view');
    effectivePerms.add('tasks_view');
    effectivePerms.add('tasks_create');
    effectivePerms.add('tasks_edit');
    effectivePerms.add('attendance_checkin');
    effectivePerms.add('attendance_view_all');
    effectivePerms.add('attendance_approve');
    effectivePerms.add('contracts_view');
  }

  // Mọi nhân viên luôn có quyền điểm danh cá nhân và xem công việc của mình
  effectivePerms.add('attendance_checkin');
  effectivePerms.add('tasks_view');

  return effectivePerms;
}

/**
 * Kiểm tra xem người dùng có quyền thực thi hành động cụ thể không
 */
export function hasPermission(user, companySettings, permissionId) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

  const perms = getUserEffectivePermissions(user, companySettings);
  return perms.has(permissionId);
}

/**
 * Kiểm tra xem người dùng có quyền truy cập tab trên Sidebar không
 */
export function canAccessTab(user, companySettings, tabId) {
  if (!user) return false;
  const role = user.role || 'STAFF';

  // Super Admin chỉ dùng các tab Super Admin
  if (role === 'SUPER_ADMIN') {
    return ['overview', 'companies', 'keys', 'plans', 'revenue', 'settings', 'super-admin'].includes(tabId);
  }

  // Admin có quyền xem tất cả các tab của doanh nghiệp
  if (role === 'ADMIN') return true;

  const perms = getUserEffectivePermissions(user, companySettings);

  switch (tabId) {
    case 'dashboard':
      return true; // Tổng quan luôn mở
    case 'assets':
      return perms.has('assets_view') || role === 'MANAGER';
    case 'finance':
      return perms.has('finance_view') || role === 'MANAGER';
    case 'tasks':
      return perms.has('tasks_view') || true; // Công việc nhân viên luôn mở
    case 'contracts':
      return perms.has('contracts_view') || role === 'MANAGER';
    case 'attendance':
      return perms.has('attendance_checkin') || perms.has('attendance_view_all') || true;
    case 'users':
      return perms.has('users_view'); // Nhân sự HR có users_view sẽ mở được
    case 'categories':
      return role === 'ADMIN'; // Quản lý danh mục cốt lõi
    case 'settings':
      return role === 'ADMIN' || role === 'MANAGER';
    default:
      return true;
  }
}
