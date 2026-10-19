// ========================================================
// SEO SLUG & OPEN GRAPH METADATA ROUTING
// ========================================================

export const BASE_URL = 'https://company-sheet.hieupham101097.workers.dev';

export const SLUG_TO_TAB = {
  '/': 'dashboard',
  '/tong-quan': 'dashboard',
  '/tai-san': 'assets',
  '/tai-chinh': 'finance',
  '/cong-viec': 'tasks',
  '/hop-dong': 'contracts',
  '/cham-cong': 'attendance',
  '/nhan-su': 'users',
  '/danh-muc': 'categories',
  '/cai-dat': 'settings',
  '/quan-tri-tong': 'super-admin',
};

export const TAB_TO_SLUG = {
  dashboard: '/tong-quan',
  assets: '/tai-san',
  finance: '/tai-chinh',
  tasks: '/cong-viec',
  contracts: '/hop-dong',
  attendance: '/cham-cong',
  users: '/nhan-su',
  categories: '/danh-muc',
  settings: '/cai-dat',
  'super-admin': '/quan-tri-tong',
};

export const TAB_SEO_META = {
  dashboard: {
    slug: '/tong-quan',
    title: 'Tổng Quan Vận Hành & Chỉ Số Doanh Nghiệp | OMNI ASSETS',
    description: 'Báo cáo chỉ số điều hành, biểu đồ tài chính, kiểm soát tài sản và dòng tiền doanh nghiệp thời gian thực.'
  },
  assets: {
    slug: '/tai-san',
    title: 'Quản Lý Tài Sản & Trang Thiết Bị Doanh Nghiệp | OMNI ASSETS',
    description: 'Theo dõi, phân bổ, khấu hao, kiểm kê tình trạng và bàn giao tài sản thiết bị doanh nghiệp tập trung.'
  },
  finance: {
    slug: '/tai-chinh',
    title: 'Báo Cáo Doanh Thu & Dòng Tiền Doanh Nghiệp | OMNI ASSETS',
    description: 'Quản lý thu chi, hóa đơn, dòng tiền và phân tích lợi nhuận doanh nghiệp minh bạch và trực quan.'
  },
  tasks: {
    slug: '/cong-viec',
    title: 'Quản Lý Công Việc & Nhắc Hạn Tự Động 6:00 AM | OMNI ASSETS',
    description: 'Giao việc phòng ban, kiểm soát tiến độ, hạn chót và cơ chế tự động gửi cảnh báo nhắc nhở mỗi sáng.'
  },
  contracts: {
    slug: '/hop-dong',
    title: 'Quản Lý Hợp Đồng & Biên Bản Bàn Giao Thông Minh | OMNI ASSETS',
    description: 'Lưu trữ, theo dõi phụ lục hợp đồng, điều khoản thanh toán, biên bản nghiệm thu và AI tự động soạn thảo.'
  },
  attendance: {
    slug: '/cham-cong',
    title: 'Hệ Thống Chấm Công & Quản Lý Ca Làm Việc | OMNI ASSETS',
    description: 'Chấm công trực tuyến 1 lần/ngày, chống gian lận, tính công tự động và báo cáo chuyên cần nhân sự.'
  },
  users: {
    slug: '/nhan-su',
    title: 'Quản Lý Nhân Sự & Phân Quyền Phòng Ban | OMNI ASSETS',
    description: 'Hồ sơ nhân viên, gắn kết phòng ban, phân quyền bảo mật nhiều cấp Admin, Manager, Staff.'
  },
  categories: {
    slug: '/danh-muc',
    title: 'Quản Lý Danh Mục Hệ Thống Động | OMNI ASSETS',
    description: 'Tự do thiết lập phòng ban, nhóm tài sản, danh mục thu chi và cấu hình hệ thống linh hoạt.'
  },
  settings: {
    slug: '/cai-dat',
    title: 'Cài Đặt Hệ Thống & Đồng Bộ Dữ Liệu Cloudflare | OMNI ASSETS',
    description: 'Cấu hình quy chuẩn chấm công, ca làm việc, thông tin pháp nhân và đồng bộ dữ liệu thời gian thực.'
  },
  'super-admin': {
    slug: '/quan-tri-tong',
    title: 'Cổng Quản Trị Nền Tảng Tối Cao (Master Admin) | OMNI ASSETS',
    description: 'Cấp quyền bản quyền doanh nghiệp, quản lý các gói cước 1 năm, vĩnh viễn, dùng thử và thống kê doanh thu.'
  }
};

/**
 * Lấy Tab tương ứng với đường dẫn URL hiện tại
 */
export function getTabFromPath(pathname = window.location.pathname, userRole = 'STAFF') {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (SLUG_TO_TAB[cleanPath]) {
    // Nếu slug là super admin nhưng user không phải super admin thì fallback về dashboard
    if (SLUG_TO_TAB[cleanPath] === 'super-admin' && userRole !== 'SUPER_ADMIN') {
      return 'dashboard';
    }
    return SLUG_TO_TAB[cleanPath];
  }
  if (userRole === 'SUPER_ADMIN') {
    return 'super-admin';
  }
  return 'dashboard';
}

/**
 * Cập nhật động SEO Meta Tags, Canonical URL và Slug trình duyệt
 */
export function syncTabToUrlAndSeo(tab, pushHistory = true) {
  const meta = TAB_SEO_META[tab] || TAB_SEO_META.dashboard;
  const targetSlug = TAB_TO_SLUG[tab] || '/tong-quan';
  const fullUrl = `${BASE_URL}${targetSlug}`;

  // 1. Cập nhật Title
  document.title = meta.title;

  // 2. Cập nhật Meta Description
  let descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.setAttribute('content', meta.description);
  }

  // 3. Cập nhật Open Graph (Facebook / Zalo preview)
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', meta.title);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', meta.description);

  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', fullUrl);

  // 4. Cập nhật Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', fullUrl);
  }

  // 5. Cập nhật Twitter Cards
  let twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', meta.title);

  let twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', meta.description);

  // 6. Đồng bộ URL slug trên thanh địa chỉ không cần reload
  if (pushHistory && window.location.pathname !== targetSlug) {
    window.history.pushState({ tab }, meta.title, targetSlug);
  }
}
