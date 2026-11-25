import React, { useState } from 'react';
import type { KpiCycleSchedule, KpiQuarter } from '../../types';
import {
  computeDefaultKpiCycleSchedule,
  formatCycleFullLabel,
} from './kpiSchedule';
import { Calendar, RotateCcw, X } from 'lucide-react';

interface KpiScheduleEditModalProps {
  year: number;
  quarter: KpiQuarter;
  initialSchedule: KpiCycleSchedule;
  onClose: () => void;
  onSave: (nextSchedule: KpiCycleSchedule) => Promise<void> | void;
  onResetToDefault: () => Promise<void> | void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const KpiScheduleEditModal: React.FC<KpiScheduleEditModalProps> = ({
  year,
  quarter,
  initialSchedule,
  onClose,
  onSave,
  onResetToDefault,
  onShowToast,
}) => {
  const [draft, setDraft] = useState<KpiCycleSchedule>(() => ({
    ...initialSchedule,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const cycleLabel = formatCycleFullLabel(year, quarter);

  const validateRange = (label: string, start: string, end: string): boolean => {
    if (!start || !end) {
      onShowToast?.(`${label}의 시작일과 종료일을 모두 입력해 주세요.`, 'error');
      return false;
    }
    if (start > end) {
      onShowToast?.(`${label}의 종료일은 시작일보다 이전일 수 없습니다.`, 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validateRange('목표 수행 · 매핑 기간', draft.execStart, draft.execEnd) ||
      !validateRange('1주차 본인 자가평가', draft.selfEvalStart, draft.selfEvalEnd) ||
      !validateRange('2주차 협업 다면평가', draft.peerEvalStart, draft.peerEvalEnd) ||
      !validateRange('3주차 팀장 1차평가', draft.leaderEvalStart, draft.leaderEvalEnd) ||
      !validateRange('4주차 실장 최종평가', draft.finalEvalStart, draft.finalEvalEnd)
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...draft,
        goalSetupStart: draft.execStart,
        goalSetupEnd: draft.execStart,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const defaults = computeDefaultKpiCycleSchedule(year, quarter);
    setDraft(defaults);
    setIsSaving(true);
    try {
      await onResetToDefault();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box kpi-schedule-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="tasks-modal-header-left">
            <Calendar size={18} className="kpi-framework-icon" />
            <h3 className="modal-title">{cycleLabel} KPI 공식 일정 조정</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tasks-modal-close-btn"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tasks-modal-form">
          <div className="modal-body">
            <div className="kpi-schedule-edit-grid">
              <div className="kpi-schedule-edit-row">
                <div className="kpi-schedule-edit-label">
                  <span className="kpi-schedule-step-pill is-exec">본 수행</span>
                  <strong>과제 수행 · 매핑 기간</strong>
                </div>
                <div className="kpi-schedule-date-pair">
                  <input
                    type="date"
                    required
                    value={draft.execStart}
                    onChange={(e) =>
                      setDraft({ ...draft, execStart: e.target.value })
                    }
                    className="form-input"
                  />
                  <span className="kpi-schedule-tilde">~</span>
                  <input
                    type="date"
                    required
                    value={draft.execEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, execEnd: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="kpi-schedule-edit-row">
                <div className="kpi-schedule-edit-label">
                  <span className="kpi-schedule-step-pill is-eval">평가 1주차</span>
                  <strong>본인 수행실적 · 자가평가</strong>
                </div>
                <div className="kpi-schedule-date-pair">
                  <input
                    type="date"
                    required
                    value={draft.selfEvalStart}
                    onChange={(e) =>
                      setDraft({ ...draft, selfEvalStart: e.target.value })
                    }
                    className="form-input"
                  />
                  <span className="kpi-schedule-tilde">~</span>
                  <input
                    type="date"
                    required
                    value={draft.selfEvalEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, selfEvalEnd: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="kpi-schedule-edit-row">
                <div className="kpi-schedule-edit-label">
                  <span className="kpi-schedule-step-pill is-eval">평가 2주차</span>
                  <strong>동료 · 유관부서 다면평가</strong>
                </div>
                <div className="kpi-schedule-date-pair">
                  <input
                    type="date"
                    required
                    value={draft.peerEvalStart}
                    onChange={(e) =>
                      setDraft({ ...draft, peerEvalStart: e.target.value })
                    }
                    className="form-input"
                  />
                  <span className="kpi-schedule-tilde">~</span>
                  <input
                    type="date"
                    required
                    value={draft.peerEvalEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, peerEvalEnd: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="kpi-schedule-edit-row">
                <div className="kpi-schedule-edit-label">
                  <span className="kpi-schedule-step-pill is-eval">평가 3주차</span>
                  <strong>서비스기획팀장 1차 평가</strong>
                </div>
                <div className="kpi-schedule-date-pair">
                  <input
                    type="date"
                    required
                    value={draft.leaderEvalStart}
                    onChange={(e) =>
                      setDraft({ ...draft, leaderEvalStart: e.target.value })
                    }
                    className="form-input"
                  />
                  <span className="kpi-schedule-tilde">~</span>
                  <input
                    type="date"
                    required
                    value={draft.leaderEvalEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, leaderEvalEnd: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="kpi-schedule-edit-row">
                <div className="kpi-schedule-edit-label">
                  <span className="kpi-schedule-step-pill is-eval">평가 4주차</span>
                  <strong>디지털마케팅실장 최종평가</strong>
                </div>
                <div className="kpi-schedule-date-pair">
                  <input
                    type="date"
                    required
                    value={draft.finalEvalStart}
                    onChange={(e) =>
                      setDraft({ ...draft, finalEvalStart: e.target.value })
                    }
                    className="form-input"
                  />
                  <span className="kpi-schedule-tilde">~</span>
                  <input
                    type="date"
                    required
                    value={draft.finalEvalEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, finalEvalEnd: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleReset}
              className="btn btn-secondary tasks-modal-delete-btn"
            >
              <RotateCcw size={14} /> 표준 자동 일정으로 복원
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="btn btn-secondary"
            >
              취소
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? '저장 중...' : '기수 일정 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
