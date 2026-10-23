import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AssetManager } from './components/Assets/AssetManager';
import { FinanceManager } from './components/Finance/FinanceManager';
import { TaskManager } from './components/Tasks/TaskManager';
import { ContractManager } from './components/Contracts/ContractManager';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { UserManager } from './components/Users/UserManager';
import { CategoryManager } from './components/Categories/CategoryManager';
import { SettingsManager } from './components/Settings/SettingsManager';
import { AIAssistantWidget } from './components/AI/AIAssistantWidget';
import { UpgradeModal } from './components/License/UpgradeModal';
import { Login } from './components/Auth/Login';
import { SuperAdminPortal } from './components/SuperAdmin/SuperAdminPortal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { getTabFromPath, syncTabToUrlAndSeo } from './utils/seoRoutes';
import { getBrandDisplayName } from './utils/brandHelper';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      const u = saved ? JSON.parse(saved) : null;
      if (u && (u.email?.toLowerCase() === 'adminmanager@gmail.com' || u.role === 'SUPER_ADMIN')) {
        u.role = 'SUPER_ADMIN';
        u.company_id = 'SYSTEM';
        u.company_name = 'Hệ Thống Quản Trị Nền Tảng (Master)';
      }
      return u;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      const u = saved ? JSON.parse(saved) : null;
      const isSuper = u && (u.email?.toLowerCase() === 'adminmanager@gmail.com' || u.role === 'SUPER_ADMIN');
      if (isSuper) {
        const fromPath = getTabFromPath(window.location.pathname, 'SUPER_ADMIN');
        return ['overview', 'companies', 'keys', 'plans', 'support-desk', 'announcements', 'revenue', 'settings'].includes(fromPath) ? fromPath : 'overview';
      }

      return getTabFromPath(window.location.pathname, u?.role);
    } catch {
      return 'dashboard';
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // License & Paywall state
  const [licenseInfo, setLicenseInfo] = useState({ isDemo: true, tier: 'DEMO', limits: {} });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTriggerReason, setUpgradeTriggerReason] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenUpgrade = (reason = '') => {
    setUpgradeTriggerReason(reason);
    setIsUpgradeModalOpen(true);
  };

  // Global State
  const [summaryData, setSummaryData] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [monthlyData, setMonthlyData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [financeList, setFinanceList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [companySettings, setCompanySettings] = useState({});

  // Tải dữ liệu toàn bộ hệ thống từ Cloudflare D1 (Dành riêng cho Doanh Nghiệp)
  const loadAllData = async () => {
    if (!currentUser) return;
    if (currentUser?.role === 'SUPER_ADMIN') {
      // Tài khoản Quản trị nền tảng (Master) quản lý hệ thống tổng thể, không tải dữ liệu vận hành cá thể của doanh nghiệp
      return;
    }
    try {
      setLoading(true);
      const [
        sumRes,
        monRes,
        assetRes,
        finRes,
        taskRes,
        ctrRes,
        handRes,
        attRes,
        attSumRes,
        usrRes,
        licRes,
        setRes
      ] = await Promise.all([
        api.getDashboardSummary().catch(() => ({ data: { totalAssets: 0, pendingTasks: 0, urgentReminders: [] } })),
        api.getMonthlySummary().catch(() => ({ data: {} })),
        api.getAssets().catch(() => ({ data: [] })),
        api.getFinance().catch(() => ({ data: [] })),
        api.getTasks().catch(() => ({ data: [] })),
        api.getContracts().catch(() => ({ data: [] })),
        api.getHandovers().catch(() => ({ data: [] })),
        api.getAttendance().catch(() => ({ data: [] })),
        api.getAttendanceSummary().catch(() => ({ data: {} })),
        api.getUsers().catch(() => ({ data: [] })),
        api.getLicenseStatus().catch(() => ({ success: false, data: { isDemo: true, tier: 'DEMO' } })),
        api.getSettings().catch(() => ({ success: false, data: { settings: {} } }))
      ]);

      setSummaryData(sumRes?.data || { totalAssets: 0, pendingTasks: 0, urgentReminders: [] });

      const resolvedCompany =
        sumRes?.data?.company_name ||
        sumRes?.data?.companyName ||
        licRes?.data?.company_name ||
        licRes?.data?.companyName ||
        currentUser?.company_name ||
        '';
      if (resolvedCompany) {
        setCompanyName(resolvedCompany);
      }
      setMonthlyData(monRes.data);
      setAssets(assetRes.data || []);
      setFinanceList(finRes.data || []);
      setTasks(taskRes.data || []);
      setContracts(ctrRes.data || []);
      setHandovers(handRes.data || []);
      setAttendanceList(attRes.data || []);
      setAttendanceSummary(attSumRes.data);
      setUsers(usrRes.data || []);
      if (setRes?.data?.settings) {
        setCompanySettings(setRes.data.settings);
      }
      if (licRes && licRes.data) {
        setLicenseInfo(licRes.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu từ Cloudflare D1:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Xác định tên thương hiệu hiển thị (OMNIASSETS nếu demo, hoặc tên doanh nghiệp riêng)
  const brandName = getBrandDisplayName({
    licenseInfo,
    companyName: companyName || summaryData?.company_name || currentUser?.company_name,
    currentUser
  });

  // Đồng bộ hóa URL Slug, Document Title và Canonical SEO khi chuyển tab
  useEffect(() => {
    syncTabToUrlAndSeo(currentTab, true, brandName);
  }, [currentTab, brandName]);

  // Lắng nghe phím Back / Forward trên trình duyệt
  useEffect(() => {
    const handlePopState = (e) => {
      const targetTab = e.state?.tab || getTabFromPath(window.location.pathname, currentUser?.role);
      setCurrentTab(targetTab);
      syncTabToUrlAndSeo(targetTab, false, brandName);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, brandName]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    syncTabToUrlAndSeo('dashboard', true, 'OMNIASSETS');
  };

  // Nếu chưa đăng nhập -> Hiển thị Màn hình Đăng Nhập
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          const initialTab = getTabFromPath(window.location.pathname, user?.role);
          setCurrentTab(initialTab);
          syncTabToUrlAndSeo(initialTab, true, user?.company_name || 'OMNIASSETS');
        }}
      />
    );
  }

  const overdueCount = tasks.filter((t) => t.urgency === 'OVERDUE' && t.status !== 'COMPLETED').length;
  const effectiveRole = currentUser?.role === 'SUPER_ADMIN' ? 'ADMIN' : (currentUser?.role || 'STAFF');

  return (
    <div className="flex min-h-screen bg-surface-bg text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={currentUser?.role || 'STAFF'}
        currentUser={currentUser}
        companySettings={companySettings}
        overdueCount={overdueCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        licenseInfo={licenseInfo}
        onOpenUpgrade={handleOpenUpgrade}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        brandName={brandName}
        companyName={companyName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          urgentReminders={summaryData?.urgentReminders || []}
          onCheckInSuccess={loadAllData}
          currentUser={currentUser}
          attendanceList={attendanceList}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={setCurrentTab}
          licenseInfo={licenseInfo}
          onOpenUpgrade={handleOpenUpgrade}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          brandName={brandName}
          companyName={companyName}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {currentUser?.role === 'SUPER_ADMIN' ? (
            <SuperAdminPortal
              currentUser={currentUser}
              activeTab={['overview', 'companies', 'keys', 'plans', 'support-desk', 'announcements', 'revenue', 'settings'].includes(currentTab) ? currentTab : 'overview'}
              onNavigateTab={setCurrentTab}
            />
          ) : loading && !summaryData ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-pastel-500" />
              <p className="text-xs font-medium">Đang đồng bộ dữ liệu hệ thống...</p>
            </div>
          ) : (
            <>

              {currentTab === 'dashboard' && (
                <Dashboard
                  summaryData={summaryData}
                  monthlyData={monthlyData}
                  onNavigate={setCurrentTab}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'assets' && (
                <AssetManager
                  assets={assets}
                  users={users}
                  userRole={effectiveRole}
                  currentUser={currentUser}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'finance' && (
                <FinanceManager
                  financeList={financeList}
                  monthlyData={monthlyData}
                  userRole={effectiveRole}
                  currentUser={currentUser}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'tasks' && (
                <TaskManager
                  tasks={tasks}
                  users={users}
                  currentUserId={currentUser?.id}
                  currentUser={currentUser}
                  userRole={effectiveRole}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'contracts' && (
                <ContractManager
                  contracts={contracts}
                  handovers={handovers}
                  assets={assets}
                  users={users}
                  currentUser={currentUser}
                  userRole={effectiveRole}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceManager
                  attendanceList={attendanceList}
                  users={users}
                  summary={attendanceSummary}
                  currentUser={currentUser}
                  userRole={effectiveRole}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'users' && (
                <UserManager
                  users={users}
                  userRole={effectiveRole}
                  currentUser={currentUser}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManager
                  userRole={effectiveRole}
                  users={users}
                  currentUser={currentUser}
                  companySettings={companySettings}
                  onNavigate={setCurrentTab}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsManager
                  users={users}
                  currentUser={currentUser}
                  userRole={effectiveRole}
                  companySettings={companySettings}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                  onNavigate={setCurrentTab}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating AI Mascot Assistant - Chỉ hiển thị cho Doanh nghiệp (Admin, Manager, Staff). Quản trị nền tảng (SUPER_ADMIN) không cần AI */}
      {currentUser?.role !== 'SUPER_ADMIN' && (
        <AIAssistantWidget
          activeTab={currentTab}
          userRole={currentUser?.role || 'STAFF'}
          currentUser={currentUser}
          onNavigate={setCurrentTab}
        />
      )}

      {/* Upgrade / License Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        licenseInfo={licenseInfo}
        currentUser={currentUser}
        companyName={companyName}
        triggerReason={upgradeTriggerReason}
        onLicenseUpdated={(newInfo) => {
          setLicenseInfo(newInfo);
          loadAllData();
        }}
      />

      {/* User Personal Profile & Password Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          loadAllData();
        }}
      />
    </div>
  );
}
