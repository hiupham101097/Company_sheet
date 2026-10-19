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
  FileSpreadsheet,
  ScrollText,
  FilePlus,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../Common/Badge';
import { Modal } from '../Common/Modal';
import { exportToExcel } from '../../utils/exportExcel';
import { formatDateVN, formatDateRangeVN, formatMoneyVN } from '../../utils/formatters';
import { api } from '../../services/api';

const DEFAULT_TERMS = `ĐIỀU 1: ĐỐI TƯỢNG VÀ NỘI DUNG THỰC HIỆN
1.1. Bên B cam kết cung cấp sản phẩm/dịch vụ theo đúng yêu cầu kỹ thuật, tiêu chuẩn chất lượng và phạm vi thỏa thuận.
1.2. Bên A có trách nhiệm phối hợp, cung cấp tài liệu và điều kiện cần thiết để Bên B thực hiện nghĩa vụ.

ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN
2.1. Tổng giá trị hợp đồng được quy định tại mục Giá Trị Hợp Đồng (đã bao gồm các loại thuế và chi phí theo luật định).
2.2. Phương thức thanh toán: Chuyển khoản ngân hàng. Thanh toán chia làm các đợt theo thỏa thuận và biên bản nghiệm thu từng giai đoạn.

ĐIỀU 3: THỜI HẠN THỰC HIỆN VÀ NGHIỆM THU
3.1. Hợp đồng có hiệu lực kể từ ngày bắt đầu đến hết ngày kết thúc theo thỏa thuận.
3.2. Việc bàn giao kết quả thực hiện phải được lập thành Biên bản nghiệm thu có chữ ký của đại diện có thẩm quyền của hai bên.

ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN
4.1. Bên A có quyền yêu cầu Bên B thực hiện đúng tiến độ, chất lượng và đảm bảo tuyệt đối bảo mật thông tin.
4.2. Bên B có nghĩa vụ bảo hành, hỗ trợ kỹ thuật và bảo trì sản phẩm theo đúng cam kết trong hợp đồng.

ĐIỀU 5: ĐIỀU KHOẢN CHUNG VÀ GIẢI QUYẾT TRANH CHẤP
5.1. Hai bên cam kết thực hiện nghiêm túc mọi điều khoản đã thỏa thuận trong hợp đồng và các phụ lục đính kèm (nếu có).
5.2. Mọi tranh chấp phát sinh sẽ được giải quyết trước hết thông qua thương lượng hòa giải. Nếu không giải quyết được sẽ đưa ra Tòa án có thẩm quyền để giải quyết.`;

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
  const [previewContract, setPreviewContract] = useState(null);
  const [appendixContract, setAppendixContract] = useState(null);

  const [contractForm, setContractForm] = useState({
    title: '',
    type: 'PARTNER',
    partner_name: '',
    value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: DEFAULT_TERMS,
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

  const [appendixForm, setAppendixForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    adjustment_value: '0',
    content: ''
  });
  const [isSubmittingAppendix, setIsSubmittingAppendix] = useState(false);

  // Helper để lấy danh sách phụ lục của 1 hợp đồng
  const getAppendices = (ctr) => {
    if (!ctr) return [];
    try {
      if (typeof ctr.appendices === 'string') return JSON.parse(ctr.appendices);
      if (Array.isArray(ctr.appendices)) return ctr.appendices;
    } catch (_) {}
    return [];
  };

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
      'Giá trị (VNĐ)': formatMoneyVN(c.value, false),
      'Ngày bắt đầu': formatDateVN(c.start_date),
      'Ngày kết thúc': formatDateVN(c.end_date),
      'Số lượng phụ lục': getAppendices(c).length,
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
      'Ngày bàn giao': formatDateVN(h.handover_date),
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
        terms: DEFAULT_TERMS,
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

  const handleAddAppendix = async (e) => {
    e.preventDefault();
    if (!appendixContract) return;
    try {
      setIsSubmittingAppendix(true);
      const res = await api.addContractAppendix(appendixContract.id, appendixForm);
      alert(res.message || 'Đã thêm phụ lục hợp đồng thành công!');
      setAppendixForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        adjustment_value: '0',
        content: ''
      });
      setAppendixContract(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Lỗi thêm phụ lục hợp đồng');
    } finally {
      setIsSubmittingAppendix(false);
    }
  };

  const totalContractValue = contracts.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Quản Lý Hợp Đồng & Biên Bản Bàn Giao
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Lưu trữ hợp đồng đối tác, phụ lục bổ sung, điều khoản điều lệ và in ấn biên bản bàn giao trang thiết bị.
          </p>
        </div>

        {/* Action Buttons in Clean Grid on Mobile */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={activeSubTab === 'CONTRACTS' ? handleExportContracts : handleExportHandovers}
            className="justify-center inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet size={15} className="text-pastel-600" />
            <span>Xuất Excel</span>
          </button>

          {activeSubTab === 'CONTRACTS' ? (
            <button
              onClick={handleOpenContractModal}
              className="justify-center inline-flex items-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Thêm Hợp Đồng</span>
            </button>
          ) : (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="justify-center inline-flex items-center gap-2 px-4 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft hover:shadow-soft-lg transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Lập Biên Bản Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-pastel-200/80 pb-3">
        <button
          onClick={() => setActiveSubTab('CONTRACTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeSubTab === 'HANDOVERS'
              ? 'bg-pastel-500 text-white shadow-soft'
              : 'text-slate-600 hover:bg-pastel-50'
          }`}
        >
          <FileCheck size={15} />
          <span>Biên Bản Bàn Giao Thiết Bị ({handovers.length})</span>
        </button>
      </div>

      {/* Tab 1: Contracts */}
      {activeSubTab === 'CONTRACTS' && (
        <div className="space-y-4">
          {/* Contracts Overview Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pastel-50 via-white to-pastel-50/50 border border-pastel-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Giá Trị Hợp Đồng Đang Quản Lý</p>
              <h3 className="text-xl sm:text-2xl font-black text-pastel-700 tracking-tight mt-0.5">
                {formatMoneyVN(totalContractValue)}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-pastel-200 font-bold text-slate-700">
                {contracts.length} hồ sơ hợp đồng
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-700">
                {contracts.filter(c => c.status === 'ACTIVE').length} đang hiệu lực
              </span>
            </div>
          </div>

          {/* Mobile View: Clean Responsive Cards */}
          <div className="block md:hidden space-y-3">
            {contracts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-pastel-200/80 shadow-xs text-xs">
                Chưa có hợp đồng nào được lưu trữ.
              </div>
            ) : (
              contracts.map((ctr) => {
                const appendices = getAppendices(ctr);
                return (
                  <div key={ctr.id} className="bg-white p-4 rounded-2xl border border-pastel-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-pastel-700 bg-pastel-50 px-2.5 py-0.5 rounded-md border border-pastel-200/70">
                        {ctr.code}
                      </span>
                      <Badge variant={ctr.status === 'ACTIVE' ? 'success' : 'default'}>
                        {ctr.status === 'ACTIVE' ? 'Hiệu lực' : ctr.status}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 leading-snug">
                      {ctr.title}
                    </h4>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Đối tác:</span>
                        <span className="font-semibold text-slate-800 text-right">{ctr.partner_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Giá trị:</span>
                        <span className="font-black text-pastel-700 text-sm">{formatMoneyVN(ctr.value)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Thời hạn:</span>
                        <span className="font-mono text-[11px] text-slate-700 font-medium">
                          {formatDateRangeVN(ctr.start_date, ctr.end_date)}
                        </span>
                      </div>
                      {appendices.length > 0 && (
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-slate-400 text-[11px]">Phụ lục:</span>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                            {appendices.length} phụ lục đính kèm
                          </span>
                        </div>
                      )}
                      {ctr.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-dashed border-slate-100">
                          {ctr.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons on card */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => setPreviewContract(ctr)}
                        className="justify-center inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 font-bold text-xs transition-all active:scale-95"
                      >
                        <Eye size={14} />
                        <span>Xem PDF (A4)</span>
                      </button>

                      <button
                        onClick={() => setAppendixContract(ctr)}
                        className="justify-center inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95"
                      >
                        <ScrollText size={14} />
                        <span>Phụ Lục ({appendices.length})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop View: Full Table with forced horizontal scroll */}
          <div className="hidden md:block bg-white rounded-3xl border border-pastel-200/80 shadow-soft overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600" style={{ minWidth: '920px' }}>
                <thead className="bg-pastel-50/70 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-pastel-100">
                  <tr>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Số Hợp Đồng</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap" style={{ minWidth: '220px' }}>Tên Hợp Đồng</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Đối Tác</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Giá Trị</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Thời Hạn (dd/MM/yyyy)</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Phụ Lục</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Trạng Thái</th>
                    <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Chưa có hợp đồng nào được lưu trữ.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((ctr) => {
                      const appendices = getAppendices(ctr);
                      return (
                        <tr key={ctr.id} className="hover:bg-pastel-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-pastel-700 whitespace-nowrap">{ctr.code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800" style={{ minWidth: '220px' }}>
                            <div>{ctr.title}</div>
                            {ctr.notes && <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{ctr.notes}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">{ctr.partner_name}</td>
                          <td className="py-3.5 px-4 font-black text-pastel-700 whitespace-nowrap">{formatMoneyVN(ctr.value)}</td>
                          <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                            {formatDateRangeVN(ctr.start_date, ctr.end_date)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => setAppendixContract(ctr)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                appendices.length > 0
                                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              <ScrollText size={13} />
                              <span>{appendices.length > 0 ? `${appendices.length} phụ lục` : '+ Thêm'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant={ctr.status === 'ACTIVE' ? 'success' : 'default'}>
                              {ctr.status === 'ACTIVE' ? 'Hiệu lực' : ctr.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setPreviewContract(ctr)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 font-bold text-xs transition-all shadow-2xs"
                              title="Xem văn bản hợp đồng chuẩn PDF A4"
                            >
                              <FileText size={13} />
                              <span>Xem PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Handovers */}
      {activeSubTab === 'HANDOVERS' && (
        <div className="space-y-3">
          {/* Mobile View: Handovers Cards */}
          <div className="block md:hidden space-y-3">
            {handovers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-pastel-200/80 shadow-xs text-xs">
                Chưa có biên bản bàn giao nào.
              </div>
            ) : (
              handovers.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-pastel-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-pastel-700 bg-pastel-50 px-2.5 py-0.5 rounded-md border border-pastel-200/70">
                      {item.code}
                    </span>
                    <Badge variant={item.type === 'HANDOVER' ? 'primary' : 'warning'}>
                      {item.type === 'HANDOVER' ? 'Bàn giao sử dụng' : 'Thu hồi tài sản'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.asset_name}</h4>
                    {item.asset_code && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Mã thiết bị: {item.asset_code}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Người nhận:</span>
                      <span className="font-bold text-slate-800">{item.user_name} ({item.user_department})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Ngày lập:</span>
                      <span className="font-mono text-[11px] text-slate-700">{formatDateVN(item.handover_date)}</span>
                    </div>
                    <div className="flex justify-between items-start pt-0.5">
                      <span className="text-slate-400 text-[11px] shrink-0">Hiện trạng:</span>
                      <span className="text-slate-700 text-right text-[11px] pl-2">{item.condition}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewHandover(item)}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Printer size={14} />
                    <span>In Biên Bản A4</span>
                  </button>
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
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Mã Biên Bản</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Loại Nghiệp Vụ</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap" style={{ minWidth: '180px' }}>Trang Thiết Bị</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Nhân Sự Bàn Giao</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">Ngày Lập</th>
                    <th className="py-3.5 px-4 font-bold">Hiện Trạng Bàn Giao</th>
                    <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Thao Tác</th>
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
                        <td className="py-3.5 px-4 whitespace-nowrap" style={{ minWidth: '180px' }}>
                          <span className="font-bold text-slate-800">{item.asset_name}</span>
                          {item.asset_code && (
                            <span className="text-[10px] text-slate-400 block font-mono">{item.asset_code}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{item.user_name}</span>
                          <span className="text-[11px] text-slate-400 block">{item.user_department}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {formatDateVN(item.handover_date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{item.condition}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setPreviewHandover(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 font-bold text-xs transition-all shadow-xs"
                          >
                            <Printer size={13} />
                            <span>In Biên Bản</span>
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
      )}

      {/* Modal: Tạo Hợp Đồng Mới (Có chỗ nhập Điều khoản & Điều lệ) */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Tạo Hồ Sơ Hợp Đồng Mới (Kèm Điều Khoản & Điều Lệ)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên hợp đồng *</label>
            <input
              type="text"
              required
              placeholder="VD: Hợp đồng cung cấp giải pháp chuyển đổi số & quản trị tài sản"
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
                placeholder="VD: Công ty Cổ phần Công nghệ Alpha"
                value={contractForm.partner_name}
                onChange={(e) => setContractForm({ ...contractForm, partner_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá trị hợp đồng (VNĐ) *</label>
              <input
                type="number"
                required
                placeholder="VD: 150000000"
                value={contractForm.value}
                onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-semibold"
              />
              {contractForm.value && (
                <p className="text-[11px] text-pastel-700 font-bold mt-1">
                  Định dạng chuẩn: {formatMoneyVN(contractForm.value)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu hiệu lực</label>
              <input
                type="date"
                required
                value={contractForm.start_date}
                onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc (Hạn hợp đồng)</label>
              <input
                type="date"
                required
                value={contractForm.end_date}
                onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Section: Nhập Điều Khoản & Điều Lệ Hợp Đồng */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Các Điều Khoản & Điều Lệ Hợp Đồng *
              </label>
              <button
                type="button"
                onClick={() => setContractForm({ ...contractForm, terms: DEFAULT_TERMS })}
                className="text-[11px] font-bold text-pastel-700 hover:text-pastel-800 underline"
              >
                Nạp lại mẫu chuẩn
              </button>
            </div>
            <textarea
              rows={8}
              required
              value={contractForm.terms}
              onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
              placeholder="Nhập chi tiết các Điều khoản, Điều lệ, quyền và trách nhiệm của các bên..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono text-[11px] leading-relaxed bg-slate-50/50"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * Điều khoản này sẽ được hiển thị đầy đủ và trang trọng khi xem hoặc in văn bản hợp đồng A4 (PDF).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú bổ sung (nếu có)</label>
            <input
              type="text"
              placeholder="Tiến độ thanh toán, lưu ý bảo hành..."
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
              <Plus size={15} />
              <span>Lưu Hợp Đồng</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quản Lý Phụ Lục Hợp Đồng */}
      <Modal
        isOpen={Boolean(appendixContract)}
        onClose={() => setAppendixContract(null)}
        title={`Quản Lý Phụ Lục Hợp Đồng - ${appendixContract?.code || ''}`}
        maxWidth="max-w-2xl"
      >
        {appendixContract && (
          <div className="space-y-5 text-xs">
            {/* Header thông tin hợp đồng gốc */}
            <div className="p-3.5 bg-pastel-50/70 rounded-2xl border border-pastel-200/80 space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">{appendixContract.title}</h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs">
                <span>Đối tác: <strong>{appendixContract.partner_name}</strong></span>
                <span>Giá trị gốc: <strong className="text-pastel-700">{formatMoneyVN(appendixContract.value)}</strong></span>
                <span>Thời hạn: <strong className="font-mono">{formatDateRangeVN(appendixContract.start_date, appendixContract.end_date)}</strong></span>
              </div>
            </div>

            {/* Danh sách phụ lục hiện có */}
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <ScrollText size={14} className="text-pastel-600" />
                <span>Danh Sách Phụ Lục Đã Ký Kết ({getAppendices(appendixContract).length})</span>
              </h5>

              {getAppendices(appendixContract).length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200/60">
                  Hợp đồng này chưa có phụ lục bổ sung nào. Hãy thêm phụ lục mới bên dưới.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {getAppendices(appendixContract).map((app, index) => (
                    <div key={app.id || index} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-pastel-700 bg-pastel-100/70 px-2 py-0.5 rounded text-[11px]">
                          {app.code}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{formatDateVN(app.date)}</span>
                      </div>
                      <h6 className="font-bold text-slate-800 text-xs">{app.title}</h6>
                      {Number(app.adjustment_value) !== 0 && (
                        <p className="text-[11px] text-indigo-700 font-semibold">
                          Giá trị điều chỉnh: {Number(app.adjustment_value) > 0 ? '+' : ''}{formatMoneyVN(app.adjustment_value)}
                        </p>
                      )}
                      {app.content && (
                        <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2 rounded-lg whitespace-pre-wrap">
                          {app.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Thêm Phụ Lục Mới */}
            <form onSubmit={handleAddAppendix} className="pt-3 border-t border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FilePlus size={14} className="text-pastel-600" />
                <span>Ký Kết Thêm Phụ Lục Bổ Sung Mới</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên phụ lục hợp đồng *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phụ lục 01: Gia hạn thời gian & nâng cấp gói dịch vụ"
                    value={appendixForm.title}
                    onChange={(e) => setAppendixForm({ ...appendixForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ký kết phụ lục</label>
                  <input
                    type="date"
                    required
                    value={appendixForm.date}
                    onChange={(e) => setAppendixForm({ ...appendixForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giá trị điều chỉnh (nếu có tăng/giảm chi phí - VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="VD: 25000000 (nhập 0 nếu không thay đổi giá trị)"
                  value={appendixForm.adjustment_value}
                  onChange={(e) => setAppendixForm({ ...appendixForm, adjustment_value: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung thỏa thuận phụ lục *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ nội dung điều chỉnh (gia hạn đến ngày nào, bổ sung hạng mục công việc gì...)"
                  value={appendixForm.content}
                  onChange={(e) => setAppendixForm({ ...appendixForm, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAppendixContract(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppendix}
                  className="px-5 py-2 bg-pastel-600 hover:bg-pastel-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isSubmittingAppendix ? 'Đang lưu...' : 'Thêm Phụ Lục'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal: Xem Dạng PDF (A4) Chuẩn Văn Bản Hợp Đồng Doanh Nghiệp */}
      <Modal
        isOpen={Boolean(previewContract)}
        onClose={() => setPreviewContract(null)}
        title="Xem Văn Bản Hợp Đồng (Chuẩn In Ấn & Xuất PDF Khổ A4)"
        maxWidth="max-w-3xl"
      >
        {previewContract && (
          <div className="space-y-4">
            {/* Vùng văn bản in A4 */}
            <div
              id="printable-contract"
              className="relative bg-white p-8 sm:p-10 border border-slate-200 rounded-2xl shadow-xs text-slate-900 space-y-6 print:p-0 print:border-none print:shadow-none overflow-hidden"
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
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 uppercase tracking-tight">
                    HỢP ĐỒNG KINH TẾ & CUNG CẤP DỊCH VỤ
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Số: <strong>{previewContract.code}</strong> • Ngày lập: {formatDateVN(previewContract.start_date)}
                  </p>
                </div>
              </div>

              {/* Căn cứ pháp lý */}
              <div className="text-slate-600 text-[11px] italic leading-relaxed space-y-1">
                <p>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội ban hành ngày 24/11/2015;</p>
                <p>- Căn cứ Luật Thương mại số 36/2005/QH11 được Quốc hội ban hành ngày 14/06/2005;</p>
                <p>- Căn cứ nhu cầu và khả năng thực tế của hai bên.</p>
              </div>

              {/* Thông tin Bên A & Bên B */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    BÊN A (BÊN SỬ DỤNG DỊCH VỤ / KHÁCH HÀNG):
                  </p>
                  <p className="text-slate-700">• Tên đơn vị: <strong>{previewContract.partner_name}</strong></p>
                  <p className="text-slate-700">• Đại diện: Ông/Bà Giám đốc đại diện</p>
                  <p className="text-slate-700">• Địa chỉ: Trụ sở đối tác</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase text-[11px]">
                    BÊN B (BÊN CUNG CẤP DỊCH VỤ / ĐƠN VỊ THỰC HIỆN):
                  </p>
                  <p className="text-slate-700">• Tên đơn vị: <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ OMNI ASSETS</strong></p>
                  <p className="text-slate-700">• Đại diện: Ông Nguyễn Văn An - Giám đốc điều hành</p>
                  <p className="text-slate-700">• Địa chỉ: Tòa nhà Công Nghệ, TP. Hà Nội</p>
                </div>
              </div>

              {/* Tóm tắt giá trị & thời hạn */}
              <div className="p-3.5 bg-pastel-50/60 rounded-xl border border-pastel-200 text-xs space-y-1">
                <p className="font-bold text-slate-900 uppercase text-[11px]">NỘI DUNG VÀ GIÁ TRỊ HỢP ĐỒNG:</p>
                <p className="text-slate-700">• Tên gói hợp đồng: <strong className="text-slate-900">{previewContract.title}</strong></p>
                <p className="text-slate-700">
                  • Tổng giá trị hợp đồng: <strong className="text-pastel-800 text-sm">{formatMoneyVN(previewContract.value)}</strong>
                </p>
                <p className="text-slate-700">
                  • Thời hạn thực hiện: <strong className="font-mono">{formatDateRangeVN(previewContract.start_date, previewContract.end_date)}</strong>
                </p>
              </div>

              {/* Các điều khoản và điều lệ hợp đồng */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1">
                  CÁC ĐIỀU KHOẢN VÀ ĐIỀU LỆ HỢP ĐỒNG:
                </p>
                <div className="text-slate-700 leading-relaxed font-sans text-xs whitespace-pre-wrap pl-1">
                  {previewContract.terms || DEFAULT_TERMS}
                </div>
              </div>

              {/* Phụ lục hợp đồng đính kèm */}
              <div className="space-y-2 text-xs pt-2">
                <p className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 flex items-center justify-between">
                  <span>PHỤ LỤC HỢP ĐỒNG ĐÍNH KÈM:</span>
                  <span className="font-normal text-[11px] text-slate-500">
                    ({getAppendices(previewContract).length} phụ lục)
                  </span>
                </p>

                {getAppendices(previewContract).length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Hợp đồng chưa có phụ lục bổ sung.</p>
                ) : (
                  <div className="space-y-2">
                    {getAppendices(previewContract).map((pl, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <strong className="font-mono text-pastel-700">{pl.code}</strong>
                          <span className="font-mono text-slate-500">{formatDateVN(pl.date)}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs">{pl.title}</p>
                        {Number(pl.adjustment_value) !== 0 && (
                          <p className="text-[11px] text-indigo-700 font-semibold">
                            Giá trị điều chỉnh: {Number(pl.adjustment_value) > 0 ? '+' : ''}{formatMoneyVN(pl.adjustment_value)}
                          </p>
                        )}
                        <p className="text-slate-600 text-[11px] whitespace-pre-wrap">{pl.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phần chữ ký đại diện */}
              <div className="grid grid-cols-2 gap-6 text-center pt-8 pb-4">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs uppercase">ĐẠI DIỆN BÊN A</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</p>
                  <div className="h-24 flex items-end justify-center">
                    <p className="font-bold text-slate-800 text-xs">{previewContract.partner_name}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs uppercase">ĐẠI DIỆN BÊN B</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</p>
                  <div className="h-24 flex items-end justify-center">
                    <p className="font-bold text-slate-800 text-xs">Nguyễn Văn An</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPreviewContract(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-2 transition-all active:scale-95"
              >
                <Printer size={15} />
                <span>In Hợp Đồng / Xuất PDF (Khổ A4)</span>
              </button>
            </div>
          </div>
        )}
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hiện trạng trang thiết bị khi bàn giao</label>
            <textarea
              rows={2}
              required
              value={handoverForm.condition}
              onChange={(e) => setHandoverForm({ ...handoverForm, condition: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-400 outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú bổ sung</label>
            <input
              type="text"
              placeholder="VD: Bàn giao kèm chuột không dây, túi chống sốc..."
              value={handoverForm.notes}
              onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
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
              <Plus size={15} />
              <span>Tạo Biên Bản</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem & In Biên Bản Bàn Giao Chuẩn Doanh Nghiệp A4 */}
      <Modal
        isOpen={Boolean(previewHandover)}
        onClose={() => setPreviewHandover(null)}
        title="Mẫu Biên Bản Bàn Giao Trang Thiết Bị (Chuẩn In Ấn Khổ A4)"
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
                  Hôm nay, ngày <span className="font-bold">{formatDateVN(previewHandover.handover_date)}</span>, tại văn phòng công ty, chúng tôi gồm có:
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
                className="px-5 py-2.5 bg-pastel-500 hover:bg-pastel-600 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-2 transition-all active:scale-95"
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
