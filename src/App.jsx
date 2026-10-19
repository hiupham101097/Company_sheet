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
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      const u = saved ? JSON.parse(saved) : null;
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
  const [monthlyData, setMonthlyData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [financeList, setFinanceList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [users, setUsers] = useState([]);

  // Tải dữ liệu toàn bộ hệ thống từ Cloudflare D1
  const loadAllData = async () => {
    if (!currentUser) return;
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
        licRes
      ] = await Promise.all([
        api.getDashboardSummary(),
        api.getMonthlySummary(),
        api.getAssets(),
        api.getFinance(),
        api.getTasks(),
        api.getContracts(),
        api.getHandovers(),
        api.getAttendance(),
        api.getAttendanceSummary(),
        api.getUsers(),
        api.getLicenseStatus().catch(() => ({ success: false, data: { isDemo: true, tier: 'DEMO' } }))
      ]);

      setSummaryData(sumRes.data);
      setMonthlyData(monRes.data);
      setAssets(assetRes.data || []);
      setFinanceList(finRes.data || []);
      setTasks(taskRes.data || []);
      setContracts(ctrRes.data || []);
      setHandovers(handRes.data || []);
      setAttendanceList(attRes.data || []);
      setAttendanceSummary(attSumRes.data);
      setUsers(usrRes.data || []);
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

  // Đồng bộ hóa URL Slug, Document Title và Canonical SEO khi chuyển tab
  useEffect(() => {
    syncTabToUrlAndSeo(currentTab, true);
  }, [currentTab]);

  // Lắng nghe phím Back / Forward trên trình duyệt
  useEffect(() => {
    const handlePopState = (e) => {
      const targetTab = e.state?.tab || getTabFromPath(window.location.pathname, currentUser?.role);
      setCurrentTab(targetTab);
      syncTabToUrlAndSeo(targetTab, false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    syncTabToUrlAndSeo('dashboard', true);
  };

  // Nếu chưa đăng nhập -> Hiển thị Màn hình Đăng Nhập
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          const initialTab = getTabFromPath(window.location.pathname, user?.role);
          setCurrentTab(initialTab);
          syncTabToUrlAndSeo(initialTab, true);
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
        overdueCount={overdueCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        licenseInfo={licenseInfo}
        onOpenUpgrade={handleOpenUpgrade}
        onOpenProfile={() => setIsProfileModalOpen(true)}
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
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {loading && !summaryData ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-pastel-500" />
              <p className="text-xs font-medium">Đang đồng bộ dữ liệu hệ thống...</p>
            </div>
          ) : (
            <>
              {currentTab === 'super-admin' && (
                <SuperAdminPortal currentUser={currentUser} />
              )}

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
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'users' && (
                <UserManager
                  users={users}
                  userRole={effectiveRole}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManager
                  userRole={effectiveRole}
                  users={users}
                  onNavigate={setCurrentTab}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsManager
                  userRole={effectiveRole}
                  onRefresh={loadAllData}
                  licenseInfo={licenseInfo}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating AI Mascot Assistant */}
      <AIAssistantWidget
        activeTab={currentTab}
        userRole={currentUser?.role || 'STAFF'}
        currentUser={currentUser}
        onNavigate={setCurrentTab}
      />

      {/* Upgrade / License Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        licenseInfo={licenseInfo}
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
