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
import { Login } from './components/Auth/Login';
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

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
        usrRes
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

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // Nếu chưa đăng nhập -> Hiển thị Màn hình Đăng Nhập
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const overdueCount = tasks.filter((t) => t.urgency === 'OVERDUE' && t.status !== 'COMPLETED').length;

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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          urgentReminders={summaryData?.urgentReminders || []}
          onCheckInSuccess={loadAllData}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {loading && !summaryData ? (
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
                />
              )}

              {currentTab === 'assets' && (
                <AssetManager
                  assets={assets}
                  users={users}
                  userRole={currentUser?.role}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'finance' && (
                <FinanceManager
                  financeList={financeList}
                  monthlyData={monthlyData}
                  userRole={currentUser?.role}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'tasks' && (
                <TaskManager
                  tasks={tasks}
                  users={users}
                  currentUserId={currentUser?.id}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'contracts' && (
                <ContractManager
                  contracts={contracts}
                  handovers={handovers}
                  assets={assets}
                  users={users}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceManager
                  attendanceList={attendanceList}
                  users={users}
                  summary={attendanceSummary}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'users' && (
                <UserManager
                  users={users}
                  userRole={currentUser?.role}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === 'categories' && (
                <CategoryManager
                  userRole={currentUser?.role}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsManager
                  userRole={currentUser?.role}
                  onRefresh={loadAllData}
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
    </div>
  );
}
