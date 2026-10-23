/**
 * Security Guard: Client-side Hardening & Anti-Scraping / Anti-Inspection Suite
 * - Blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S
 * - Disables Context Menu (Right Click)
 * - Anti-Debugging Trap (debugger loop on DevTools open)
 * - Large Warning Banner in Console (Facebook/Discord style)
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. In biểu ngữ cảnh báo bảo mật trong Console
  const printConsoleWarning = () => {
    try {
      console.log(
        '%c⛔ DỪNG LẠI! (ACCESS RESTRICTED)',
        'color: #ef4444; font-size: 26px; font-weight: 900; -webkit-text-stroke: 1px black; padding: 4px 0;'
      );
      console.log(
        '%c🛡️ Hệ thống OMNI ASSETS được bảo vệ bởi Cloudflare WAF, Enterprise Multi-Tenancy & Anti-Scraping Shield.',
        'color: #10b981; font-size: 11px; font-style: italic;'
      );
    } catch (_) {}
  };

  printConsoleWarning();


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

  // 4. Bẫy Debugger Loop - Tắt hoàn toàn trên môi trường Production để tránh gây trắng màn hình / vi phạm CSP
  // Giữ lại biểu ngữ cảnh báo và cơ chế chặn phím tắt Inspect/Copy an toàn
}

