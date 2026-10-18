import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle2, AlertCircle, Key, Database, User, RefreshCw, ExternalLink } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { api } from '../../services/api';

export function CloudflareModal({ isOpen, onClose, onConnected }) {
  const [formData, setFormData] = useState({
    accountId: '',
    databaseId: '',
    apiToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.getCloudflareStatus();
      setCurrentStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.testCloudflare(formData);
      setStatusMessage({ type: 'success', text: res.message });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Kết nối thất bại. Vui lòng kiểm tra lại thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.saveCloudflare(formData);
      setStatusMessage({ type: 'success', text: res.message });
      await loadStatus();
      if (onConnected) onConnected();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi lưu cấu hình' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSchema = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await api.syncCloudflareSchema();
      setStatusMessage({ type: 'success', text: res.message });
      if (onConnected) onConnected();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi đồng bộ bảng lên Cloudflare D1' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Hình & Kết Nối Cloudflare D1 Database"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Banner trạng thái hiện tại */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          currentStatus?.isConfigured
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-pastel-50 border-pastel-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              currentStatus?.isConfigured ? 'bg-emerald-600 text-white' : 'bg-pastel-500 text-white'
            }`}>
              <Cloud size={18} />
            </div>
            <div>
              <p className="font-bold text-xs">
                {currentStatus?.isConfigured ? 'Đã Kết Nối Cloudflare D1 Edge' : 'Chưa Kết Nối Cloudflare (Đang dùng Local DB)'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Chế độ hiện tại: <span className="font-semibold">{currentStatus?.databaseMode}</span>
              </p>
            </div>
          </div>

          {currentStatus?.isConfigured && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
              Active
            </span>
          )}
        </div>

        {/* Hướng dẫn nhanh lấy thông tin từ Cloudflare */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <span>Cách lấy 3 thông số từ Cloudflare:</span>
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noreferrer"
              className="text-pastel-600 hover:underline inline-flex items-center gap-0.5 ml-1"
            >
              <span>Mở Cloudflare Dashboard</span>
              <ExternalLink size={11} />
            </a>
          </p>
          <p>1. <strong>Account ID</strong>: Đăng nhập Cloudflare, xem ở cột bên phải thanh URL hoặc mục Workers & Pages / Overview.</p>
          <p>2. <strong>Database ID</strong>: Vào <em>Workers & Pages</em> → <em>D1 SQL Database</em> → Tạo hoặc chọn Database → Copy <em>Database ID</em>.</p>
          <p>3. <strong>API Token</strong>: Vào <em>My Profile</em> → <em>API Tokens</em> → <em>Create Token</em> → Cấp quyền <em>Account - D1: Edit</em>.</p>
        </div>

        {/* Form nhập thông số */}
        <form onSubmit={handleSaveConfig} className="space-y-3.5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-pastel-600" />
              <span>Cloudflare Account ID *</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: a1b2c3d4e5f67890123456789abcdef0"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value.trim() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Database size={13} className="text-pastel-600" />
              <span>Cloudflare Database ID (D1 Database UUID) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: 12345678-abcd-ef01-2345-6789abcdef01"
              value={formData.databaseId}
              onChange={(e) => setFormData({ ...formData, databaseId: e.target.value.trim() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key size={13} className="text-pastel-600" />
              <span>Cloudflare API Token *</span>
            </label>
            <input
              type="password"
              required
              placeholder="Nhập Cloudflare API Token..."
              value={formData.apiToken}
              onChange={(e) => setFormData({ ...formData, apiToken: e.target.value.trim() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-pastel-400 outline-none"
            />
          </div>

          {/* Thông báo kết quả */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-xs leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={loading || !formData.accountId || !formData.databaseId || !formData.apiToken}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Đang test...' : 'Kiểm Tra Kết Nối'}
              </button>

              <button
                type="button"
                onClick={handleSyncSchema}
                disabled={syncing}
                className="px-3.5 py-2 rounded-xl bg-pastel-100 hover:bg-pastel-200 text-pastel-800 font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Tạo các bảng SQL và nạp dữ liệu ban đầu lên D1"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Đang khởi tạo...' : 'Tạo Bảng & Đồng Bộ Dữ Liệu'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold transition-all"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-pastel-500 hover:bg-pastel-600 text-white font-semibold shadow-soft transition-all"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
