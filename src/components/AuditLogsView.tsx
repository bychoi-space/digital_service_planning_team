import React, { useState } from 'react';
import type { AuditLog, AuditAction } from '../types';
import { PlanningStorageService } from '../services/storage';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => PlanningStorageService.getAuditLogs());
  const [filterType, setFilterType] = useState<string>('all');

  const handleRefresh = () => {
    setLogs(PlanningStorageService.getAuditLogs());
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
      {/* 1. 상단 안내 및 필터 카드 */}
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
              데이터 무결성 확보를 위해 업무, 일정, KPI, 업무 관련 정보의 등록·수정·삭제 시 작업자와 일시가 기록됩니다.
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
            <option value="auth">계정/로그인</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-secondary audit-refresh-btn"
          >
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </div>

      {/* 2-A. 데스크톱 & 태블릿용 감사 로그 타임라인 테이블 */}
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

        {/* 2-B. 모바일 전용 카드 리스트 */}
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
    </div>
  );
};
