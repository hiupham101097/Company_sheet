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
