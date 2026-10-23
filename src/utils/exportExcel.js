import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu JSON ra file Excel (.xlsx) với định dạng bảng chuẩn
 * @param {Array<Object>} data Mảng các object dữ liệu
 * @param {string} fileName Tên file xuất (không cần .xlsx)
 * @param {string} sheetName Tên sheet
 */
export function exportToExcel(data, fileName = 'Bao_Cao', sheetName = 'Du_Lieu') {
  if (!data || !data.length) {
    alert('Không có dữ liệu để xuất file Excel!');
    return;
  }

  // Tạo worksheet từ mảng JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tự động căn chỉnh độ rộng cột
  const columnWidths = Object.keys(data[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((item) => (item[key] ? String(item[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });
  worksheet['!cols'] = columnWidths;

  // Tạo workbook và gắn sheet vào
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Lưu file với đuôi .xlsx
  const finalName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

/**
 * Xuất file Excel chuyên nghiệp với nhiều Sheet (Multi-sheet Workbook)
 * @param {Array<{name: string, data: Array<Object>}>} sheets Danh sách các sheet và dữ liệu
 * @param {string} fileName Tên file xuất
 */
export function exportMultiSheetExcel(sheets, fileName = 'Bao_Cao_Tong_Hop') {
  if (!sheets || !sheets.length) {
    alert('Không có dữ liệu để xuất file Excel!');
    return;
  }

  const workbook = XLSX.utils.book_new();
  let hasValidSheet = false;

  sheets.forEach((sh) => {
    if (!sh.data || !sh.data.length) return;
    hasValidSheet = true;

    const worksheet = XLSX.utils.json_to_sheet(sh.data);

    // Căn chỉnh độ rộng cột tự động
    const columnWidths = Object.keys(sh.data[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...sh.data.map((item) => (item[key] ? String(item[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
    });
    worksheet['!cols'] = columnWidths;

    // Giới hạn tên sheet tối đa 31 ký tự theo chuẩn Microsoft Excel
    const safeSheetName = (sh.name || 'Sheet').slice(0, 31).replace(/[\\/?*[\]:]/g, '_');
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  });

  if (!hasValidSheet) {
    alert('Không có dữ liệu hợp lệ trong các bảng để xuất Excel!');
    return;
  }

  const finalName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}
