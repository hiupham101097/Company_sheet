/**
 * Security Guard: Client-side Hardening & Anti-Scraping / Anti-Inspection Suite
 * - Blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
 * - Disables Context Menu (Right Click)
 * - Anti-Debugging Trap (debugger loop on DevTools open)
 * - Large Warning Banner in Console (Facebook/Discord style)
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. In biểu ngữ cảnh báo bảo mật màu đỏ khổng lồ trong Console
  const printConsoleWarning = () => {
    try {
      console.clear();
      console.log(
        '%c⛔ DỪNG LẠI! (ACCESS RESTRICTED)',
        'color: #ef4444; font-size: 32px; font-weight: 900; -webkit-text-stroke: 1px black; text-shadow: 2px 2px 0 #000; padding: 6px 0;'
      );
      console.log(
        '%cĐây là tính năng trình duyệt dành riêng cho Quản trị viên và Kỹ thuật viên hệ thống.\n' +
        'Mọi hành vi can thiệp DOM, sao chép mã nguồn, sửa đổi dữ liệu hoặc cào trích xuất API đều bị máy chủ ghi nhận nhật ký bảo mật (IP & Device Fingerprint) và xử lý theo quy định.',
        'color: #f59e0b; font-size: 13px; font-weight: bold; line-height: 1.6; padding: 4px 0;'
      );
      console.log(
        '%c🛡️ Hệ thống OMNI ASSETS được bảo vệ bởi Cloudflare WAF, Enterprise Multi-Tenancy & Anti-Scraping Shield.',
        'color: #10b981; font-size: 11px; font-style: italic;'
      );
    } catch (_) {}
  };

  printConsoleWarning();

  // Định kỳ xóa và in lại cảnh báo
  setInterval(printConsoleWarning, 8000);

  // 2. Chặn chuột phải (Context Menu)
  document.addEventListener('contextmenu', (e) => {
    // Không chặn trên các input hoặc textarea thông thường để người dùng vẫn paste được
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
    printConsoleWarning();
    return false;
  });

  // 3. Chặn các phím tắt mở DevTools, xem nguồn trang
  document.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey; // Windows Ctrl or Mac Command
    const key = e.key ? e.key.toUpperCase() : '';
    const code = e.keyCode || e.which;

    // F12 (keyCode 123)
    if (key === 'F12' || code === 123) {
      e.preventDefault();
      e.stopPropagation();
      printConsoleWarning();
      return false;
    }

    // Ctrl + Shift + I (Inspect)
    // Ctrl + Shift + J (Console)
    // Ctrl + Shift + C (Element picker)
    // Ctrl + Shift + K (Firefox Console)
    if (isCtrl && e.shiftKey && ['I', 'J', 'C', 'K'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      printConsoleWarning();
      return false;
    }

    // Ctrl + U (View Page Source)
    if (isCtrl && (key === 'U' || code === 85)) {
      e.preventDefault();
      e.stopPropagation();
      printConsoleWarning();
      return false;
    }

    // Ctrl + S (Save Page)
    if (isCtrl && (key === 'S' || code === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // 4. Bẫy Debugger Loop (Anti-Debugging Trap)
  // Khi DevTools được mở, trình duyệt sẽ tự động nhảy vào breakpoint `debugger` và bị đóng băng
  const startDebuggerTrap = () => {
    const trap = () => {
      try {
        const start = performance.now();
        // Vòng lặp debugger ngầm
        (function() {
          return false;
        }
        ['constructor']('debugger')());
        const end = performance.now();
        // Nếu chênh lệch thời gian > 100ms, nghĩa là DevTools đang mở và đã dừng ở breakpoint
        if (end - start > 100) {
          printConsoleWarning();
        }
      } catch (_) {}
    };

    // Chạy ngầm định kỳ
    setInterval(trap, 300);
  };

  // Kích hoạt bẫy debugger trên môi trường Production
  if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    startDebuggerTrap();
  }
}
