import { useState, useEffect } from 'react';
import type { User } from './types';
import { PlanningStorageService } from './services/storage';
import { isSupabaseEnabled } from './services/supabase';
import { LoginPage } from './components/auth/LoginPage';
import { OverviewView } from './components/OverviewView';
import { TasksView } from './components/TasksView';
import { VacationsView } from './components/VacationsView';
import { KpiView } from './components/KpiView';
import { AuditLogsView } from './components/AuditLogsView';
import {
  Compass,
  CheckSquare,
  Calendar,
  Target,
  ShieldAlert,
  Eye,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  Database,
  LogOut,
} from 'lucide-react';

type NavTab = 'overview' | 'tasks' | 'vacations' | 'kpi' | 'audit';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    PlanningStorageService.initialize();
    return PlanningStorageService.isLoggedIn();
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    PlanningStorageService.initialize();
    return PlanningStorageService.getCurrentUser();
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => PlanningStorageService.getUsers());
  const [syncKey, setSyncKey] = useState(0);

  // 마운트 시 Supabase 원격 DB와 자동 동기화
  useEffect(() => {
    PlanningStorageService.syncFromSupabase().then(() => {
      setSyncKey((prev) => prev + 1);
      setAllUsers(PlanningStorageService.getUsers());
      setCurrentUser(PlanningStorageService.getCurrentUser());
    });
  }, []);

  // 토스트 메시지 관리
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const isViewer = currentUser.role === 'viewer';

  // 로그인 성공 콜백
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAllUsers(PlanningStorageService.getUsers());
    setIsAuthenticated(true);
    showToast(`${user.name}님 환영합니다! (${user.department})`, 'success');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    PlanningStorageService.logout();
    setIsAuthenticated(false);
    showToast('안전하게 로그아웃되었습니다.', 'info');
  };

  // 계정 빠른 전환 핸들러 (사이드바)
  const handleUserSwitch = (userId: string) => {
    const updated = PlanningStorageService.setCurrentUser(userId);
    setCurrentUser(updated);
    if (updated.role === 'viewer') {
      showToast(`${updated.name} (유관부서 읽기 전용) 모드로 전환되었습니다.`, 'info');
    } else {
      showToast(`${updated.name} (기획팀 편집자) 계정으로 전환되었습니다.`, 'success');
    }
  };

  // 데이터 초기화
  const handleResetData = () => {
    if (window.confirm('모든 데이터를 초기 기본값으로 리셋하시겠습니까? (테스트용)')) {
      PlanningStorageService.resetToDefault();
      setAllUsers(PlanningStorageService.getUsers());
      setCurrentUser(PlanningStorageService.getCurrentUser());
      showToast('모든 데이터가 기본 시드 상태로 초기화되었습니다.', 'success');
    }
  };

  // 1. 인증되지 않은 상태이면 독립된 로그인/회원가입 페이지 표시
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {/* 플로팅 토스트 알림 */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${
                toast.type === 'success'
                  ? 'toast-success'
                  : toast.type === 'error'
                  ? 'toast-error'
                  : 'toast-info'
              }`}
            >
              {toast.type === 'success' && <Check size={16} />}
              {toast.type === 'error' && <AlertTriangle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              <span>{toast.msg}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // 2. 인증 완료 시 메인 포털 대시보드 표시
  return (
    <div className="app-container">
      {/* 1. 사이드바 내비게이션 */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">
            <Sparkles size={12} /> ENTERPRISE PORTAL
          </div>
          <div className="brand-title">
            서비스기획팀 업무포털
          </div>
          <div className="brand-sub">
            Digital Service Planning Team
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Compass size={18} />
            <span>서비스기획팀 안내</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckSquare size={18} />
            <span>서비스기획 업무 관리</span>
            <span className="nav-badge">Tasks</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'vacations' ? 'active' : ''}`}
            onClick={() => setActiveTab('vacations')}
          >
            <Calendar size={18} />
            <span>팀 통합 일정 (업무 & 휴가)</span>
            <span className="nav-badge">Schedule</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            <Target size={18} />
            <span>KPI 목표 및 평가</span>
            <span className="nav-badge">2026</span>
          </button>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '12px 6px' }} />

          <button
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <ShieldAlert size={18} />
            <span>감사 로그 (Audit)</span>
          </button>
        </nav>

        {/* 사이드바 하단 계정 정보 및 모드 전환 */}
        <div className="sidebar-footer">
          <div className="current-user-card">
            <div
              className="user-avatar"
              style={{ backgroundColor: currentUser.avatarColor || '#2563eb' }}
            >
              {currentUser.name.substring(0, 2)}
            </div>
            <div className="user-meta">
              <div className="user-name">{currentUser.name}</div>
              <span
                className={`user-role-badge ${
                  currentUser.role === 'admin'
                    ? 'role-admin'
                    : currentUser.role === 'member'
                    ? 'role-member'
                    : 'role-viewer'
                }`}
              >
                {currentUser.role === 'admin'
                  ? '관리자 (Admin)'
                  : currentUser.role === 'member'
                  ? '기획팀원 (Editor)'
                  : '유관부서 (Viewer)'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              빠른 계정 전환 (권한 테스트)
            </label>
            <select
              value={currentUser.id}
              onChange={(e) => handleUserSwitch(e.target.value)}
              className="account-switcher-select"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'viewer' ? '읽기전용 뷰어' : '기획팀'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: '7px 10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '4px',
                color: '#fca5a5',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <LogOut size={13} /> 로그아웃
            </button>
            <button
              onClick={handleResetData}
              title="데이터 초기값 리셋"
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="app-main">
        {/* 상단 탑바 */}
        <header className="app-topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {activeTab === 'overview' && '서비스기획팀 업무 안내'}
              {activeTab === 'tasks' && '서비스기획 업무 관리'}
              {activeTab === 'vacations' && '팀 통합 일정 (업무 & 휴가)'}
              {activeTab === 'kpi' && 'KPI 목표 수립 및 평가 관리'}
              {activeTab === 'audit' && '시스템 감사 로그 및 변경 이력'}
            </h1>
            {isViewer && (
              <div className="viewer-mode-alert">
                <Eye size={14} /> 유관부서 읽기 전용 모드 적용 중 (등록/수정 제한)
              </div>
            )}
          </div>

          <div className="topbar-right">
            {isSupabaseEnabled() && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Database size={13} color="#16a34a" /> 클라우드 DB 연결됨 (Supabase)
              </span>
            )}
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              접속자: <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong> ({currentUser.department})
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="로그아웃"
            >
              <LogOut size={13} /> 로그아웃
            </button>
          </div>
        </header>

        {/* 본문 화면 렌더링 */}
        <div className="content-body" key={syncKey}>
          {activeTab === 'overview' && (
            <OverviewView onNavigateToTasks={() => setActiveTab('tasks')} />
          )}
          {activeTab === 'tasks' && (
            <TasksView
              currentUser={currentUser}
              isViewer={isViewer}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'vacations' && (
            <VacationsView
              currentUser={currentUser}
              isViewer={isViewer}
              onShowToast={showToast}
              onNavigateToTasks={() => setActiveTab('tasks')}
            />
          )}
          {activeTab === 'kpi' && (
            <KpiView
              currentUser={currentUser}
              isViewer={isViewer}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'audit' && <AuditLogsView />}
        </div>
      </main>

      {/* 3. 플로팅 토스트 알림 컨테이너 */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === 'success'
                ? 'toast-success'
                : toast.type === 'error'
                ? 'toast-error'
                : 'toast-info'
            }`}
          >
            {toast.type === 'success' && <Check size={16} />}
            {toast.type === 'error' && <AlertTriangle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
