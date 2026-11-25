import React, { useEffect, useMemo, useState } from 'react';
import type { AuditAction, AuditLog, KpiAccessRole, User } from '../types';
import {
  AUDIT_LOG_MAX_COUNT,
  AUDIT_LOG_RETENTION_DAYS,
  PlanningStorageService,
} from '../services/storage';
import {
  canManageUserPermissions,
  COMPANY_DEPARTMENTS,
  KPI_ACCESS_ROLE_META,
  KPI_ACCESS_ROLE_OPTIONS,
  resolveKpiAccessRole,
} from '../constants/departments';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';

interface AuditLogsViewProps {
  currentUser: User;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUserUpdated?: (user: User) => void;
  pdfForceSubTab?: 'permissions' | 'logs';
  isPdfExport?: boolean;
}

type AuditSubTab = 'permissions' | 'logs';

const LOGS_PER_PAGE = 15;

function parseAuditSubTabFromHash(
  hash: string = typeof window !== 'undefined' ? window.location.hash : ''
): AuditSubTab {
  const clean = hash.replace(/^#\/?/, '').toLowerCase().trim();
  if (clean === 'audit/logs' || clean === 'logs') {
    return 'logs';
  }
  return 'permissions';
}

const POSITION_PRESETS_BY_ROLE: Record<KpiAccessRole, string[]> = {
  executive_viewer: ['경영관리본부장 (사장)', '경영기획 총괄 (전무)', '본부장 / 임원'],
  division_head: ['디지털마케팅실장 (상무)', '실장 / 상무'],
  team_lead: ['서비스기획자 / 차장', '서비스기획팀장'],
  team_member: ['서비스기획자', '서비스기획자 / 대리', '웹 디자이너 / 대리', '퍼블리셔 / 대리'],
  cross_dept: ['유관부서 담당자', '그로스마케팅 담당자', '온라인 CX 담당자', '온라인MD 담당자'],
};

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  currentUser,
  onShowToast,
  onUserUpdated,
  pdfForceSubTab,
  isPdfExport = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AuditSubTab>(() =>
    isPdfExport && pdfForceSubTab ? pdfForceSubTab : parseAuditSubTabFromHash()
  );
  const [logs, setLogs] = useState<AuditLog[]>(() => PlanningStorageService.getAuditLogs());
  const [users, setUsers] = useState<User[]>(() => PlanningStorageService.getUsers());

  useEffect(() => {
    if (isPdfExport) return;
    const handleHashSync = () => {
      setActiveSubTab(parseAuditSubTabFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, [isPdfExport]);

  const handleSelectSubTab = (tab: AuditSubTab) => {
    setActiveSubTab(tab);
    const targetHash = tab === 'logs' ? '#/audit/logs' : '#/audit/permissions';
    if (window.location.hash !== targetHash) {
      window.location.assign(targetHash);
    }
  };

  // 감사 로그 필터 · 검색 · 페이지네이션 상태
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPruning, setIsPruning] = useState<boolean>(false);

  // 오직 최범열 본인에게만 수정(권한·직책 설정, 사전 등록, 비밀번호 관리, 수동 로그 정리) 권한 부여
  const canManage = canManageUserPermissions(currentUser);

  // 권한 · 직책 설정 및 사전 등록 모달 상태
  const [roleModalMode, setRoleModalMode] = useState<'edit' | 'create' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState(COMPANY_DEPARTMENTS[0].name);
  const [formPosition, setFormPosition] = useState('');
  const [formKpiRole, setFormKpiRole] = useState<KpiAccessRole>('team_member');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // 관리자 전용 특정 회원 비밀번호 직접 지정 모달 상태 (초기값 빈 값 유지)
  const [targetUserForPw, setTargetUserForPw] = useState<User | null>(null);
  const [adminNewPw, setAdminNewPw] = useState('');
  const [adminNewPwConfirm, setAdminNewPwConfirm] = useState('');

  useEffect(() => {
    const syncState = () => {
      setUsers(PlanningStorageService.getUsers());
      setLogs(PlanningStorageService.getAuditLogs());
    };
    window.addEventListener('ds-portal-users-updated', syncState);
    window.addEventListener('ds-portal-audit-updated', syncState);
    return () => {
      window.removeEventListener('ds-portal-users-updated', syncState);
      window.removeEventListener('ds-portal-audit-updated', syncState);
    };
  }, []);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    onShowToast?.(msg, type);
  };

  const handleRefresh = async () => {
    await PlanningStorageService.syncFromSupabase();
    setLogs(PlanningStorageService.getAuditLogs());
    setUsers(PlanningStorageService.getUsers());
    notify('계정 권한 현황 및 감사 로그를 새로고침했습니다.', 'info');
  };

  // 최범열 전용: 보관 기준(90일 · 300건) 초과 및 단순 노이즈 로그 수동 정리
  const handleManualPrune = async () => {
    if (!canManage || isPruning) return;
    if (
      !window.confirm(
        `감사 로그 자동 보관 기준(최근 ${AUDIT_LOG_RETENTION_DAYS}일 · 최대 ${AUDIT_LOG_MAX_COUNT}건)을 초과한 이력과 불필요한 단순 접속·체크 로그를 DB에서 정리하시겠습니까?`
      )
    ) {
      return;
    }

    setIsPruning(true);
    try {
      const result = await PlanningStorageService.adminPruneAuditLogs({
        keepDays: AUDIT_LOG_RETENTION_DAYS,
        keepMax: AUDIT_LOG_MAX_COUNT,
      });
      setLogs(PlanningStorageService.getAuditLogs());
      setCurrentPage(1);
      notify(result.message, result.success ? 'success' : 'error');
    } finally {
      setIsPruning(false);
    }
  };

  // 조직 위계 순(최상위 임원 → 실장 → 팀장 → 서비스기획팀원 → 유관부서) 정렬
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const roleA = resolveKpiAccessRole(a);
      const roleB = resolveKpiAccessRole(b);
      const prioDiff =
        KPI_ACCESS_ROLE_META[roleA].sortPriority - KPI_ACCESS_ROLE_META[roleB].sortPriority;
      if (prioDiff !== 0) return prioDiff;
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });
  }, [users]);

  // 감사 로그 필터링 및 페이지네이션 계산
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (filterType !== 'all' && log.entityType !== filterType) {
        return false;
      }
      if (!q) return true;
      return (
        (log.entityTitle || '').toLowerCase().includes(q) ||
        (log.summary || '').toLowerCase().includes(q) ||
        (log.actorName || '').toLowerCase().includes(q)
      );
    });
  }, [logs, filterType, searchQuery]);

  const effectiveLogsPerPage = isPdfExport ? 50 : LOGS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / effectiveLogsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIdx = (safePage - 1) * effectiveLogsPerPage;
  const paginatedLogs = filteredLogs.slice(pageStartIdx, pageStartIdx + effectiveLogsPerPage);

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(1, safePage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const nums: number[] = [];
    for (let p = start; p <= end; p += 1) {
      nums.push(p);
    }
    return nums;
  }, [safePage, totalPages]);

  // 1) 기존 회원 권한 · 직책 수정 모달 열기
  const handleOpenEditRoleModal = (user: User) => {
    if (!canManage) return;
    const resolvedRole = resolveKpiAccessRole(user);
    setRoleModalMode('edit');
    setEditingUser(user);
    setFormName(user.name);
    setFormDepartment(user.department || COMPANY_DEPARTMENTS[0].name);
    setFormPosition(user.position || KPI_ACCESS_ROLE_META[resolvedRole].defaultPosition);
    setFormKpiRole(resolvedRole);
  };

  // 2) 미가입 임원·팀원 사전 계정 및 권한 등록 모달 열기
  const handleOpenPreRegisterModal = () => {
    if (!canManage) return;
    setRoleModalMode('create');
    setEditingUser(null);
    setFormName('');
    setFormKpiRole('executive_viewer');
    setFormDepartment('경영관리본부');
    setFormPosition('경영관리본부장 (사장)');
  };

  const handleCloseRoleModal = () => {
    if (isSavingRole) return;
    setRoleModalMode(null);
    setEditingUser(null);
  };

  // 권한 등급 카드 클릭 시 부서/직책 스마트 추천 보조
  const handleSelectKpiRole = (nextRole: KpiAccessRole) => {
    if (editingUser && canManageUserPermissions(editingUser)) {
      return;
    }
    setFormKpiRole(nextRole);
    const meta = KPI_ACCESS_ROLE_META[nextRole];
    if (roleModalMode === 'create') {
      if (meta.defaultDepartment) {
        setFormDepartment(meta.defaultDepartment);
      }
      setFormPosition(meta.defaultPosition);
    } else if (!formPosition.trim()) {
      setFormPosition(meta.defaultPosition);
    }
  };

  // 권한 · 직책 설정 또는 사전 등록 저장
  const handleSubmitRoleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setIsSavingRole(true);
    try {
      if (roleModalMode === 'edit' && editingUser) {
        const result = await PlanningStorageService.adminUpdateUserRoleAndPosition({
          targetUserId: editingUser.id,
          department: formDepartment,
          position: formPosition,
          kpiRole: formKpiRole,
        });
        if (result.success) {
          notify(result.message, 'success');
          setUsers(PlanningStorageService.getUsers());
          setLogs(PlanningStorageService.getAuditLogs());
          if (
            result.updatedUser &&
            result.updatedUser.name.trim() === currentUser.name.trim()
          ) {
            onUserUpdated?.(result.updatedUser);
          }
          setRoleModalMode(null);
          setEditingUser(null);
        } else {
          notify(result.message, 'error');
        }
      } else if (roleModalMode === 'create') {
        const result = await PlanningStorageService.adminPreRegisterUser({
          name: formName,
          department: formDepartment,
          position: formPosition,
          kpiRole: formKpiRole,
        });
        if (result.success) {
          notify(result.message, 'success');
          setUsers(PlanningStorageService.getUsers());
          setLogs(PlanningStorageService.getAuditLogs());
          setRoleModalMode(null);
          setEditingUser(null);
        } else {
          notify(result.message, 'error');
        }
      }
    } finally {
      setIsSavingRole(false);
    }
  };

  // 관리자: 회원 비밀번호 직접 지정 모달 열기
  const handleOpenAdminPwModal = (user: User) => {
    if (!canManage) return;
    setTargetUserForPw(user);
    setAdminNewPw('');
    setAdminNewPwConfirm('');
  };

  // 관리자: 회원 비밀번호 직접 지정 저장
  const handleSaveAdminPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPw || !canManage) return;

    if (!adminNewPw) {
      notify('새로 지정할 비밀번호를 입력해 주세요.', 'error');
      return;
    }
    if (adminNewPw !== adminNewPwConfirm) {
      notify('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    const result = await PlanningStorageService.adminResetUserPassword({
      targetUserId: targetUserForPw.id,
      newPassword: adminNewPw,
    });

    if (result.success) {
      notify(result.message, 'success');
      setTargetUserForPw(null);
      setUsers(PlanningStorageService.getUsers());
      setLogs(PlanningStorageService.getAuditLogs());
    } else {
      notify(result.message, 'error');
    }
  };

  // 관리자: 회원 비밀번호 즉시 초기화
  const handleResetToBlank = async (user: User) => {
    if (!canManage) return;
    if (
      !window.confirm(
        `정말 '${user.name} (${user.department})' 계정의 비밀번호를 초기화하시겠습니까?\n\n초기화 후 해당 인원이 다음 로그인 또는 가입 시 입력하는 비밀번호가 자동 등록됩니다.`
      )
    ) {
      return;
    }

    const result = await PlanningStorageService.adminResetUserPassword({
      targetUserId: user.id,
      newPassword: '',
    });

    if (result.success) {
      notify(result.message, 'success');
      setUsers(PlanningStorageService.getUsers());
      setLogs(PlanningStorageService.getAuditLogs());
    } else {
      notify(result.message, 'error');
    }
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <span className="audit-action-badge is-create">등록 (CREATE)</span>;
      case 'UPDATE':
        return <span className="audit-action-badge is-update">수정 (UPDATE)</span>;
      case 'DELETE':
        return <span className="audit-action-badge is-delete">삭제 (DELETE)</span>;
      default:
        return <span className="audit-action-badge is-default">{action}</span>;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'task':
        return '업무관리';
      case 'vacation':
        return '휴가일정';
      case 'kpi':
        return 'KPI평가';
      case 'work_info':
        return '업무관련정보';
      case 'onboarding':
        return '온보딩';
      case 'policy':
        return '시선닷컴정책서';
      case 'auth':
        return '계정/권한';
      default:
        return type;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return '관리자';
    if (role === 'member') return '기획팀원';
    return '유관부서';
  };

  const renderKpiRoleBadge = (kpiRole: KpiAccessRole) => {
    const meta = KPI_ACCESS_ROLE_META[kpiRole];
    return (
      <div className="audit-role-cell">
        <span className={`audit-role-badge role-${kpiRole}`}>{meta.shortLabel}</span>
        <span className="audit-role-sub">
          {meta.portalAccessLabel} · {meta.kpiAccessLabel}
        </span>
      </div>
    );
  };

  const isEditingSelfOwner = Boolean(editingUser && canManageUserPermissions(editingUser));
  const currentPresets = POSITION_PRESETS_BY_ROLE[formKpiRole] || [];

  return (
    <div className="audit-container">
      {/* 상단 서브탭 스위치 ([권한 · 직책 설정] / [시스템 감사 로그]) */}
      <div className="card audit-top-nav-card">
        <div className="audit-subtab-group" role="tablist" aria-label="권한 설정 및 감사 로그 탭">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'permissions'}
            onClick={() => handleSelectSubTab('permissions')}
            className={`audit-subtab-btn ${activeSubTab === 'permissions' ? 'is-active' : ''}`}
          >
            <Users size={16} />
            <span>권한 · 직책 설정</span>
            <span className="audit-subtab-count">{sortedUsers.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'logs'}
            onClick={() => handleSelectSubTab('logs')}
            className={`audit-subtab-btn ${activeSubTab === 'logs' ? 'is-active' : ''}`}
          >
            <ShieldCheck size={16} />
            <span>시스템 감사 로그</span>
            <span className="audit-subtab-count">{logs.length}</span>
          </button>
        </div>

        <div className="audit-header-controls">
          {!canManage && (
            <span className="audit-readonly-pill">
              <Lock size={14} /> 읽기 전용 (수정 권한: 최범열)
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary audit-refresh-btn"
          >
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </div>

      {/* [탭 1] 조직 계정 권한 및 직책 현황 / 설정 */}
      {activeSubTab === 'permissions' && (
        <div className="card audit-users-card">
          <div className="audit-users-header">
            <div className="audit-header-info">
              <div className="audit-header-icon is-users">
                <Users size={22} />
              </div>
              <div className="audit-header-text">
                <h2 className="audit-header-title">
                  조직 계정 권한 및 직책 현황 (총 {sortedUsers.length}명)
                </h2>
                <p className="audit-header-desc">
                  {canManage
                    ? '계정별 소속 부서·직책과 포털·KPI 권한 등급을 설정하거나 미가입 임원·구성원 계정을 사전 등록합니다.'
                    : '조직 구성원 및 상위 직책자의 소속 부서, 직책, 포털·KPI 권한 등급 현황입니다.'}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="audit-header-controls">
                <button
                  type="button"
                  onClick={handleOpenPreRegisterModal}
                  className="btn btn-primary audit-refresh-btn"
                >
                  <Plus size={15} /> 계정 · 권한 사전 등록
                </button>
              </div>
            )}
          </div>

          {/* 데스크톱 회원 및 권한 테이블 */}
          <div className="audit-table-scroll">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>성명</th>
                  <th>소속 부서</th>
                  <th>직책</th>
                  <th>권한 등급 (포털 · KPI)</th>
                  <th>계정 상태</th>
                  {canManage && <th className="audit-col-user-actions">권한 · 계정 관리</th>}
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => {
                  const resolvedRole = resolveKpiAccessRole(u);
                  return (
                    <tr key={u.id} className="audit-table-row">
                      <td className="audit-actor-name">{u.name}</td>
                      <td>{u.department}</td>
                      <td className="audit-td-position">{u.position || '-'}</td>
                      <td>{renderKpiRoleBadge(resolvedRole)}</td>
                      <td>
                        {u.password ? (
                          <span className="audit-pw-status is-set">가입 완료</span>
                        ) : (
                          <span className="audit-pw-status is-reset">
                            사전 등록 (첫 접속 시 비밀번호 설정)
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td>
                          <div className="audit-user-action-btns">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRoleModal(u)}
                              className="btn btn-primary tasks-action-btn"
                            >
                              <SlidersHorizontal size={14} /> 권한 · 직책 설정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdminPwModal(u)}
                              className="btn btn-secondary tasks-action-btn"
                            >
                              <KeyRound size={14} /> 비밀번호 지정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetToBlank(u)}
                              className="btn btn-secondary tasks-action-btn"
                            >
                              <RotateCcw size={14} /> 초기화
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="audit-td-empty">
                      등록된 계정이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일 회원 및 권한 카드 리스트 */}
          <div className="audit-mobile-list">
            {sortedUsers.map((u) => {
              const resolvedRole = resolveKpiAccessRole(u);
              const meta = KPI_ACCESS_ROLE_META[resolvedRole];
              return (
                <div key={u.id} className="audit-mobile-card">
                  <div className="audit-mobile-top">
                    <div className="audit-mobile-badges">
                      <strong className="audit-actor-name">{u.name}</strong>
                      <span className="audit-entity-chip">{u.department}</span>
                      <span className={`audit-role-badge role-${resolvedRole}`}>
                        {meta.shortLabel}
                      </span>
                    </div>
                    {u.password ? (
                      <span className="audit-pw-status is-set">가입 완료</span>
                    ) : (
                      <span className="audit-pw-status is-reset">사전 등록</span>
                    )}
                  </div>
                  <div className="audit-mobile-meta-line">
                    직책: <strong>{u.position || '-'}</strong> · {meta.portalAccessLabel} /{' '}
                    {meta.kpiAccessLabel}
                  </div>
                  {canManage && (
                    <div className="audit-user-action-btns is-mobile-triple">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRoleModal(u)}
                        className="btn btn-primary tasks-action-btn"
                      >
                        <SlidersHorizontal size={14} /> 권한 · 직책 설정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdminPwModal(u)}
                        className="btn btn-secondary tasks-action-btn"
                      >
                        <KeyRound size={14} /> 비밀번호 지정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetToBlank(u)}
                        className="btn btn-secondary tasks-action-btn"
                      >
                        <RotateCcw size={14} /> 초기화
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* [탭 2] 시스템 감사 로그 (15건 페이지네이션 + 최근 90일·300건 자동 보관) */}
      {activeSubTab === 'logs' && (
        <div className="card audit-table-card">
          <div className="audit-logs-toolbar">
            <div className="audit-logs-toolbar-left">
              <div className="audit-header-icon">
                <ShieldCheck size={22} />
              </div>
              <div className="audit-header-text">
                <div className="audit-logs-title-row">
                  <h2 className="audit-header-title">데이터 및 권한 변경 감사 로그</h2>
                  <span className="audit-retention-badge">
                    최근 {AUDIT_LOG_RETENTION_DAYS}일 · 최대 {AUDIT_LOG_MAX_COUNT}건 자동 보관
                  </span>
                </div>
                <p className="audit-header-desc">
                  단순 로그인·로그아웃 및 체크박스 토글은 제외하고, 주요 데이터·권한의 등록·수정·삭제 이력만 보관합니다.
                </p>
              </div>
            </div>

            <div className="audit-logs-controls">
              <div className="audit-search-box">
                <Search size={15} className="audit-search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="항목명 · 요약 · 수행자 검색"
                  className="form-input audit-search-input"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-select audit-filter-select"
                aria-label="감사 로그 영역 필터"
              >
                <option value="all">전체 영역 ({logs.length})</option>
                <option value="auth">계정/권한 변경</option>
                <option value="kpi">KPI 변경</option>
                <option value="task">업무 변경</option>
                <option value="policy">시선닷컴 정책서 변경</option>
                <option value="vacation">일정/휴가 변경</option>
                <option value="work_info">업무관련정보 변경</option>
                <option value="onboarding">온보딩 항목 변경</option>
              </select>

              {canManage && (
                <button
                  type="button"
                  disabled={isPruning}
                  onClick={handleManualPrune}
                  className="btn btn-secondary audit-refresh-btn"
                >
                  <Trash2 size={15} /> {isPruning ? '정리 중...' : '오래된 로그 정리'}
                </button>
              )}
            </div>
          </div>

          <div className="audit-table-scroll">
            <table className="audit-table">
              <thead>
                <tr>
                  <th className="audit-col-time">발생 일시</th>
                  <th className="audit-col-action">작업 구분</th>
                  <th className="audit-col-entity">영역</th>
                  <th className="audit-col-actor">수행자</th>
                  <th className="audit-col-summary">변경 내용 및 요약</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="audit-table-row">
                    <td className="audit-td-time">
                      {new Date(log.timestamp).toLocaleString('ko-KR')}
                    </td>
                    <td className="audit-td-action">{getActionBadge(log.action)}</td>
                    <td className="audit-td-entity">
                      <span className="audit-entity-chip">
                        {getEntityLabel(log.entityType)}
                      </span>
                    </td>
                    <td className="audit-td-actor">
                      <div className="audit-actor-name">{log.actorName}</div>
                      <div className="audit-actor-role">{getRoleLabel(log.actorRole)}</div>
                    </td>
                    <td className="audit-td-summary">
                      <div className="audit-summary-title">{log.entityTitle}</div>
                      <div className="audit-summary-desc">{log.summary}</div>
                    </td>
                  </tr>
                ))}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="audit-td-empty">
                      해당 조건의 감사 로그 이력이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일 전용 카드 리스트 (15건 페이지네이션 동일 적용) */}
          <div className="audit-mobile-list">
            {paginatedLogs.length === 0 ? (
              <div className="audit-td-empty">해당 조건의 감사 로그 이력이 없습니다.</div>
            ) : (
              paginatedLogs.map((log) => (
                <div key={log.id} className="audit-mobile-card">
                  <div className="audit-mobile-top">
                    <div className="audit-mobile-badges">
                      {getActionBadge(log.action)}
                      <span className="audit-entity-chip">
                        {getEntityLabel(log.entityType)}
                      </span>
                    </div>
                    <span className="audit-mobile-time">
                      {new Date(log.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="audit-summary-title">{log.entityTitle}</div>
                  <div className="audit-summary-desc">{log.summary}</div>
                  <div className="audit-mobile-actor">
                    수행자: <strong>{log.actorName}</strong> ({getRoleLabel(log.actorRole)})
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 하단 페이지네이션 바 (페이지당 15건) */}
          {filteredLogs.length > 0 && (
            <div className="audit-pagination-bar">
              <span className="audit-pagination-info">
                총 <strong>{filteredLogs.length}</strong>건 중{' '}
                <strong>
                  {pageStartIdx + 1}–{Math.min(pageStartIdx + LOGS_PER_PAGE, filteredLogs.length)}
                </strong>
                건 표시
              </span>

              <div className="audit-pagination-controls">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  className="audit-page-btn"
                  aria-label="이전 페이지"
                >
                  <ChevronLeft size={16} /> 이전
                </button>

                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`audit-page-num-btn ${safePage === pageNum ? 'is-active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  className="audit-page-btn"
                  aria-label="다음 페이지"
                >
                  다음 <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 최범열 전용: 권한 · 직책 설정 및 사전 계정 등록 모달 */}
      {canManage && roleModalMode && (
        <div className="modal-overlay" onClick={handleCloseRoleModal}>
          <div
            className="modal-box audit-role-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {roleModalMode === 'edit'
                  ? `권한 및 직책 설정 — ${editingUser?.name}`
                  : '미가입 계정 · 권한 사전 등록'}
              </h3>
              <button
                type="button"
                onClick={handleCloseRoleModal}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitRoleModal}
              autoComplete="off"
              className="tasks-modal-form"
            >
              <div className="modal-body">
                {roleModalMode === 'create' ? (
                  <div className="kpi-modal-target-summary">
                    <strong>미가입 임원 · 구성원 사전 권한 지정</strong>
                    <span>
                      성명과 직책·권한을 미리 등록해 두면, 해당 인원이 추후 회원가입 또는 첫 로그인 시 입력한 비밀번호로 즉시 활성화됩니다.
                    </span>
                  </div>
                ) : (
                  <div className="kpi-modal-target-summary">
                    <strong>대상 계정: {editingUser?.name}</strong>
                    <span>
                      소속 부서, 직책 및 포털·KPI 권한 등급 변경 사항은 즉시 클라우드 DB와 감사 로그에 반영됩니다.
                    </span>
                  </div>
                )}

                {roleModalMode === 'create' && (
                  <div className="form-group">
                    <label className="form-label login-form-label">
                      <UserIcon size={14} className="login-label-icon" /> 성명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 박종삼, 신동휘"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">포털 및 KPI 권한 등급 *</label>
                  <div className="audit-role-option-list">
                    {KPI_ACCESS_ROLE_OPTIONS.map((opt) => {
                      const isSelected = formKpiRole === opt.value;
                      const isDisabledOption = isEditingSelfOwner && opt.value !== 'team_lead';
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isDisabledOption}
                          onClick={() => handleSelectKpiRole(opt.value)}
                          className={`audit-role-option-card ${
                            isSelected ? `is-selected role-${opt.value}` : ''
                          }`}
                        >
                          <div className="audit-role-option-main">
                            <span className="audit-role-option-title">{opt.label}</span>
                            <span className="audit-role-option-desc">
                              {opt.portalAccessLabel} · {opt.kpiAccessLabel}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="audit-role-option-check">
                              <Check size={16} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {isEditingSelfOwner && (
                    <p className="audit-self-lock-note">
                      시스템 권한 관리자 본인의 권한 등급은 권한 잠김 방지를 위해 고정됩니다. (소속 부서 및 직책은 자유롭게 변경 가능)
                    </p>
                  )}
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label login-form-label">
                      <Building2 size={14} className="login-label-icon" /> 소속 부서 *
                    </label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="form-select"
                    >
                      {COMPANY_DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">직책 / 직급 *</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 경영기획 총괄 (전무)"
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {currentPresets.length > 0 && (
                  <div className="audit-position-presets">
                    <span className="audit-preset-label">빠른 직책 선택:</span>
                    {currentPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormPosition(preset)}
                        className={`audit-preset-chip ${
                          formPosition.trim() === preset ? 'is-active' : ''
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseRoleModal}
                  disabled={isSavingRole}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="btn btn-primary"
                >
                  {isSavingRole
                    ? '저장 중...'
                    : roleModalMode === 'edit'
                      ? '권한 · 직책 저장'
                      : '사전 계정 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 최범열 전용: 특정 회원 비밀번호 지정 모달 */}
      {canManage && targetUserForPw && (
        <div
          className="modal-overlay"
          onClick={() => setTargetUserForPw(null)}
        >
          <div
            className="modal-box app-pw-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">회원 비밀번호 재설정</h3>
              <button
                type="button"
                onClick={() => setTargetUserForPw(null)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveAdminPw}
              autoComplete="off"
              className="tasks-modal-form"
            >
              <div className="modal-body">
                <div className="kpi-modal-target-summary">
                  <strong>
                    대상 회원: {targetUserForPw.name} ({targetUserForPw.department})
                  </strong>
                  <span>
                    해당 회원의 새 비밀번호를 직접 지정합니다.
                  </span>
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label login-form-label">
                      <KeyRound size={14} className="login-label-icon" /> 새 비밀번호 지정 *
                    </label>
                    <input
                      type="password"
                      required
                      readOnly
                      onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
                      autoComplete="new-password"
                      placeholder="새 비밀번호 입력"
                      value={adminNewPw}
                      onChange={(e) => setAdminNewPw(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label login-form-label">
                      <KeyRound size={14} className="login-label-icon" /> 새 비밀번호 확인 *
                    </label>
                    <input
                      type="password"
                      required
                      readOnly
                      onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
                      autoComplete="new-password"
                      placeholder="새 비밀번호 재입력"
                      value={adminNewPwConfirm}
                      onChange={(e) => setAdminNewPwConfirm(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setTargetUserForPw(null)}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  비밀번호 지정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
