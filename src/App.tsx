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
  Check,
  AlertTriangle,
  Info,
  Database,
  LogOut,
} from 'lucide-react';

type NavTab = 'overview' | 'tasks' | 'vacations' | 'kpi' | 'audit';

// URL 해시로부터 현재 탭 파싱 (새로고침 및 딥링크 지원)
function parseTabFromHash(): NavTab {
  if (typeof window === 'undefined') return 'overview';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (cleanHash === 'tasks' || cleanHash.startsWith('tasks/')) return 'tasks';
  if (cleanHash === 'schedule' || cleanHash === 'vacations' || cleanHash.startsWith('schedule/')) return 'vacations';
  if (cleanHash === 'kpi' || cleanHash === 'kpis' || cleanHash.startsWith('kpi/')) return 'kpi';
  if (cleanHash === 'audit' || cleanHash === 'logs' || cleanHash.startsWith('audit/')) return 'audit';
  return 'overview';
}

function tabToHash(tab: NavTab): string {
  if (tab === 'vacations') return '#/schedule';
  return `#/${tab}`;
}

const TAB_TITLES: Record<NavTab, string> = {
  overview: '서비스기획팀 업무포털 | 안내',
  tasks: '서비스기획팀 업무포털 | 업무 관리',
  vacations: '서비스기획팀 업무포털 | 팀 통합 일정',
  kpi: '서비스기획팀 업무포털 | KPI 목표 및 평가',
  audit: '서비스기획팀 업무포털 | 감사 로그',
};

export function App() {
  const [activeTab, setActiveTabState] = useState<NavTab>(() => parseTabFromHash());

  // URL Hash 변경 함수 (브라우저 히스토리 및 타이틀 동기화)
  const navigateTo = (tab: NavTab) => {
    const targetHash = tabToHash(tab);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setActiveTabState(tab);
    document.title = TAB_TITLES[tab] || '서비스기획팀 업무포털';
  };

  // 브라우저 뒤로가기 / 앞으로가기 및 URL 직접 입력(F5) 감지
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseTabFromHash();
      setActiveTabState(parsed);
      document.title = TAB_TITLES[parsed] || '서비스기획팀 업무포털';
    };

    // 초기 마운트 시 해시가 비어있으면 #/overview로 정규화
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.history.replaceState(null, '', '#/overview');
    }
    document.title = TAB_TITLES[parseTabFromHash()] || '서비스기획팀 업무포털';

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    PlanningStorageService.initialize();
    return PlanningStorageService.isLoggedIn();
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    PlanningStorageService.initialize();
    return PlanningStorageService.getCurrentUser();
  });
  const [syncKey, setSyncKey] = useState(0);

  // 마운트 시 Supabase 원격 DB와 자동 동기화
  useEffect(() => {
    PlanningStorageService.syncFromSupabase().then(() => {
      setSyncKey((prev) => prev + 1);
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
    setIsAuthenticated(true);
    showToast(`${user.name}님 환영합니다! (${user.department})`, 'success');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    PlanningStorageService.logout();
    setIsAuthenticated(false);
    showToast('안전하게 로그아웃되었습니다.', 'info');
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
          <div className="brand-title">
            서비스기획팀 업무포털
          </div>
          <div className="brand-sub">
            Digital Service Planning Team
          </div>
        </div>

        <nav className="sidebar-nav">
          <a
            href="#/overview"
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('overview');
            }}
          >
            <Compass size={18} />
            <span>서비스기획팀 안내</span>
          </a>

          <a
            href="#/tasks"
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('tasks');
            }}
          >
            <CheckSquare size={18} />
            <span>서비스기획 업무 관리</span>
            <span className="nav-badge">Tasks</span>
          </a>

          <a
            href="#/schedule"
            className={`nav-item ${activeTab === 'vacations' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('vacations');
            }}
          >
            <Calendar size={18} />
            <span>팀 통합 일정</span>
            <span className="nav-badge">Schedule</span>
          </a>

          <a
            href="#/kpi"
            className={`nav-item ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('kpi');
            }}
          >
            <Target size={18} />
            <span>KPI 목표 및 평가</span>
            <span className="nav-badge">2026</span>
          </a>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '12px 6px' }} />

          <a
            href="#/audit"
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('audit');
            }}
          >
            <ShieldAlert size={18} />
            <span>감사 로그 (Audit)</span>
          </a>
        </nav>
      </aside>

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="app-main">
        {/* 상단 탑바 */}
        <header className="app-topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {activeTab === 'overview' && '서비스기획팀 업무 안내'}
              {activeTab === 'tasks' && '서비스기획 업무 관리'}
              {activeTab === 'vacations' && '팀 통합 일정'}
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
            <OverviewView onNavigateToTasks={() => navigateTo('tasks')} />
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
              onNavigateToTasks={() => navigateTo('tasks')}
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
