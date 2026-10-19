import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  FileSpreadsheet,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';
import { formatDateVN, formatMoneyVN } from '../../utils/formatters';

export function FinanceManager({
  financeList = [],
  monthlyData,
  onRefresh,
  userRole = 'ADMIN',
  licenseInfo,
  onOpenUpgrade
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    type: 'REVENUE',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    invoice_number: ''
  });

  useEffect(() => {
    api.getCategories('FINANCE_CATEGORY')
      .then((res) => {
        const list = res.data || [];
        setCategories(list);
        if (list.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: list[0].name }));
        }
      })
      .catch((err) => console.error('Error fetching finance categories:', err));
  }, []);

  if (userRole === 'STAFF') {
    return (
      <div className="bg-white p-12 rounded-3xl border border-pastel-200/80 shadow-soft text-center space-y-3">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <TrendingDown size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800">Quyền Hạn Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Tài khoản Nhân viên (STAFF) không có quyền xem dữ liệu tài chính & doanh thu của doanh nghiệp. Vui lòng liên hệ Quản trị viên nếu cần cấp quyền.
        </p>
      </div>
    );
  }

  const formatVND = (num) => formatMoneyVN(num);

  const totalRevenue = financeList
    .filter((f) => f.type === 'REVENUE')
    .reduce((acc, cur) => acc + (cur.amount || 0), 0);

  const totalExpense = financeList
    .filter((f) => f.type === 'EXPENSE')
    .reduce((acc, cur) => acc + (cur.amount || 0), 0);

  const netProfit = totalRevenue - totalExpense;

  const filteredList = financeList.filter((item) => {
    if (typeFilter === 'ALL') return true;
    return item.type === typeFilter;
  });

  const handleExportExcel = () => {
    if (licenseInfo?.isDemo) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Tính năng Xuất Báo Cáo Tài Chính Excel chỉ khả dụng cho Bản Quyền Enterprise. Quý khách vui lòng kích hoạt bản quyền để tải báo cáo!');
      }
      return;
    }
    const exportData = filteredList.map((item) => ({
      'Số hóa đơn / Chứng từ': item.invoice_number,
      'Ngày phát sinh': formatDateVN(item.date),
      'Phân loại': item.type === 'REVENUE' ? 'Thu' : 'Chi',
      'Hạng mục': item.category,
      'Số tiền (VNĐ)': formatMoneyVN(item.amount, false),
      'Nội dung diễn giải': item.description
    }));
    exportToExcel(exportData, 'Bao_Cao_Thu_Chi_Doanh_Thu', 'Tài Chính');
  };

  const handleOpenAddModal = () => {
    if (licenseInfo?.isDemo && financeList.length >= 5) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Phiên bản Dùng Thử (Demo) giới hạn tối đa 5 phiếu thu/chi. Quý khách vui lòng kích hoạt Bản Quyền Enterprise để quản lý không giới hạn!');
      }
      return;
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createFinance(formData);
      setIsModalOpen(false);
      setFormData({
        type: 'REVENUE',
        category: categories[0]?.name || 'Hợp đồng dịch vụ phần mềm',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        invoice_number: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.code === 'LICENSE_LIMIT_REACHED' && onOpenUpgrade) {
        onOpenUpgrade(err.message);
        return;
      }
      alert(err.message || 'Lỗi thêm giao dịch');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        await api.deleteFinance(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(err.message || 'Lỗi xóa giao dịch');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Doanh Thu & Tài Chính Hàng Tháng
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-slate-500">
              Theo dõi dòng tiền thu chi ({financeList.length} phiếu ghi), biên lợi nhuận ròng và thống kê kết quả kinh doanh.
            </p>
            {licenseInfo?.isDemo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                Demo: {financeList.length}/5 phiếu
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all w-full sm:w-auto"
          >
            <FileSpreadsheet size={16} className="text-pastel-600 shrink-0" />
            <span>Xuất Excel</span>
            {licenseInfo?.isDemo && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Khóa</span>
            )}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all w-full sm:w-auto"
          >
            <Plus size={16} className="shrink-0" />
            <span>Thêm Thu / Chi</span>
          </button>
        </div>
      </div>

      {/* Summary 3 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng Thu Doanh Nghiệp
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{formatVND(totalRevenue)}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">Nguồn thu từ hợp đồng & dịch vụ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng Chi Phí Vận Hành
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{formatVND(totalExpense)}</h3>
          <p className="text-xs text-rose-500 font-medium mt-1">Mua sắm thiết bị & chi phí quản trị</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-pastel-200/90 shadow-soft card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lợi Nhuận Ròng (Net Profit)
            </span>
            <div className="w-9 h-9 rounded-xl bg-pastel-100 text-pastel-700 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-pastel-700 mt-2">{formatVND(netProfit)}</h3>
          <p className="text-xs text-slate-400 mt-1">Lợi nhuận ròng tích lũy</p>
        </div>
      </div>

      {/* Monthly Bar Comparison Chart */}
      <div className="bg-white p-6 rounded-3xl border border-pastel-200/80 shadow-soft">
        <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">
          So Sánh Doanh Thu & Chi Phí Theo Các Tháng Trong Năm (VNĐ)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip
                formatter={(val) => [formatVND(val), '']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #CEE8DD',
                  boxShadow: '0 8px 24px rgba(78, 159, 142, 0.12)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="revenue" name="Doanh thu" fill="#4E9F8E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Chi phí" fill="#FB7185" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction List: Mobile Cards + Desktop Table */}
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-2xl border border-pastel-200/80 shadow-xs flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Sổ Nhật Ký Thu Chi</h3>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'REVENUE', label: 'Khoản Thu' },
              { id: 'EXPENSE', label: 'Khoản Chi' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${typeFilter === t.id
                    ? 'bg-pastel-500 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-pastel-50'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View: Clean Cards */}
        <div className="block md:hidden space-y-3">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-pastel-200/80 shadow-xs">
              Chưa có giao dịch nào được ghi nhận.
            </div>
          ) : (
            filteredList.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-pastel-200/90 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-pastel-700 bg-pastel-50 px-2.5 py-0.5 rounded-md border border-pastel-200/70">
                    {item.invoice_number}
                  </span>
                  <Badge variant={item.type === 'REVENUE' ? 'success' : 'danger'}>
                    {item.type === 'REVENUE' ? '+ Thu' : '- Chi'}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">{item.category}</h4>
                  <span className={`text-base font-black ${item.type === 'REVENUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.type === 'REVENUE' ? '+' : '-'} {formatVND(item.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="font-mono text-[11px]">{formatDateVN(item.date)}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.description && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-dashed border-slate-100">
                    {item.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table with forced horizontal scroll */}
        <div className="hidden md:block bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '850px' }}>
              <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Số Chứng Từ</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Ngày</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Loại</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap" style={{ minWidth: '200px' }}>Hạng Mục</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Số Tiền</th>
                  <th className="py-3.5 px-4 font-bold">Diễn Giải</th>
                  <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Chưa có giao dịch nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-pastel-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">
                        {item.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">{formatDateVN(item.date)}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={item.type === 'REVENUE' ? 'success' : 'danger'}>
                          {item.type === 'REVENUE' ? '+ Thu' : '- Chi'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold" style={{ minWidth: '200px' }}>{item.category}</td>
                      <td className={`py-3.5 px-4 font-bold whitespace-nowrap ${item.type === 'REVENUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <span className="inline-block whitespace-nowrap">{item.type === 'REVENUE' ? '+' : '-'} {formatVND(item.amount)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{item.description}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa giao dịch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Thêm Giao Dịch */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ghi Nhận Giao Dịch Thu / Chi Mới"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Loại giao dịch *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-semibold text-xs shadow-xs"
              >
                <option value="REVENUE">📈 Khoản Thu (Doanh thu)</option>
                <option value="EXPENSE">📉 Khoản Chi (Chi phí)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Số tiền (VNĐ) *</label>
              <input
                type="number"
                required
                placeholder="VD: 50000000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-semibold text-xs shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Hạng mục thu / chi</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium text-xs shadow-xs"
              >
                {categories.length === 0 ? (
                  <option value="">Đang tải danh mục...</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Ngày ghi nhận *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-medium text-xs shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Mã hóa đơn / Chứng từ</label>
            <input
              type="text"
              placeholder="VD: HD-2024-099"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono text-xs shadow-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Diễn giải nội dung</label>
            <textarea
              rows={3}
              placeholder="Chi tiết nguồn thu, đối tác hoặc mục đích chi tiêu..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 text-xs shadow-xs"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>Lưu Giao Dịch</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
