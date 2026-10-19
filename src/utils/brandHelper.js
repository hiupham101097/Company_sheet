// ========================================================
// BRAND & ENTERPRISE NAME RESOLVER
// ========================================================

/**
 * Trả về tên thương hiệu hiển thị trên toàn hệ thống:
 * - Nếu là demo (hoặc chưa có doanh nghiệp khác): hiển thị 'OMNIASSETS'
 * - Nếu có doanh nghiệp khác: hiển thị tên doanh nghiệp đó (ví dụ 'Tập Đoàn Công Nghệ Thử Nghiệm')
 * 
 * @param {Object} params
 * @param {Object} [params.licenseInfo]
 * @param {string} [params.companyName]
 * @param {Object} [params.currentUser]
 * @returns {string} Tên thương hiệu hiển thị
 */
export function getBrandDisplayName({ licenseInfo, companyName, currentUser } = {}) {
  const isDemo = licenseInfo?.isDemo !== false && licenseInfo?.tier !== 'ENTERPRISE';

  // Lấy tên ứng viên từ các nguồn dữ liệu
  const candidate = (
    currentUser?.company_name ||
    companyName ||
    licenseInfo?.company_name ||
    licenseInfo?.companyName ||
    licenseInfo?.organization ||
    ''
  ).trim();

  // Danh sách các tên đại diện cho bản Demo gốc của OMNIASSETS
  const isDefaultDemoName =
    !candidate ||
    candidate.toUpperCase() === 'OMNI ASSETS' ||
    candidate.toUpperCase() === 'OMNIASSETS' ||
    candidate.toUpperCase() === 'OMNI ASSETS & LOGISTICS' ||
    candidate.toUpperCase() === 'DOANH NGHIỆP' ||
    candidate.toUpperCase() === 'ENTERPRISE';

  // 1. Nếu có tên doanh nghiệp khác đã được thiết lập (khác tên mặc định OMNIASSETS)
  if (!isDefaultDemoName) {
    return candidate;
  }

  // 2. Nếu là demo hoặc không có tên doanh nghiệp riêng -> hiển thị OMNIASSETS
  return 'OMNIASSETS';
}

/**
 * Rút gọn tên thương hiệu để hiển thị trên màn hình nhỏ hoặc mobile
 */
export function getShortBrandName(brandName = 'OMNIASSETS') {
  if (!brandName || brandName === 'OMNIASSETS' || brandName === 'OMNI ASSETS') {
    return 'OMNI';
  }
  if (brandName.length <= 15) {
    return brandName;
  }
  // Lấy từ khóa chính hoặc cắt ngắn
  return brandName.slice(0, 14) + '…';
}
