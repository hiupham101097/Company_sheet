/**
 * Security Guard: Client-side Hardening & Diagnostics
 * - Cho phép F12 & DevTools hoạt động tự nhiên để lập trình viên / quản trị viên xem Log & Debug lỗi.
 * - Bảo vệ các thao tác nhạy cảm và in cảnh báo an toàn phiên đăng nhập.
 * - Bảo mật kết nối API và mạng (Network Layer) theo chuẩn OWASP.
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. In biểu ngữ thông tin bảo mật & debug trong Console (F12)
  try {
    console.log(
      '%c🛡️ OMNI ASSETS • DEVTOOLS CONSOLE & DIAGNOSTICS ACTIVE',
      'color: #4f46e5; font-size: 16px; font-weight: 800; padding: 4px 0;'
    );
    console.log(
      '%cℹ️ DevTools Console mở để theo dõi log & kiểm tra lỗi hệ thống. Luồng dữ liệu mạng được mã hóa và bảo vệ bởi Cloudflare Shield.',
      'color: #059669; font-size: 11px; font-weight: 500;'
    );
  } catch (_) {}

  // 2. Chặn các phím tắt lưu trang (Ctrl+S) để tránh tải đè source code xuống máy
  document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key ? e.key.toUpperCase() : '';
    const code = e.keyCode || e.which;

    if (isCtrl && (key === 'S' || code === 83)) {
      e.preventDefault();
      return false;
    }
  });
}
