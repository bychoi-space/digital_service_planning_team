import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { PlanningStorageService } from './services/storage';
import { isSupabaseEnabled } from './services/supabase';
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
  Lock,
  Eye,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  Info,
  X,
  Database,
} from 'lucide-react';

type NavTab = 'overview' | 'tasks' | 'vacations' | 'kpi' | 'audit';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentUser, setCurrentUser] = useState<User>(() => {
    PlanningStorageService.initialize();
    return PlanningStorageService.getCurrentUser();
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => PlanningStorageService.getUsers());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInputName, setLoginInputName] = useState('');
  const [loginInputPassword, setLoginInputPassword] = useState('');
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

  // 계정 빠른 전환 핸들러
  const handleUserSwitch = (userId: string) => {
    const updated = PlanningStorageService.setCurrentUser(userId);
    setCurrentUser(updated);
    if (updated.role === 'viewer') {
      showToast(`${updated.name} (유관부서 읽기 전용) 모드로 전환되었습니다.`, 'info');
    } else {
      showToast(`${updated.name} (기획팀 편집자) 계정으로 전환되었습니다.`, 'success');
    }
  };

  // 로그인 모달 제출 핸들러
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInputName.trim()) {
      showToast('이름을 입력해 주세요.', 'error');
      return;
    }

    // 이름 일치 여부 확인 (없으면 신규 뷰어로 등록 또는 기존 매칭)
    const matched = allUsers.find(
      (u) => u.name.includes(loginInputName.trim()) || u.username === loginInputName.trim()
    );

    if (matched) {
      handleUserSwitch(matched.id);
      setIsLoginModalOpen(false);
      setLoginInputName('');
      setLoginInputPassword('');
    } else {
      // 일치하는 팀원이 없으면 자동으로 유관부서(Viewer)로 로그인 처리
      showToast(`'${loginInputName}' 님은 기획팀 명단에 없어 '유관부서 뷰어'로 접속합니다.`, 'info');
      const viewerUser = allUsers.find((u) => u.role === 'viewer') || allUsers[allUsers.length - 1];
      handleUserSwitch(viewerUser.id);
      setIsLoginModalOpen(false);
      setLoginInputName('');
      setLoginInputPassword('');
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
            <span>기획 업무 관리</span>
            <span className="nav-badge">Tasks</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'vacations' ? 'active' : ''}`}
            onClick={() => setActiveTab('vacations')}
          >
            <Calendar size={18} />
            <span>팀원 휴가 일정</span>
            <span className="nav-badge">Leave</span>
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
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                flex: 1,
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '4px',
                color: '#cbd5e1',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Lock size={12} /> 로그인 창
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
              {activeTab === 'tasks' && '기획 업무 내역 관리'}
              {activeTab === 'vacations' && '팀원 휴가 및 부재 일정'}
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

      {/* 3. 간이 로그인 모달 */}
      {isLoginModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginModalOpen(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">사내 간이 로그인</h3>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  서비스기획팀원은 본인 이름으로 로그인하시면 등록/수정/삭제 권한이 부여되며, 유관부서 담당자는 읽기 전용으로 접속됩니다.
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">이름 또는 아이디 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 김기획, 이수진, 최협업 등"
                    value={loginInputName}
                    onChange={(e) => setLoginInputName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">비밀번호</label>
                  <input
                    type="password"
                    placeholder="사내 기본 비밀번호 (생략 가능)"
                    value={loginInputPassword}
                    onChange={(e) => setLoginInputPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  접속하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. 플로팅 토스트 알림 컨테이너 */}
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
