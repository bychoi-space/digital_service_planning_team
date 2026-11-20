import React from 'react';
import type { KpiItem, TaskItem, User } from '../../types';
import {
  QUARTERS,
  TRACK_CONFIG,
  checkHasSelfEval,
  getKpiEvalMetrics,
  getKpiLifecycleBadge,
  getValidFinalComment,
  getValidFinalGrade,
  getValidLeaderGrade,
  isLeaderOwnedKpiItem,
  resolveSelfGrade,
} from './kpiShared';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit2,
  ExternalLink,
  Link as LinkIcon,
  MessageSquare,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface KpiDetailPageProps {
  item: KpiItem;
  currentUser: User;
  linkedTasks: TaskItem[];
  isSelf: boolean;
  canEditGoal: boolean;
  isTeamLead: boolean;
  isDivisionHead: boolean;
  isExecutiveViewer: boolean;
  onBackToList: () => void;
  onOpenEditGoal: (kpi: KpiItem) => void;
  onDeleteGoal: (id: string, title: string) => void;
  onOpenTaskMapping: (kpi: KpiItem) => void;
  onOpenSelfEval: (kpi: KpiItem) => void;
  onOpenPeerEval: (kpi: KpiItem) => void;
  onOpenLeaderEval: (kpi: KpiItem) => void;
  onOpenDirectorEval: (kpi: KpiItem) => void;
}

export const KpiDetailPage: React.FC<KpiDetailPageProps> = ({
  item,
  currentUser,
  linkedTasks,
  isSelf,
  canEditGoal,
  isTeamLead,
  isDivisionHead,
  isExecutiveViewer,
  onBackToList,
  onOpenEditGoal,
  onDeleteGoal,
  onOpenTaskMapping,
  onOpenSelfEval,
  onOpenPeerEval,
  onOpenLeaderEval,
  onOpenDirectorEval,
}) => {
  const trackCfg = TRACK_CONFIG[item.track || '기획'] || TRACK_CONFIG['기획'];
  const TrackIcon = trackCfg.icon;
  const lifecycleBadge = getKpiLifecycleBadge(item);
  const hasSelfEvaluated = checkHasSelfEval(item);
  const isLeaderKpi = isLeaderOwnedKpiItem(item);
  const leaderGrade = getValidLeaderGrade(item);
  const finalGrade = getValidFinalGrade(item);
  const selfGrade = resolveSelfGrade(item.selfScore);
  const evalMetrics = getKpiEvalMetrics(item);
  const doneLinkedCount = linkedTasks.filter((t) => t.status === 'done').length;

  const peerReviews = item.peerReviews || [];
  const peerCount = peerReviews.length;
  const myPeerReview = peerReviews.find(
    (p) => String(p.reviewerId) === String(currentUser.id)
  );
  const avgQuality =
    peerCount > 0
      ? (
          peerReviews.reduce((acc, r) => acc + Number(r.scoreQuality || 5), 0) / peerCount
        ).toFixed(1)
      : '0.0';
  const avgCollab =
    peerCount > 0
      ? (
          peerReviews.reduce((acc, r) => acc + Number(r.scoreCollaboration || 5), 0) /
          peerCount
        ).toFixed(1)
      : '0.0';
  const avgTotal =
    peerCount > 0
      ? item.peerAvgScore ??
        Number(((Number(avgQuality) + Number(avgCollab)) / 2).toFixed(1))
      : 0;
  const finalComment = getValidFinalComment(item);
  const finalStepNum = isLeaderKpi ? 'STEP 3' : 'STEP 4';

  return (
    <div className="kpi-detail-view">
      {/* 상세 페이지 상단 네비게이션 바 */}
      <div className="kpi-detail-topbar">
        <button
          type="button"
          onClick={onBackToList}
          className="btn btn-secondary kpi-back-btn"
        >
          <ArrowLeft size={16} /> KPI 목록으로 돌아가기
        </button>

        {canEditGoal && (
          <div className="tasks-row-actions">
            <button
              type="button"
              onClick={() => onOpenEditGoal(item)}
              className="btn btn-secondary tasks-action-btn"
              title="목표 수정"
            >
              <Edit2 size={14} /> 목표 수정
            </button>
            <button
              type="button"
              onClick={() => onDeleteGoal(item.id, item.title)}
              className="btn btn-secondary tasks-delete-icon-btn"
              title="목표 삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 섹션 1. KPI 목표 타이틀 & 핵심 스코어 요약 & 측정/달성 기준(DoD) 카드 */}
      <div className={`card kpi-detail-hero-card ${trackCfg.classKey}`}>
        <div className="kpi-detail-hero-top">
          <div className="kpi-detail-hero-main">
            <div className="tasks-card-badges">
              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                <TrackIcon size={13} /> {trackCfg.label}
              </span>
              <span className="tasks-badge-category">
                {item.targetScope === 'team' ? '팀 공통' : item.ownerName}
              </span>
              <span className="kpi-weight-badge">
                {QUARTERS.find((q) => q.key === (item.quarter || 'Annual'))?.label ||
                  '2026 연간 종합'}
              </span>
              <span className={`kpi-status-badge ${lifecycleBadge.classKey}`}>
                {lifecycleBadge.label}
              </span>
            </div>
            <h2 className="kpi-detail-title">{item.title}</h2>
          </div>

          {/* 우측 핵심 평가 스코어 요약 박스 */}
          <div
            className={`kpi-detail-score-strip ${isLeaderKpi ? 'is-four-col' : 'is-five-col'}`}
          >
            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">배점 가중치</span>
              <strong className="kpi-detail-score-val">{item.weight}%</strong>
            </div>

            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">본인 자가진단</span>
              <strong className="kpi-detail-score-val is-self">
                {hasSelfEvaluated && selfGrade ? `${selfGrade}등급` : '미등록'}
              </strong>
            </div>

            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">협업 다면평가</span>
              <strong className="kpi-detail-score-val is-peer">
                {peerCount > 0 ? `${avgTotal}점 (${peerCount}명)` : '대기 (0명)'}
              </strong>
            </div>

            {!isLeaderKpi && (
              <div className="kpi-detail-score-box">
                <span className="kpi-detail-score-label">팀장 1차평가</span>
                <strong className="kpi-detail-score-val is-leader">
                  {leaderGrade ? `${leaderGrade}등급` : '미등록'}
                </strong>
              </div>
            )}

            <div className="kpi-detail-score-box is-final-box">
              <span className="kpi-detail-score-label">실장 최종평가</span>
              <strong className="kpi-detail-score-val is-final">
                {finalGrade
                  ? `${finalGrade}등급 (${evalMetrics.weightedPoint}/${item.weight}점)`
                  : '미확정'}
              </strong>
            </div>
          </div>
        </div>

        {/* 하단 측정 기준(Metric) & 완료/달성 기준(DoD) */}
        <div className="kpi-detail-criteria-grid">
          <div className="kpi-detail-criteria-item">
            <span className="kpi-detail-criteria-label">측정 기준 (Metric)</span>
            <p className="kpi-detail-criteria-val">{item.targetMetric || '-'}</p>
          </div>

          <div className="kpi-detail-criteria-item is-dod">
            <span className="kpi-detail-criteria-label">
              완료/달성 기준 (DoD · A등급 기준)
            </span>
            <p className="kpi-detail-criteria-val is-target">{item.targetValue || '-'}</p>
          </div>
        </div>
      </div>

      {/* 섹션 2. 매핑된 실무 수행 근거 과제 */}
      <div className="card kpi-detail-section-card">
        <div className="kpi-detail-section-header">
          <div className="kpi-detail-section-title-wrap">
            <LinkIcon size={17} className="kpi-framework-icon" />
            <h3 className="kpi-detail-section-title">
              매핑된 실무 수행 근거 과제 ({linkedTasks.length}건)
            </h3>
            {linkedTasks.length > 0 && (
              <span className="kpi-evidence-summary-badge">
                완료 {doneLinkedCount} / 매핑 {linkedTasks.length}건
              </span>
            )}
          </div>

          {canEditGoal && (
            <button
              type="button"
              onClick={() => onOpenTaskMapping(item)}
              className="btn btn-secondary tasks-action-btn kpi-evidence-map-btn-lg"
            >
              <LinkIcon size={14} />{' '}
              {linkedTasks.length > 0 ? '실무 과제 매핑 편집' : '+ 실무 과제 매핑하기'}
            </button>
          )}
        </div>

        {linkedTasks.length === 0 ? (
          <div className="kpi-detail-empty-box">
            {canEditGoal
              ? '아직 이 KPI 목표에 매핑된 실무 수행 근거 과제가 없습니다. 우측 상단 [+ 실무 과제 매핑하기] 버튼을 눌러 업무를 연결해 주세요.'
              : '아직 담당자가 이 KPI 목표에 매핑한 실무 수행 근거 과제가 없습니다.'}
          </div>
        ) : (
          <div className="kpi-detail-task-list">
            {linkedTasks.map((t) => {
              const outUrl = t.links?.[0]?.url || t.artifactUrl;
              const isDone = t.status === 'done';
              return (
                <div key={t.id} className="kpi-detail-task-row">
                  <div className="kpi-detail-task-main">
                    <span
                      className={`kpi-detail-task-status ${isDone ? 'is-done' : 'is-progress'}`}
                    >
                      <CheckCircle2 size={14} />
                      {isDone ? '완료' : `진행중 (${t.progress ?? 0}%)`}
                    </span>
                    <a
                      href={`#/tasks/${encodeURIComponent(t.id)}`}
                      className="kpi-detail-task-title-link"
                    >
                      {t.title}
                    </a>
                    <span className="kpi-evidence-assignee">담당: {t.assigneeName}</span>
                  </div>

                  <div className="kpi-detail-task-meta">
                    <span className="kpi-evidence-date">
                      <Clock size={14} />{' '}
                      {t.startDate || t.dueDate
                        ? `${t.startDate || '미정'} ~ ${t.dueDate || '미정'}`
                        : '일정 미정'}
                    </span>
                    {outUrl && (
                      <a
                        href={outUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="kpi-detail-task-link"
                      >
                        산출물 확인 <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 섹션 3. 단계별 성과 평가 상세 워크플로우 */}
      <div className="kpi-eval-steps-grid is-detail-page">
        {/* STEP 1: 본인 수행 실적 및 자가평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            hasSelfEvaluated ? 'is-completed-self' : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-1">STEP 1</span>
              <span className="kpi-step-title">본인 수행 실적 및 자가평가</span>
              {hasSelfEvaluated && selfGrade ? (
                <span className={`kpi-grade-chip grade-${selfGrade.toLowerCase()}`}>
                  자가 {selfGrade}등급
                </span>
              ) : (
                <span className="kpi-step-pending-badge">미등록 (필수 선행)</span>
              )}
            </div>

            {isSelf && (
              <button
                type="button"
                onClick={() => onOpenSelfEval(item)}
                className={`btn ${hasSelfEvaluated ? 'btn-secondary' : 'btn-primary'} tasks-action-btn`}
              >
                <ClipboardCheck size={14} />{' '}
                {hasSelfEvaluated ? '실적 · 자가평가 수정' : '실적 · 자가평가 등록'}
              </button>
            )}
          </div>

          {hasSelfEvaluated ? (
            <div className="kpi-step-body is-detail is-two-col">
              <div className="kpi-detail-eval-content-box">
                <span className="kpi-step-field-label">수행 실적 요약</span>
                <p className="kpi-step-field-val is-detail">
                  {item.currentValue?.trim() || '-'}
                </p>
              </div>
              <div className="kpi-detail-eval-content-box">
                <span className="kpi-step-field-label">본인 자가평가 의견</span>
                <p className="kpi-step-field-val is-detail">
                  {item.selfEvaluation?.trim() || '등록된 자가평가 코멘트가 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="kpi-detail-empty-box">
              {isSelf
                ? '아직 수행 실적과 자가평가가 등록되지 않았습니다. 우측 상단 [실적 · 자가평가 등록] 버튼을 눌러 먼저 작성해 주세요.'
                : '담당자 본인의 수행 실적 및 자가평가 등록을 대기 중입니다.'}
            </div>
          )}
        </div>

        {/* STEP 2: 사내 · 유관부서 무기명 협업 다면평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            peerCount > 0 ? 'is-completed-peer' : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-2">STEP 2</span>
              <span className="kpi-step-title">
                사내 · 유관부서 무기명 협업 다면평가 ({peerCount}명 참여)
              </span>
              {peerCount > 0 ? (
                <span className="kpi-peer-score-chip">평균 {avgTotal} / 5.0점</span>
              ) : (
                <span className="kpi-step-pending-badge">참여 대기</span>
              )}
            </div>

            {!isSelf && !isDivisionHead && !isExecutiveViewer && (
              <button
                type="button"
                onClick={() => onOpenPeerEval(item)}
                className="btn btn-secondary tasks-action-btn kpi-peer-eval-btn"
              >
                <MessageSquare size={14} />{' '}
                {myPeerReview
                  ? '내 동료 피드백 수정 (무기명)'
                  : '동료 피드백 평가하기 (무기명)'}
              </button>
            )}
          </div>

          {peerCount === 0 ? (
            <div className="kpi-detail-empty-box">
              팀 동료 및 유관부서 협업 담당자가 무기명 피드백을 등록하면 평가자 신원 없이 집계 점수와 코멘트만 이곳에 표시됩니다.
            </div>
          ) : (
            <div className="kpi-step-body is-detail">
              <div className="kpi-peer-anon-scores">
                산출물 완성도 평균 <strong>{avgQuality}</strong>점 · 일정·소통 협업 평균{' '}
                <strong>{avgCollab}</strong>점
              </div>
              <div className="kpi-peer-anon-list">
                {peerReviews.map((pr, idx) => (
                  <div key={pr.id || idx} className="kpi-peer-anon-item">
                    <div className="kpi-peer-anon-item-head">
                      <span className="kpi-peer-anon-tag">익명 협업 피드백 #{idx + 1}</span>
                      <span className="kpi-peer-anon-subscore">
                        완성도 {pr.scoreQuality}점 · 소통 {pr.scoreCollaboration}점
                      </span>
                    </div>
                    <p className="kpi-peer-anon-comment">{pr.commentGood}</p>
                    {pr.commentImprove && (
                      <p className="kpi-peer-anon-improve">
                        보완/건의: {pr.commentImprove}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 (팀원 KPI인 경우에만 표시): 서비스기획팀장 1차 평가 */}
        {!isLeaderKpi && (
          <div
            className={`card kpi-eval-step-card is-detail ${
              leaderGrade
                ? 'is-completed-self'
                : !hasSelfEvaluated
                  ? 'is-locked'
                  : 'is-pending'
            }`}
          >
            <div className="kpi-eval-step-header">
              <div className="kpi-step-badge-wrap">
                <span className="kpi-step-num step-1">STEP 3</span>
                <span className="kpi-step-title">팀장 1차 평가 (서비스기획팀장)</span>
                {leaderGrade ? (
                  <span className={`kpi-grade-chip grade-${leaderGrade.toLowerCase()}`}>
                    1차 {leaderGrade}등급
                  </span>
                ) : !hasSelfEvaluated ? (
                  <span className="kpi-step-pending-badge is-locked">STEP 1 선행 필요</span>
                ) : (
                  <span className="kpi-step-pending-badge">1차 평가 대기</span>
                )}
              </div>

              {isTeamLead && (
                <button
                  type="button"
                  onClick={() => onOpenLeaderEval(item)}
                  disabled={!hasSelfEvaluated}
                  className={`btn ${hasSelfEvaluated ? 'btn-primary' : 'btn-secondary'} tasks-action-btn`}
                >
                  <UserCheck size={14} />{' '}
                  {!hasSelfEvaluated
                    ? '1차 평가 (자가평가 선행 필요)'
                    : leaderGrade
                      ? '팀장 1차 평가 수정'
                      : '팀장 1차 평가 등록'}
                </button>
              )}
            </div>

            {leaderGrade ? (
              <div className="kpi-step-body is-detail">
                <div className="kpi-detail-eval-content-box">
                  <span className="kpi-step-field-label">
                    서비스기획팀장 1차 평가 의견 ({item.leaderEvaluatorName || '최범열'})
                  </span>
                  <p className="kpi-step-field-val is-detail">
                    {item.leaderComment?.trim() || '등록된 1차 평가 코멘트가 없습니다.'}
                  </p>
                </div>
              </div>
            ) : !hasSelfEvaluated ? (
              <div className="kpi-detail-empty-box">
                STEP 1 [본인 수행 실적 및 자가평가]가 먼저 등록되어야 팀장 1차 평가를 진행할 수 있습니다.
              </div>
            ) : (
              <div className="kpi-detail-empty-box">
                서비스기획팀장(최범열 차장)의 1차 평가를 대기 중입니다.
              </div>
            )}
          </div>
        )}

        {/* 최종 단계 (팀원 STEP 4 / 팀장 본인 STEP 3): 디지털마케팅실장(유은정 상무) 최종 평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            finalGrade
              ? 'is-completed-admin'
              : !hasSelfEvaluated
                ? 'is-locked'
                : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-3">{finalStepNum}</span>
              <span className="kpi-step-title">
                실장 최종 평가 (디지털마케팅실장 · 유은정 상무)
              </span>
              {finalGrade ? (
                <span className={`kpi-grade-chip grade-${finalGrade.toLowerCase()}`}>
                  최종 {finalGrade}등급 ({evalMetrics.weightedPoint} / {item.weight}점)
                </span>
              ) : !hasSelfEvaluated ? (
                <span className="kpi-step-pending-badge is-locked">STEP 1 선행 필요</span>
              ) : (
                <span className="kpi-step-pending-badge">실장 최종평가 대기</span>
              )}
            </div>

            {isDivisionHead && (
              <button
                type="button"
                onClick={() => onOpenDirectorEval(item)}
                disabled={!hasSelfEvaluated}
                className={`btn ${hasSelfEvaluated ? 'btn-primary' : 'btn-secondary'} tasks-action-btn kpi-final-eval-btn`}
                title={
                  hasSelfEvaluated
                    ? '디지털마케팅실장 최종 등급 및 총평 확정'
                    : '담당자 본인의 [실적 · 자가평가]가 먼저 등록되어야 최종 등급을 확정할 수 있습니다.'
                }
              >
                <Award size={14} />{' '}
                {!hasSelfEvaluated
                  ? '최종 등급 확정 (자가평가 선행 필요)'
                  : finalGrade
                    ? '최종 등급 재확정'
                    : '최종 등급 확정'}
              </button>
            )}
          </div>

          {finalGrade ? (
            <div className="kpi-step-body is-detail">
              <div className="kpi-detail-eval-content-box">
                <span className="kpi-step-field-label">
                  디지털마케팅실장 최종 평가 총평 ({item.directorEvaluatorName || '유은정'} 상무)
                </span>
                <p className="kpi-step-field-val is-detail">
                  {finalComment || '등록된 최종 평가 코멘트가 없습니다.'}
                </p>
              </div>
            </div>
          ) : !hasSelfEvaluated ? (
            <div className="kpi-detail-empty-box">
              STEP 1 [본인 수행 실적 및 자가평가]가 먼저 등록되어야 실장 최종 등급을 확정할 수 있습니다.
            </div>
          ) : (
            <div className="kpi-detail-empty-box">
              디지털마케팅실장(유은정 상무)의 최종 등급 및 총평 확정을 대기 중입니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
