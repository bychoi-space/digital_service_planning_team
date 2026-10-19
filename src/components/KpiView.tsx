import React, { useState } from 'react';
import type { KpiItem, KpiQuarter, KpiStatus, KpiTargetScope, User } from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Plus,
  Award,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';

interface KpiViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const QUARTERS: { key: KpiQuarter; label: string }[] = [
  { key: 'Annual', label: '2026 연간 종합' },
  { key: 'Q4', label: '2026년 4분기 (현재)' },
  { key: 'Q3', label: '2026년 3분기' },
  { key: 'Q2', label: '2026년 2분기' },
  { key: 'Q1', label: '2026년 1분기' },
];

const STATUS_MAP: Record<KpiStatus, { label: string; color: string; bg: string }> = {
  planning: { label: '목표수립', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: '점검/진행중', color: '#2563eb', bg: '#eff6ff' },
  achieved: { label: '목표달성', color: '#059669', bg: '#ecfdf5' },
  partially_achieved: { label: '부분달성', color: '#d97706', bg: '#fffbeb' },
  missed: { label: '미달성', color: '#ef4444', bg: '#fee2e2' },
};

export const KpiView: React.FC<KpiViewProps> = ({ isViewer, onShowToast }) => {
  const [kpis, setKpis] = useState<KpiItem[]>(() => PlanningStorageService.getKpis());
  const [selectedQuarter, setSelectedQuarter] = useState<KpiQuarter>('Annual');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'team' | 'individual'>('all');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiItem | null>(null);

  const teamMembers = PlanningStorageService.getUsers().filter((u) => u.role !== 'viewer');

  const [formData, setFormData] = useState({
    year: 2026,
    quarter: 'Annual' as KpiQuarter,
    targetScope: 'team' as KpiTargetScope,
    ownerName: '디지털서비스기획팀 전체',
    title: '',
    targetMetric: '',
    targetValue: '',
    currentValue: '',
    weight: 20,
    achievementRate: 0,
    status: 'in_progress' as KpiStatus,
    selfEvaluation: '',
    finalEvaluation: '',
    evaluatorName: '김기획 (팀장)',
  });

  const refreshKpis = () => {
    setKpis(PlanningStorageService.getKpis());
  };

  // 모달 열기 (신규 등록)
  const handleOpenCreateModal = () => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 KPI를 등록할 수 없습니다.', 'error');
      return;
    }
    setEditingKpi(null);
    setFormData({
      year: 2026,
      quarter: selectedQuarter,
      targetScope: 'team',
      ownerName: '디지털서비스기획팀 전체',
      title: '',
      targetMetric: '',
      targetValue: '',
      currentValue: '',
      weight: 20,
      achievementRate: 50,
      status: 'in_progress',
      selfEvaluation: '',
      finalEvaluation: '',
      evaluatorName: '김기획 (팀장)',
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 or 상세)
  const handleOpenEditModal = (item: KpiItem) => {
    setEditingKpi(item);
    setFormData({
      year: item.year,
      quarter: item.quarter,
      targetScope: item.targetScope,
      ownerName: item.ownerName,
      title: item.title,
      targetMetric: item.targetMetric,
      targetValue: item.targetValue,
      currentValue: item.currentValue,
      weight: item.weight,
      achievementRate: item.achievementRate,
      status: item.status,
      selfEvaluation: item.selfEvaluation || '',
      finalEvaluation: item.finalEvaluation || '',
      evaluatorName: item.evaluatorName || '김기획 (팀장)',
    });
    setIsModalOpen(true);
  };

  // 저장
  const handleSaveKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!formData.title.trim()) {
      onShowToast('KPI 목표명을 입력해 주세요.', 'error');
      return;
    }

    try {
      if (editingKpi) {
        PlanningStorageService.updateKpi(editingKpi.id, {
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: formData.targetScope,
          ownerName: formData.ownerName,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric,
          targetValue: formData.targetValue,
          currentValue: formData.currentValue,
          weight: Number(formData.weight),
          achievementRate: Number(formData.achievementRate),
          status: formData.status,
          selfEvaluation: formData.selfEvaluation,
          finalEvaluation: formData.finalEvaluation,
          evaluatorName: formData.evaluatorName,
        });
        onShowToast('KPI 정보 및 평가 내역이 갱신되었습니다.', 'success');
      } else {
        PlanningStorageService.createKpi({
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: formData.targetScope,
          ownerName: formData.ownerName,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric,
          targetValue: formData.targetValue,
          currentValue: formData.currentValue,
          weight: Number(formData.weight),
          achievementRate: Number(formData.achievementRate),
          status: formData.status,
          selfEvaluation: formData.selfEvaluation,
          finalEvaluation: formData.finalEvaluation,
          evaluatorName: formData.evaluatorName,
        });
        onShowToast('새로운 KPI 목표가 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
      refreshKpis();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '처리 중 오류 발생';
      onShowToast(msg, 'error');
    }
  };

  // 삭제
  const handleDeleteKpi = (id: string, title: string) => {
    if (isViewer) return;
    if (window.confirm(`정말 "${title}" KPI 항목을 삭제하시겠습니까?`)) {
      PlanningStorageService.deleteKpi(id);
      onShowToast('KPI 항목이 삭제되었습니다.', 'info');
      setIsModalOpen(false);
      refreshKpis();
    }
  };

  // 현재 탭에 맞는 KPI 목록 필터링
  const currentKpis = kpis.filter((k) => {
    const matchesQuarter = selectedQuarter === 'Annual' ? true : k.quarter === selectedQuarter || k.quarter === 'Annual';
    const matchesScope = scopeFilter === 'all' || k.targetScope === scopeFilter;
    return matchesQuarter && matchesScope;
  });

  // 종합 달성률 (가중 평균 계산)
  const totalWeight = currentKpis.reduce((acc, cur) => acc + (cur.weight || 0), 0);
  const weightedScore = currentKpis.reduce((acc, cur) => acc + (cur.achievementRate * cur.weight) / 100, 0);
  const normalizedTotalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. 상단 KPI 종합 대시보드 배너 */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            <Award size={16} /> 2026 서비스기획팀 성과 지표
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            {selectedQuarter === 'Annual' ? '2026 연간 종합 KPI 달성도' : `${selectedQuarter} 분기 KPI 진행 현황`}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            등록된 주요 과제 {currentKpis.length}건 / 가중치 합계 {totalWeight}%
          </p>
        </div>

        {/* 달성률 프로그레스 게이지 */}
        <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>종합 가중 달성률</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#60a5fa' }}>{normalizedTotalScore}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${normalizedTotalScore}%`,
                height: '100%',
                background: normalizedTotalScore >= 80 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* 신규 등록 액션 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            disabled={isViewer}
            style={{ padding: '10px 18px', fontSize: '14px' }}
            title={isViewer ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다' : 'KPI 등록'}
          >
            <Plus size={16} /> 신규 KPI 목표 등록
          </button>
        </div>
      </div>

      {/* 2. 분기 탭 및 범위 필터 */}
      <div
        className="card"
        style={{
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* 분기 선택 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUARTERS.map((q) => (
            <button
              key={q.key}
              onClick={() => setSelectedQuarter(q.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: selectedQuarter === q.key ? '#2563eb' : '#f1f5f9',
                color: selectedQuarter === q.key ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* 팀/개인 구분 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>범위:</span>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as 'all' | 'team' | 'individual')}
            className="form-select"
            style={{ width: '130px', padding: '6px 10px', fontSize: '12.5px' }}
          >
            <option value="all">전체 (팀+개인)</option>
            <option value="team">팀 공통 과제</option>
            <option value="individual">개인별 과제</option>
          </select>
        </div>
      </div>

      {/* 3. KPI 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {currentKpis.map((kpi) => {
          const statusCfg = STATUS_MAP[kpi.status] || STATUS_MAP.in_progress;
          return (
            <div
              key={kpi.id}
              className="card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderLeft: `4px solid ${statusCfg.color}`,
              }}
            >
              {/* 상단 메타 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {kpi.quarter}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: kpi.targetScope === 'team' ? '#e0e7ff' : '#fef3c7',
                      color: kpi.targetScope === 'team' ? '#3730a3' : '#b45309',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {kpi.targetScope === 'team' ? '팀 공통' : '개인'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {kpi.ownerName}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {statusCfg.label}
                </span>
              </div>

              {/* 목표 제목 */}
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {kpi.title}
              </h3>

              {/* 측정 지표 및 수치 비교 */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>측정 지표:</strong> {kpi.targetMetric}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                  <span>목표치: <strong style={{ color: 'var(--text-main)' }}>{kpi.targetValue}</strong></span>
                  <span>현재치: <strong style={{ color: '#2563eb' }}>{kpi.currentValue}</strong></span>
                </div>
              </div>

              {/* 달성률 & 가중치 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                    가중치: {kpi.weight}%
                  </span>
                  <span style={{ fontWeight: 800, color: kpi.achievementRate >= 80 ? '#059669' : '#2563eb' }}>
                    달성률 {kpi.achievementRate}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${kpi.achievementRate}%`,
                      height: '100%',
                      background: kpi.achievementRate >= 80 ? '#10b981' : '#2563eb',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* 평가 코멘트 미리보기 */}
              {(kpi.selfEvaluation || kpi.finalEvaluation) && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                  {kpi.finalEvaluation ? (
                    <div>
                      <strong style={{ color: '#166534' }}>[팀장/최종평가]</strong> {kpi.finalEvaluation}
                    </div>
                  ) : (
                    <div>
                      <strong style={{ color: '#166534' }}>[자가점검]</strong> {kpi.selfEvaluation}
                    </div>
                  )}
                </div>
              )}

              {/* 하단 관리 버튼 */}
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  평가자: {kpi.evaluatorName || '팀장'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenEditModal(kpi)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <Edit3 size={13} /> {isViewer ? '상세 조회' : '점검 및 평가'}
                  </button>
                  {!isViewer && (
                    <button
                      onClick={() => handleDeleteKpi(kpi.id, kpi.title)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. KPI 등록/수정/평가 모달 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingKpi
                  ? isViewer
                    ? 'KPI 상세 정보 (읽기 전용)'
                    : 'KPI 목표 수정 및 성과 점검/평가'
                  : '신규 KPI 목표 수립'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveKpi}>
              <div className="modal-body">
                {/* 1. 목표명 */}
                <div className="form-group">
                  <label className="form-label">KPI 목표명 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 원클릭 간편결제 런칭 및 구매 전환율 2.5%p 개선"
                    className="form-input"
                  />
                </div>

                {/* 2. 대상 범위, 담당자, 분기 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">평가 기간</label>
                    <select
                      disabled={isViewer}
                      value={formData.quarter}
                      onChange={(e) => setFormData({ ...formData, quarter: e.target.value as KpiQuarter })}
                      className="form-select"
                    >
                      {QUARTERS.map((q) => (
                        <option key={q.key} value={q.key}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">과제 성격</label>
                    <select
                      disabled={isViewer}
                      value={formData.targetScope}
                      onChange={(e) => {
                        const scope = e.target.value as KpiTargetScope;
                        setFormData({
                          ...formData,
                          targetScope: scope,
                          ownerName: scope === 'team' ? '디지털서비스기획팀 전체' : teamMembers[0]?.name || '',
                        });
                      }}
                      className="form-select"
                    >
                      <option value="team">팀 공통 과제</option>
                      <option value="individual">개인별 과제</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">과제 주체</label>
                    {formData.targetScope === 'team' ? (
                      <input
                        type="text"
                        disabled
                        value="디지털서비스기획팀 전체"
                        className="form-input"
                      />
                    ) : (
                      <select
                        disabled={isViewer}
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="form-select"
                      >
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 3. 측정 지표 */}
                <div className="form-group">
                  <label className="form-label">측정 기준 및 산출 지표 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    value={formData.targetMetric}
                    onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
                    placeholder="예: 체크아웃 최종 결제 전환율(CVR) 및 이탈률 트래킹"
                    className="form-input"
                  />
                </div>

                {/* 4. 목표치 & 현재치 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">목표치 *</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      required
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      placeholder="예: CVR 65% 이상"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">현재 달성 수치</label>
                    <input
                      type="text"
                      disabled={isViewer}
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                      placeholder="예: 63.8% (베타 테스트 중)"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 5. 가중치, 달성률, 상태 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">가중치 (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      disabled={isViewer}
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">달성률 ({formData.achievementRate}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      disabled={isViewer}
                      value={formData.achievementRate}
                      onChange={(e) => setFormData({ ...formData, achievementRate: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">진행 상태</label>
                    <select
                      disabled={isViewer}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as KpiStatus })}
                      className="form-select"
                    >
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. 점검 및 평가 코멘트 */}
                <div className="form-group">
                  <label className="form-label">자가 점검 / 추진 경과 코멘트</label>
                  <textarea
                    disabled={isViewer}
                    rows={2}
                    value={formData.selfEvaluation}
                    onChange={(e) => setFormData({ ...formData, selfEvaluation: e.target.value })}
                    placeholder="담당자 자가 점검 및 마일스톤 진척 상황..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">팀장 / 최종 평가 의견</label>
                  <textarea
                    disabled={isViewer}
                    rows={2}
                    value={formData.finalEvaluation}
                    onChange={(e) => setFormData({ ...formData, finalEvaluation: e.target.value })}
                    placeholder="평가자 종합 의견 및 피드백..."
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                {editingKpi && !isViewer && (
                  <button
                    type="button"
                    onClick={() => handleDeleteKpi(editingKpi.id, editingKpi.title)}
                    className="btn btn-danger"
                    style={{ marginRight: 'auto' }}
                  >
                    <Trash2 size={15} /> 삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {isViewer ? '닫기' : '취소'}
                </button>
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    {editingKpi ? '평가 및 정보 갱신' : '목표 등록'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
