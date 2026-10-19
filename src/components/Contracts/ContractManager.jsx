import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { api } from '../../services/api';

export function ContractManager({ 
  contracts = [], 
  handovers = [], 
  assets = [], 
  users = [], 
  onRefresh,
  licenseInfo,
  onOpenUpgrade 
}) {
  const [activeSubTab, setActiveSubTab] = useState('CONTRACTS'); // 'CONTRACTS' hoặc 'HANDOVERS'
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [previewHandover, setPreviewHandover] = useState(null);

  const [contractForm, setContractForm] = useState({
    title: '',
    type: 'PARTNER',
    partner_name: '',
    value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [handoverForm, setHandoverForm] = useState({
    asset_id: '',
    user_id: '',
    type: 'HANDOVER',
    handover_date: new Date().toISOString().split('T')[0],
    condition: 'Thiết bị hoạt động hoàn hảo, nguyên tem bảo hành, đầy đủ sạc và phụ kiện',
    notes: ''
  });

  const formatVND = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const handleExportContracts = () => {
    if (licenseInfo?.isDemo) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Tính năng Xuất Báo Cáo Hợp Đồng Excel chỉ có trên gói Enterprise!');
      }
      return;
    }
    const exportData = contracts.map((c) => ({
      'Số hợp đồng': c.code,
      'Tên hợp đồng': c.title,
      'Đối tác / Khách hàng': c.partner_name,
      'Giá trị (VNĐ)': c.value,
      'Ngày bắt đầu': c.start_date,
      'Ngày kết thúc': c.end_date,
      'Trạng thái': c.status === 'ACTIVE' ? 'Hiệu lực' : c.status,
      'Ghi chú': c.notes || ''
    }));
    exportToExcel(exportData, 'Danh_Sach_Hop_Dong', 'Hợp Đồng');
  };

  const handleExportHandovers = () => {
    if (licenseInfo?.isDemo) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Tính năng Xuất Báo Cáo Biên Bản Bàn Giao Excel chỉ có trên gói Enterprise!');
      }
      return;
    }
    const exportData = handovers.map((h) => ({
      'Số biên bản': h.code,
      'Loại': h.type === 'HANDOVER' ? 'Bàn giao sử dụng' : 'Thu hồi',
      'Tài sản bàn giao': h.asset_name,
      'Mã tài sản': h.asset_code,
      'Người nhận': h.user_name,
      'Phòng ban': h.user_department,
      'Ngày bàn giao': h.handover_date,
      'Hiện trạng': h.condition,
      'Ghi chú': h.notes || ''
    }));
    exportToExcel(exportData, 'Danh_Sach_Bien_Ban_Ban_Giao', 'Biên Bản');
  };

  const handleOpenContractModal = () => {
    if (licenseInfo?.isDemo && contracts.length >= 3) {
      if (onOpenUpgrade) {
        onOpenUpgrade('Phiên bản Dùng Thử (Demo) giới hạn tối đa 3 hợp đồng. Quý khách vui lòng kích hoạt Bản Quyền Enterprise để quản lý không giới hạn!');
      }
      return;
    }
    setIsContractModalOpen(true);
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await api.createContract(contractForm);
      setIsContractModalOpen(false);
      setContractForm({
        title: '',
        type: 'PARTNER',
        partner_name: '',
        value: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.code === 'LICENSE_LIMIT_REACHED' && onOpenUpgrade) {
        onOpenUpgrade(err.message);
        return;
      }
      alert(err.message || 'Lỗi thêm hợp đồng');
    }
  };

  const handleCreateHandover = async (e) => {
    e.preventDefault();
    try {
      await api.createHandover(handoverForm);
      setIsHandoverModalOpen(false);
      setHandoverForm({
        asset_id: '',
        user_id: '',
        type: 'HANDOVER',
        handover_date: new Date().toISOString().split('T')[0],
        condition: 'Thiết bị hoạt động hoàn hảo, nguyên tem bảo hành, đầy đủ sạc và phụ kiện',
        notes: ''
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi tạo biên bản');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Hợp Đồng & Biên Bản Bàn Giao
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-slate-500">
              Lưu trữ hợp đồng đối tác, văn bản thỏa thuận ({contracts.length} hợp đồng) và in ấn biên bản bàn giao.
            </p>
            {licenseInfo?.isDemo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                Demo: {contracts.length}/3 hợp đồng
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={activeSubTab === 'CONTRACTS' ? handleExportContracts : handleExportHandovers}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet size={16} className="text-pastel-600" />
            <span>Xuất Excel</span>
            {licenseInfo?.isDemo && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-bold">Khóa</span>
            )}
          </button>

          {activeSubTab === 'CONTRACTS' ? (
            <button
              onClick={handleOpenContractModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Plus size={16} />
              <span>Thêm Hợp Đồng</span>
            </button>
          ) : (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Plus size={16} />
              <span>Lập Biên Bản Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-3">
        <button
          onClick={() => setActiveSubTab('CONTRACTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubTab === 'CONTRACTS'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'text-slate-600 hover:bg-pastel-50 hover:text-pastel-700'
          }`}
        >
          <FileText size={15} />
          <span>Danh Sách Hợp Đồng ({contracts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('HANDOVERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubTab === 'HANDOVERS'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'text-slate-600 hover:bg-pastel-50 hover:text-pastel-700'
          }`}
        >
          <FileCheck size={15} />
          <span>Biên Bản Bàn Giao Thiết Bị ({handovers.length})</span>
        </button>
      </div>

      {/* Tab 1: Contracts Table */}
      {activeSubTab === 'CONTRACTS' && (
        <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Số Hợp Đồng</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Tên Hợp Đồng</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Đối Tác</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Giá Trị</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Thời Hạn</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-bold">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Chưa có hợp đồng nào được lưu trữ.
                    </td>
                  </tr>
                ) : (
                  contracts.map((ctr) => (
                    <tr key={ctr.id} className="hover:bg-pastel-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">{ctr.code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{ctr.title}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">{ctr.partner_name}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">{formatVND(ctr.value)}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {ctr.start_date} → {ctr.end_date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={ctr.status === 'ACTIVE' ? 'success' : 'default'}>
                          {ctr.status === 'ACTIVE' ? 'Hiệu lực' : ctr.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{ctr.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Handovers Table */}
      {activeSubTab === 'HANDOVERS' && (
        <div className="bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Số Biên Bản</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Loại Biên Bản</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Thiết Bị Bàn Giao</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Nhân Sự Tiếp Nhận</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Ngày Bàn Giao</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Tình Trạng</th>
                  <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">In Ấn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {handovers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Chưa có biên bản bàn giao nào.
                    </td>
                  </tr>
                ) : (
                  handovers.map((item) => (
                    <tr key={item.id} className="hover:bg-pastel-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">{item.code}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={item.type === 'HANDOVER' ? 'primary' : 'warning'}>
                          {item.type === 'HANDOVER' ? 'Bàn giao sử dụng' : 'Thu hồi tài sản'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {item.asset_name}
                        {item.asset_code && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            Mã: {item.asset_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {item.user_name} <span className="text-slate-400 font-normal">({item.user_department})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{item.handover_date}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{item.condition}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setPreviewHandover(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pastel-50 text-pastel-700 hover:bg-pastel-100 font-bold transition-all text-xs"
                        >
                          <Printer size={13} />
                          <span>Xem & In Biên Bản</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Thêm Hợp Đồng Mới */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Tạo Hồ Sơ Hợp Đồng Mới"
      >
        <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hợp đồng *</label>
            <input
              type="text"
              required
              placeholder="VD: Hợp đồng cung cấp giải pháp chuyển đổi số"
              value={contractForm.title}
              onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đối tác / Khách hàng *</label>
              <input
                type="text"
                required
                placeholder="VD: Công ty TNHH Giải Pháp Alpha"
                value={contractForm.partner_name}
                onChange={(e) => setContractForm({ ...contractForm, partner_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá trị hợp đồng (VNĐ)</label>
              <input
                type="number"
                placeholder="VD: 150000000"
                value={contractForm.value}
                onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={contractForm.start_date}
                onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc (Hạn)</label>
              <input
                type="date"
                required
                value={contractForm.end_date}
                onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú điều khoản</label>
            <textarea
              rows={3}
              placeholder="Điều kiện thanh toán, cam kết tiến độ..."
              value={contractForm.notes}
              onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsContractModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>Lưu Hợp Đồng</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Lập Biên Bản Bàn Giao Mới */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Lập Biên Bản Bàn Giao / Thu Hồi Trang Thiết Bị"
      >
        <form onSubmit={handleCreateHandover} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn thiết bị bàn giao *</label>
            <select
              required
              value={handoverForm.asset_id}
              onChange={(e) => setHandoverForm({ ...handoverForm, asset_id: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
            >
              <option value="">-- Chọn tài sản / thiết bị --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.code}] {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nhân sự tiếp nhận *</label>
              <select
                required
                value={handoverForm.user_id}
                onChange={(e) => setHandoverForm({ ...handoverForm, user_id: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="">-- Chọn người nhận --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loại biên bản</label>
              <select
                value={handoverForm.type}
                onChange={(e) => setHandoverForm({ ...handoverForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none bg-white text-slate-800 font-medium"
              >
                <option value="HANDOVER">Bàn giao sử dụng</option>
                <option value="RETURN">Thu hồi tài sản về kho</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngày lập biên bản</label>
            <input
              type="date"
              required
              value={handoverForm.handover_date}
              onChange={(e) => setHandoverForm({ ...handoverForm, handover_date: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hiện trạng & Phụ kiện đi kèm</label>
            <textarea
              rows={2}
              value={handoverForm.condition}
              onChange={(e) => setHandoverForm({ ...handoverForm, condition: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-pastel-600 hover:bg-pastel-700 text-white font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <span>Hoàn Tất & Tạo Biên Bản</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem & In Biên Bản Bàn Giao Chuẩn Doanh Nghiệp A4 */}
      <Modal
        isOpen={Boolean(previewHandover)}
        onClose={() => setPreviewHandover(null)}
        title="Mẫu Biên Bản Bàn Giao Trang Thiết Bị (Chuẩn In Ấn)"
        maxWidth="max-w-2xl"
      >
        {previewHandover && (
          <div className="space-y-4">
            {/* Khung biên bản chuẩn văn bản A4 */}
            <div
              id="printable-handover"
              className="relative bg-white p-8 border border-slate-200 rounded-2xl shadow-xs text-slate-900 space-y-5 print:p-0 print:border-none print:shadow-none overflow-hidden"
            >
              {/* Watermark nếu ở chế độ Demo */}
              {licenseInfo?.isDemo && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-10 opacity-20">
                  <div className="transform -rotate-45 text-3xl sm:text-4xl font-black text-rose-700 uppercase tracking-widest border-4 border-dashed border-rose-700 p-6 rounded-3xl text-center">
                    BẢN DÙNG THỬ (DEMO)<br />
                    <span className="text-xs sm:text-sm font-bold tracking-normal text-rose-600">OMNIASSETS - VUI LÒNG MUA BẢN QUYỀN ĐỂ BỎ WATERMARK</span>
                  </div>
                </div>
              )}

              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center space-y-1">
                <p className="font-bold text-xs uppercase tracking-widest text-slate-800">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-xs font-semibold text-slate-700 underline underline-offset-4">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="pt-4">
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    BIÊN BẢN BÀN GIAO TRANG THIẾT BỊ LÀM VIỆC
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">Mã văn bản: {previewHandover.code}</p>
                </div>
              </div>

              {/* Nội dung chi tiết */}
              <div className="text-xs leading-relaxed space-y-3 pt-2 text-slate-800">
                <p>
                  Hôm nay, ngày <span className="font-bold">{previewHandover.handover_date}</span>, tại văn phòng công ty, chúng tôi gồm có:
                </p>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    I. ĐẠI DIỆN BÊN GIAO (BỘ PHẬN IT / QUẢN LÝ TÀI SẢN):
                  </p>
                  <p className="text-slate-700">
                    • Họ và tên: <strong>Nguyễn Văn An</strong> - Chức vụ: Quản trị hệ thống & Trang thiết bị
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    II. ĐẠI DIỆN BÊN NHẬN (NHÂN SỰ TIẾP NHẬN):
                  </p>
                  <p className="text-slate-700">• Họ và tên: <strong>{previewHandover.user_name}</strong></p>
                  <p className="text-slate-700">• Bộ phận công tác: <strong>{previewHandover.user_department}</strong></p>
                </div>

                <div className="pt-2">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">III. NỘI DUNG BÀN GIAO:</p>
                  <p className="mt-1 text-slate-700">
                    Bên Giao bàn giao cho Bên Nhận trang thiết bị phục vụ công tác chuyên môn theo bảng kê:
                  </p>
                  <div className="mt-2 p-3.5 bg-pastel-50/60 rounded-xl border border-pastel-200">
                    <ul className="space-y-1.5 pl-1">
                      <li>• Tên trang thiết bị: <strong className="text-slate-900">{previewHandover.asset_name}</strong></li>
                      <li>• Mã quản lý nội bộ: <strong className="font-mono text-pastel-800">{previewHandover.asset_code || 'TS-QC-2024'}</strong></li>
                      <li>• Tình trạng kỹ thuật: <span className="text-slate-700">{previewHandover.condition}</span></li>
                    </ul>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-2 leading-relaxed">
                  Bên Nhận cam kết sử dụng trang thiết bị đúng mục đích công việc, bảo quản cẩn thận, không tự ý chuyển nhượng và hoàn trả lại khi có quyết định điều chuyển hoặc chấm dứt hợp đồng lao động.
                </p>

                {/* Phần chữ ký đại diện */}
                <div className="grid grid-cols-2 gap-4 text-center pt-8 pb-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">ĐẠI DIỆN BÊN GIAO</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <p className="font-bold text-slate-800">Nguyễn Văn An</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">ĐẠI DIỆN BÊN NHẬN</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20 flex items-end justify-center">
                      <p className="font-bold text-slate-800">{previewHandover.user_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Action button */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPreviewHandover(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-2 transition-all"
              >
                <Printer size={15} />
                <span>In Biên Bản (Khổ A4)</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
