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
        return <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>등록 (CREATE)</span>;
      case 'UPDATE':
        return <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>수정 (UPDATE)</span>;
      case 'DELETE':
        return <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>삭제 (DELETE)</span>;
      case 'LOGIN':
        return <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>접속 (LOGIN)</span>;
      default:
        return <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{action}</span>;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'task': return '업무관리';
      case 'vacation': return '휴가일정';
      case 'kpi': return 'KPI평가';
      case 'auth': return '인증/세션';
      default: return type;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. 상단 안내 카드 */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              시스템 감사 로그 및 변경 이력 추적 (Audit Trail)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              데이터 무결성 확보를 위해 업무, 휴가, KPI의 등록/수정/삭제 시 작업자와 일시가 영구 보존됩니다.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select"
            style={{ width: '140px', padding: '6px 12px', fontSize: '13px' }}
          >
            <option value="all">전체 항목</option>
            <option value="task">업무 변경</option>
            <option value="vacation">휴가 변경</option>
            <option value="kpi">KPI 변경</option>
            <option value="auth">계정/로그인</option>
          </select>

          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      </div>

      {/* 2. 감사 로그 타임라인 테이블 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '14px 18px', fontWeight: 600, width: '160px' }}>발생 일시</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, width: '110px' }}>작업 구분</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, width: '100px' }}>영역</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, width: '160px' }}>수행자 (Actor)</th>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>변경 내용 및 요약</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleString('ko-KR')}
                </td>
                <td style={{ padding: '14px 18px' }}>{getActionBadge(log.action)}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {getEntityLabel(log.entityType)}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.actorName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {log.actorRole === 'admin' ? '관리자' : log.actorRole === 'member' ? '기획팀원' : '유관부서'}
                  </div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{log.entityTitle}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {log.summary}
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  해당 조건의 감사 로그 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
