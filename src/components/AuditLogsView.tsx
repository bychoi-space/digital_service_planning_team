import React, { useState } from 'react';
import type { AuditLog, AuditAction, User } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  KeyRound,
  RotateCcw,
  X,
} from 'lucide-react';

interface AuditLogsViewProps {
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ onShowToast }) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => PlanningStorageService.getAuditLogs());
  const [users, setUsers] = useState<User[]>(() => PlanningStorageService.getUsers());
  const [filterType, setFilterType] = useState<string>('all');

  // 관리자 전용 특정 회원 비밀번호 직접 지정 모달 상태 (초기값 빈 값 유지)
  const [targetUserForPw, setTargetUserForPw] = useState<User | null>(null);
  const [adminNewPw, setAdminNewPw] = useState('');
  const [adminNewPwConfirm, setAdminNewPwConfirm] = useState('');

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const handleRefresh = () => {
    setLogs(PlanningStorageService.getAuditLogs());
    setUsers(PlanningStorageService.getUsers());
    notify('회원 목록 및 감사 로그가 새로고침되었습니다.', 'info');
  };

  // 관리자: 회원 비밀번호 직접 지정 모달 열기
  const handleOpenAdminPwModal = (user: User) => {
    setTargetUserForPw(user);
    setAdminNewPw('');
    setAdminNewPwConfirm('');
  };

  // 관리자: 회원 비밀번호 직접 지정 저장
  const handleSaveAdminPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPw) return;

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

  // 관리자: 회원 비밀번호 즉시 초기화 (다음 로그인 시 입력하는 비밀번호로 자동 설정)
  const handleResetToBlank = async (user: User) => {
    if (
      !window.confirm(
        `정말 '${user.name} (${user.department})' 회원의 비밀번호를 초기화하시겠습니까?\n\n초기화 후 해당 회원이 다음 로그인 시 입력하는 비밀번호가 새 비밀번호로 자동 등록됩니다.`
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

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.entityType === filterType;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <span className="audit-action-badge is-create">등록 (CREATE)</span>;
      case 'UPDATE':
        return <span className="audit-action-badge is-update">수정 (UPDATE)</span>;
      case 'DELETE':
        return <span className="audit-action-badge is-delete">삭제 (DELETE)</span>;
      case 'LOGIN':
        return <span className="audit-action-badge is-login">접속 (LOGIN)</span>;
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
      case 'auth':
        return '인증/세션';
      default:
        return type;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return '관리자';
    if (role === 'member') return '기획팀원';
    return '유관부서';
  };

  return (
    <div className="audit-container">
      {/* 1. 관리자 전용: 전체 가입 회원 조회 및 비밀번호 초기화 관리 섹션 */}
      <div className="card audit-users-card">
        <div className="audit-users-header">
          <div className="audit-header-info">
            <div className="audit-header-icon is-users">
              <Users size={22} />
            </div>
            <div className="audit-header-text">
              <h2 className="audit-header-title">
                가입 회원 계정 및 비밀번호 관리 (총 {users.length}명)
              </h2>
              <p className="audit-header-desc">
                관리자(최범열) 전용 메뉴입니다. 비밀번호 분실 문의 시 회원의 비밀번호를 직접 재설정하거나 초기화할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary audit-refresh-btn"
          >
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>

        {/* 데스크톱 회원 목록 테이블 */}
        <div className="audit-table-scroll">
          <table className="audit-table">
            <thead>
              <tr>
                <th>성명</th>
                <th>소속 부서</th>
                <th>권한 구분</th>
                <th>비밀번호 상태</th>
                <th className="audit-col-user-actions">비밀번호 관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="audit-table-row">
                  <td className="audit-actor-name">{u.name}</td>
                  <td>{u.department}</td>
                  <td>
                    <span className="audit-entity-chip">{getRoleLabel(u.role)}</span>
                  </td>
                  <td>
                    {u.password ? (
                      <span className="audit-pw-status is-set">설정됨</span>
                    ) : (
                      <span className="audit-pw-status is-reset">초기화 상태 (첫 로그인 시 설정)</span>
                    )}
                  </td>
                  <td>
                    <div className="audit-user-action-btns">
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
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="audit-td-empty">
                    등록된 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 회원 카드 리스트 */}
        <div className="audit-mobile-list">
          {users.map((u) => (
            <div key={u.id} className="audit-mobile-card">
              <div className="audit-mobile-top">
                <div className="audit-mobile-badges">
                  <strong className="audit-actor-name">{u.name}</strong>
                  <span className="audit-entity-chip">{u.department}</span>
                  <span className="audit-entity-chip">{getRoleLabel(u.role)}</span>
                </div>
                {u.password ? (
                  <span className="audit-pw-status is-set">비밀번호 설정됨</span>
                ) : (
                  <span className="audit-pw-status is-reset">초기화 상태</span>
                )}
              </div>
              <div className="audit-user-action-btns is-mobile">
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
            </div>
          ))}
        </div>
      </div>

      {/* 2. 감사 로그 필터 및 안내 카드 */}
      <div className="card audit-header-card">
        <div className="audit-header-info">
          <div className="audit-header-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="audit-header-text">
            <h2 className="audit-header-title">
              시스템 감사 로그 및 변경 이력 추적
            </h2>
            <p className="audit-header-desc">
              데이터 무결성 확보를 위해 업무, 일정, KPI, 업무 관련 정보, 계정의 등록·수정·삭제 이력이 기록됩니다.
            </p>
          </div>
        </div>

        <div className="audit-header-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select audit-filter-select"
            aria-label="감사 로그 영역 필터"
          >
            <option value="all">전체 항목 ({logs.length})</option>
            <option value="task">업무 변경</option>
            <option value="vacation">일정/휴가 변경</option>
            <option value="kpi">KPI 변경</option>
            <option value="work_info">업무관련정보 변경</option>
            <option value="auth">계정/로그인/비밀번호</option>
          </select>
        </div>
      </div>

      {/* 3-A. 데스크톱 & 태블릿용 감사 로그 타임라인 테이블 */}
      <div className="card audit-table-card">
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
              {filteredLogs.map((log) => (
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
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="audit-td-empty">
                    해당 조건의 감사 로그 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3-B. 모바일 전용 카드 리스트 */}
        <div className="audit-mobile-list">
          {filteredLogs.length === 0 ? (
            <div className="audit-td-empty">해당 조건의 감사 로그 이력이 없습니다.</div>
          ) : (
            filteredLogs.map((log) => (
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
      </div>

      {/* 4. 관리자 전용: 특정 회원 비밀번호 지정 모달 */}
      {targetUserForPw && (
        <div
          className="modal-overlay"
          onClick={() => setTargetUserForPw(null)}
        >
          <div
            className="modal-box app-pw-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">회원 비밀번호 재설정 (관리자 권한)</h3>
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
                    관리자 권한으로 해당 회원의 새 비밀번호를 직접 지정합니다.
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
