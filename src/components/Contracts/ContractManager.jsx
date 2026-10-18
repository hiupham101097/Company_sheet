import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';

export function ContractManager({ contracts = [], handovers = [], assets = [], users = [], onRefresh }) {
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
          <p className="text-sm text-slate-500">
            Lưu trữ hợp đồng đối tác, văn bản thỏa thuận và in ấn biên bản bàn giao trang thiết bị.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeSubTab === 'CONTRACTS' ? (
            <button
              onClick={() => setIsContractModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Plus size={16} />
              <span>Thêm Hợp Đồng</span>
            </button>
          ) : (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Plus size={16} />
              <span>Lập Biên Bản Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-pastel-200/70 pb-3">
        <button
          onClick={() => setActiveSubTab('CONTRACTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'CONTRACTS'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'text-slate-600 hover:bg-pastel-50'
          }`}
        >
          <FileText size={15} />
          <span>Danh Sách Hợp Đồng ({contracts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('HANDOVERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'HANDOVERS'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'text-slate-600 hover:bg-pastel-50'
          }`}
        >
          <FileCheck size={15} />
          <span>Biên Bản Bàn Giao Thiết Bị ({handovers.length})</span>
        </button>
      </div>

      {/* Content for Contracts */}
      {activeSubTab === 'CONTRACTS' ? (
        <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-pastel-50/60 text-slate-700 font-semibold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3 px-4">Số Hợp Đồng</th>
                  <th className="py-3 px-4">Tên Hợp Đồng</th>
                  <th className="py-3 px-4">Đối Tác</th>
                  <th className="py-3 px-4">Giá Trị</th>
                  <th className="py-3 px-4">Thời Hạn</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contracts.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-pastel-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-pastel-700">{ctr.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{ctr.title}</td>
                    <td className="py-3 px-4 text-slate-700">{ctr.partner_name}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{formatVND(ctr.value)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {ctr.start_date} → {ctr.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ctr.status === 'ACTIVE' ? 'success' : 'default'}>
                        {ctr.status === 'ACTIVE' ? 'Hiệu lực' : ctr.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{ctr.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Content for Handover Protocols */
        <div className="bg-white rounded-2xl border border-pastel-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-pastel-50/60 text-slate-700 font-semibold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                <tr>
                  <th className="py-3 px-4">Số Biên Bản</th>
                  <th className="py-3 px-4">Loại Biên Bản</th>
                  <th className="py-3 px-4">Thiết Bị Bàn Giao</th>
                  <th className="py-3 px-4">Nhân Sự Tiếp Nhận</th>
                  <th className="py-3 px-4">Ngày Bàn Giao</th>
                  <th className="py-3 px-4">Tình Trạng</th>
                  <th className="py-3 px-4 text-right">In / Mẫu Ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-pastel-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-pastel-700">{h.code}</td>
                    <td className="py-3 px-4">
                      <Badge variant={h.type === 'HANDOVER' ? 'primary' : 'warning'}>
                        {h.type === 'HANDOVER' ? 'Bàn giao sử dụng' : 'Thu hồi tài sản'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {h.asset_name}
                      {h.asset_code && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Mã: {h.asset_code}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {h.user_name} ({h.user_department})
                    </td>
                    <td className="py-3 px-4 text-slate-500">{h.handover_date}</td>
                    <td className="py-3 px-4 text-slate-600">{h.condition}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewHandover(h)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pastel-50 text-pastel-700 hover:bg-pastel-100 font-semibold transition-all text-xs"
                      >
                        <Printer size={13} />
                        <span>Xem & In Biên Bản</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Thêm Hợp Đồng */}
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đối tác / Khách hàng *</label>
              <input
                type="text"
                required
                placeholder="VD: Công ty TNHH Giải Pháp Alpha"
                value={contractForm.partner_name}
                onChange={(e) => setContractForm({ ...contractForm, partner_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá trị hợp đồng (VNĐ)</label>
              <input
                type="number"
                placeholder="VD: 150000000"
                value={contractForm.value}
                onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={contractForm.start_date}
                onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc (Hạn)</label>
              <input
                type="date"
                required
                value={contractForm.end_date}
                onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsContractModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-pastel-500 hover:bg-pastel-600 text-white font-semibold shadow-soft transition-all"
            >
              Lưu Hợp Đồng
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Lập Biên Bản Bàn Giao */}
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            >
              <option value="">-- Chọn tài sản / thiết bị --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.code}] {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nhân sự tiếp nhận *</label>
              <select
                required
                value={handoverForm.user_id}
                onChange={(e) => setHandoverForm({ ...handoverForm, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hiện trạng & Phụ kiện đi kèm</label>
            <textarea
              rows={2}
              value={handoverForm.condition}
              onChange={(e) => setHandoverForm({ ...handoverForm, condition: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-pastel-500 hover:bg-pastel-600 text-white font-semibold shadow-soft transition-all"
            >
              Hoàn Tất & Tạo Biên Bản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem & In Biên Bản Bàn Giao Chuẩn Doanh Nghiệp */}
      <Modal
        isOpen={Boolean(previewHandover)}
        onClose={() => setPreviewHandover(null)}
        title="Mẫu Biên Bản Bàn Giao Trang Thiết Bị (Chuẩn In Ấn)"
        maxWidth="max-w-2xl"
      >
        {previewHandover && (
          <div className="space-y-4">
            {/* Khung biên bản chuẩn văn bản */}
            <div
              id="printable-handover"
              className="bg-white p-6 border border-slate-300 rounded-xl shadow-xs text-slate-800 space-y-4 print:p-0 print:border-none"
            >
              <div className="text-center space-y-1">
                <p className="font-bold text-xs uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="text-xs font-semibold underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                <h3 className="text-base font-bold text-slate-900 pt-4 uppercase">
                  BIÊN BẢN BÀN GIAO TRANG THIẾT BỊ LÀM VIỆC
                </h3>
                <p className="text-[11px] font-mono text-slate-500">Mã văn bản: {previewHandover.code}</p>
              </div>

              <div className="text-xs leading-relaxed space-y-2 pt-2">
                <p>
                  Hôm nay, ngày <span className="font-semibold">{previewHandover.handover_date}</span>, tại văn phòng công ty, chúng tôi gồm có:
                </p>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="font-bold text-slate-700">I. ĐẠI DIỆN BÊN GIAO (BỘ PHẬN IT / QUẢN LÝ TÀI SẢN):</p>
                  <p>• Họ và tên: <strong>Nguyễn Văn An</strong> - Chức vụ: Quản trị hệ thống</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="font-bold text-slate-700">II. ĐẠI DIỆN BÊN NHẬN (NHÂN SỰ TIẾP NHẬN):</p>
                  <p>• Họ và tên: <strong>{previewHandover.user_name}</strong></p>
                  <p>• Bộ phận: <strong>{previewHandover.user_department}</strong></p>
                </div>

                <div className="pt-2">
                  <p className="font-bold text-slate-700">III. NỘI DUNG BÀN GIAO:</p>
                  <p className="mt-1">
                    Bên Giao bàn giao cho Bên Nhận trang thiết bị phục vụ công tác chuyên môn:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
                    <li>Tên trang thiết bị: <strong>{previewHandover.asset_name}</strong></li>
                    <li>Mã quản lý: <strong>{previewHandover.asset_code || 'TS-QC-2024'}</strong></li>
                    <li>Tình trạng kỹ thuật: {previewHandover.condition}</li>
                  </ul>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-2">
                  Bên Nhận cam kết sử dụng trang thiết bị đúng mục đích, bảo quản cẩn thận và bàn giao lại khi có yêu cầu hoặc khi chấm dứt hợp đồng lao động.
                </p>

                {/* Chữ ký 2 bên */}
                <div className="grid grid-cols-2 gap-4 text-center pt-8 pb-4">
                  <div>
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN GIAO</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-semibold text-slate-700">Nguyễn Văn An</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN NHẬN</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-semibold text-slate-700">{previewHandover.user_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Print */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-semibold shadow-soft flex items-center gap-2 transition-all"
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
