import React from 'react';
import type { KpiItem, TaskItem, User } from '../../types';
import type { KpiPhaseAccess } from './kpiSchedule';
import {
  QUARTERS,
  TRACK_CONFIG,
  checkHasSelfEval,
  getKpiEvalMetrics,
  getKpiLifecycleBadge,
  getLeaderScore5,
  getPeerScore5Info,
  getSelfScore5,
  getThreeStageAvgScore5,
  getValidFinalComment,
  getValidFinalGrade,
  isLeaderOwnedKpiItem,
  resolveUnifiedSelfComment,
} from './kpiShared';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  UserCheck,
} from 'lucide-react';

interface KpiDetailPageProps {
  item: KpiItem;
  currentUser: User;
  linkedTasks: TaskItem[];
  phaseAccess: KpiPhaseAccess;
  isSelf: boolean;
  canEditGoal: boolean;
  isTeamLead: boolean;
  isDivisionHead: boolean;
  isExecutiveViewer: boolean;
  onBackToList: () => void;
  onOpenTaskMapping: (kpi: KpiItem) => void;
  onOpenTaskDetailPopup: (task: TaskItem) => void;
  onOpenSelfEval: (kpi: KpiItem) => void;
  onOpenPeerEval: (kpi: KpiItem) => void;
  onOpenLeaderEval: (kpi: KpiItem) => void;
  onOpenDirectorEval: (kpi: KpiItem) => void;
}

export const KpiDetailPage: React.FC<KpiDetailPageProps> = ({
  item,
  currentUser,
  linkedTasks,
  phaseAccess,
  isSelf,
  canEditGoal,
  isTeamLead,
  isDivisionHead,
  isExecutiveViewer,
  onBackToList,
  onOpenTaskMapping,
  onOpenTaskDetailPopup,
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

  // 1~3단계 통일 5.0점 만점 점수 및 4단계 실장 최종 등급
  const selfScore5 = getSelfScore5(item);
  const peerInfo = getPeerScore5Info(item);
  const leaderScore5 = getLeaderScore5(item);
  const avgThreeStage5 = getThreeStageAvgScore5(item);
  const finalGrade = getValidFinalGrade(item);
  const evalMetrics = getKpiEvalMetrics(item);

  const unifiedSelfComment = resolveUnifiedSelfComment(item);
  const doneLinkedCount = linkedTasks.filter((t) => t.status === 'done').length;

  const peerReviews = item.peerReviews || [];
  const myPeerReview = peerReviews.find(
    (p) => String(p.reviewerId) === String(currentUser.id)
  );
  const finalComment = getValidFinalComment(item);

  const canMapNow = canEditGoal && phaseAccess.canMapTasks;

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

        {phaseAccess.isLocked ? (
          <span className="kpi-phase-status-pill is-locked">
            <Lock size={14} /> {phaseAccess.lockBadgeText}
          </span>
        ) : phaseAccess.lifecycle === 'evaluation' ? (
          <span className="kpi-phase-status-pill is-eval">
            공식 평가 기간 ({phaseAccess.evalPeriodRangeLabel})
          </span>
        ) : (
          <span className="kpi-phase-status-pill is-exec">
            수행 · 과제 매핑 기간 ({phaseAccess.execPeriodRangeLabel})
          </span>
        )}
      </div>

      {/* 섹션 1. KPI 목표 타이틀 & 1~3단계 5점 통일 스코어 + 4단계 최종 등급 카드 */}
      <div className={`card kpi-detail-hero-card ${trackCfg.classKey}`}>
        <div className="kpi-detail-hero-top">
          <div className="kpi-detail-hero-main">
            <div className="tasks-card-badges">
              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                <TrackIcon size={14} /> {trackCfg.label}
              </span>
              <span className="tasks-badge-category">
                {item.targetScope === 'team' ? '팀 공통' : item.ownerName}
              </span>
              <span className="kpi-weight-badge">
                {item.year || 2026}년{' '}
                {QUARTERS.find((q) => q.key === item.quarter)?.label || item.quarter}
              </span>
              <span className={`kpi-status-badge ${lifecycleBadge.classKey}`}>
                {lifecycleBadge.label}
              </span>
            </div>
            <h2 className="kpi-detail-title">{item.title}</h2>
          </div>

          {/* 우측 핵심 평가 요약 박스: 1~3단계 점수(5점 만점 일괄 기준), 4단계 최종 등급 */}
          <div className="kpi-detail-score-strip is-five-col">
            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">배점 가중치</span>
              <strong className="kpi-detail-score-val">{item.weight}%</strong>
            </div>

            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">자가평가</span>
              <strong className="kpi-detail-score-val is-self">
                {selfScore5 !== null ? `${selfScore5.toFixed(1)}점` : '미등록'}
              </strong>
            </div>

            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">협업다면</span>
              <strong className="kpi-detail-score-val is-peer">
                {peerInfo.avg !== null
                  ? `${peerInfo.avg.toFixed(1)}점 (${peerInfo.count}명)`
                  : '대기'}
              </strong>
            </div>

            <div className="kpi-detail-score-box">
              <span className="kpi-detail-score-label">1차 팀장</span>
              <strong className="kpi-detail-score-val is-leader">
                {isLeaderKpi
                  ? '본인 과제'
                  : leaderScore5 !== null
                    ? `${leaderScore5.toFixed(1)}점`
                    : '미등록'}
              </strong>
            </div>

            <div className="kpi-detail-score-box is-final-box">
              <span className="kpi-detail-score-label">최종 실장 등급</span>
              <strong className="kpi-detail-score-val is-final">
                {finalGrade ? `${finalGrade}등급` : '미확정'}
              </strong>
            </div>
          </div>
        </div>

        {/* 하단 측정 기준(Metric) & 달성 기준(DoD) */}
        <div className="kpi-detail-criteria-grid">
          <div className="kpi-detail-criteria-item">
            <span className="kpi-detail-criteria-label">측정 기준 (Metric)</span>
            <p className="kpi-detail-criteria-val">{item.targetMetric || '-'}</p>
          </div>

          <div className="kpi-detail-criteria-item is-dod">
            <span className="kpi-detail-criteria-label">달성 기준 (DoD)</span>
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
              연결된 실무 과제 ({linkedTasks.length}건)
            </h3>
            {linkedTasks.length > 0 && (
              <span className="kpi-evidence-summary-badge">
                완료 {doneLinkedCount} / 전체 {linkedTasks.length}건
              </span>
            )}
          </div>

          {canMapNow ? (
            <button
              type="button"
              onClick={() => onOpenTaskMapping(item)}
              className="btn btn-primary tasks-action-btn kpi-evidence-map-btn-lg"
            >
              <LinkIcon size={14} />{' '}
              {linkedTasks.length > 0 ? '과제 매핑 편집' : '+ 실무 과제 매핑'}
            </button>
          ) : (
            !phaseAccess.canMapTasks && (
              <span className="kpi-readonly-lock-chip">
                <Lock size={14} /> 과제 매핑 마감
              </span>
            )
          )}
        </div>

        {linkedTasks.length === 0 ? (
          <div className="kpi-detail-empty-box">
            {canMapNow
              ? '연결된 실무 수행 과제가 없습니다. 우측 상단 [+ 실무 과제 매핑] 버튼으로 관련 업무를 연결해 주세요.'
              : '연결된 실무 수행 과제가 없습니다.'}
          </div>
        ) : (
          <div className="kpi-detail-task-list">
            {linkedTasks.map((t) => {
              const isDone = t.status === 'done';
              const isBacklog = t.status === 'backlog';
              const taskStatusLabel = isDone ? '완료' : isBacklog ? '대기' : '진행중';
              const taskStatusClass = isDone
                ? 'is-done'
                : isBacklog
                  ? 'is-backlog'
                  : 'is-progress';
              return (
                <div key={t.id} className="kpi-detail-task-row">
                  <div className="kpi-detail-task-main">
                    <span className={`kpi-detail-task-status ${taskStatusClass}`}>
                      <CheckCircle2 size={14} />
                      {taskStatusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenTaskDetailPopup(t)}
                      className="kpi-detail-task-title-btn"
                    >
                      {t.title}
                    </button>
                    <span className="kpi-evidence-assignee">담당: {t.assigneeName}</span>
                  </div>

                  <div className="kpi-detail-task-meta">
                    <span className="kpi-evidence-date">
                      <Clock size={14} />{' '}
                      {t.startDate || t.dueDate
                        ? `${t.startDate || '미정'} ~ ${t.dueDate || '미정'}`
                        : '일정 미정'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 평가 기간 안내 또는 잠금 배너 */}
      {phaseAccess.isLocked ? (
        <div className="kpi-phase-gate-banner is-locked">
          <Lock size={16} />
          <span>{phaseAccess.lockDescription}</span>
        </div>
      ) : (
        !phaseAccess.isEvalPeriodActive && (
          <div className="kpi-phase-gate-banner is-exec">
            <Clock size={16} />
            <span>
              현재는 분기 수행 기간({phaseAccess.execPeriodRangeLabel})입니다. 수행 기간 중에는
              실무 과제만 매핑하며, 공식 평가 기간({phaseAccess.evalPeriodRangeLabel})에 단계별
              평가 버튼이 활성화됩니다.
            </span>
          </div>
        )
      )}

      {/* 섹션 3. 4단계 성과 평가 워크플로우 ([자가평가] > [협업다면] > [1차 팀장] > [최종 실장]) */}
      <div className="kpi-eval-steps-grid is-detail-page">
        {/* STEP 1: 본인 자가평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            hasSelfEvaluated ? 'is-completed-self' : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-1">STEP 1</span>
              <span className="kpi-step-title">자가평가</span>
              {selfScore5 !== null ? (
                <span className="kpi-score5-chip is-self">
                  {selfScore5.toFixed(1)}점
                </span>
              ) : (
                <span className="kpi-step-pending-badge">
                  {phaseAccess.isEvalPeriodActive ? '미등록 (필수 선행)' : '평가 기간 대기'}
                </span>
              )}
            </div>

            {isSelf && phaseAccess.canSubmitSelfEval && (
              <button
                type="button"
                onClick={() => onOpenSelfEval(item)}
                className={`btn ${hasSelfEvaluated ? 'btn-secondary' : 'btn-primary'} tasks-action-btn`}
              >
                <ClipboardCheck size={14} />{' '}
                {hasSelfEvaluated ? '자가평가 수정' : '자가평가 등록'}
              </button>
            )}
          </div>

          {hasSelfEvaluated ? (
            <div className="kpi-step-body is-detail">
              <div className="kpi-detail-eval-content-box">
                <p className="kpi-step-field-val is-detail">
                  {unifiedSelfComment || '작성된 의견이 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="kpi-detail-empty-box">
              {phaseAccess.isLocked
                ? '등록된 자가평가 내역이 없습니다.'
                : !phaseAccess.isEvalPeriodActive
                  ? `공식 평가 기간(${phaseAccess.evalPeriodRangeLabel})이 시작되면 자가평가를 등록할 수 있습니다.`
                  : isSelf
                    ? '우측 상단 [자가평가 등록] 버튼을 눌러 점수와 수행 실적을 작성해 주세요.'
                    : '담당자 본인의 자가평가 등록을 대기 중입니다.'}
            </div>
          )}
        </div>

        {/* STEP 2: 협업 다면평가 (무기명) */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            peerInfo.count > 0 ? 'is-completed-peer' : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-2">STEP 2</span>
              <span className="kpi-step-title">협업 다면평가 (무기명)</span>
              {peerInfo.avg !== null ? (
                <span className="kpi-score5-chip is-peer">
                  평균 {peerInfo.avg.toFixed(1)}점 ({peerInfo.count}명)
                </span>
              ) : (
                <span className="kpi-step-pending-badge">
                  {phaseAccess.isEvalPeriodActive ? '참여 대기' : '평가 기간 대기'}
                </span>
              )}
            </div>

            {!isSelf &&
              !isDivisionHead &&
              !isExecutiveViewer &&
              phaseAccess.canSubmitPeerEval && (
                <button
                  type="button"
                  onClick={() => onOpenPeerEval(item)}
                  className="btn btn-secondary tasks-action-btn kpi-peer-eval-btn"
                >
                  <MessageSquare size={14} />{' '}
                  {myPeerReview ? '내 다면평가 수정' : '다면평가 참여'}
                </button>
              )}
          </div>

          {peerInfo.count === 0 ? (
            <div className="kpi-detail-empty-box">
              {phaseAccess.isLocked
                ? '참여한 무기명 협업 다면평가 내역이 없습니다.'
                : !phaseAccess.isEvalPeriodActive
                  ? `공식 평가 기간(${phaseAccess.evalPeriodRangeLabel})에 동료 및 유관부서 무기명 다면평가가 진행됩니다.`
                  : '팀 동료 및 유관부서 협업 담당자가 무기명 평가를 등록하면 평균 점수와 코멘트가 집계됩니다.'}
            </div>
          ) : (
            <div className="kpi-step-body is-detail">
              <div className="kpi-peer-anon-scores">
                산출물 완성도 평균 <strong>{peerInfo.avgQuality}점</strong> · 일정·소통 협업 평균{' '}
                <strong>{peerInfo.avgCollab}점</strong>
              </div>
              <div className="kpi-peer-anon-list">
                {peerReviews.map((pr, idx) => (
                  <div key={pr.id || idx} className="kpi-peer-anon-item">
                    <div className="kpi-peer-anon-item-head">
                      <span className="kpi-peer-anon-tag">익명 피드백 #{idx + 1}</span>
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

        {/* STEP 3: 1차 팀장 평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            isLeaderKpi
              ? hasSelfEvaluated
                ? 'is-completed-leader'
                : 'is-pending'
              : leaderScore5 !== null
                ? 'is-completed-leader'
                : !hasSelfEvaluated
                  ? 'is-locked'
                  : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-leader">STEP 3</span>
              <span className="kpi-step-title">1차 팀장 평가 (서비스기획팀장)</span>
              {isLeaderKpi ? (
                <span className="kpi-step-pending-badge">팀장 본인 과제 (STEP 4 직행)</span>
              ) : leaderScore5 !== null ? (
                <span className="kpi-score5-chip is-leader">
                  {leaderScore5.toFixed(1)}점
                </span>
              ) : !phaseAccess.isEvalPeriodActive ? (
                <span className="kpi-step-pending-badge">평가 기간 대기</span>
              ) : !hasSelfEvaluated ? (
                <span className="kpi-step-pending-badge is-locked">STEP 1 선행 필요</span>
              ) : (
                <span className="kpi-step-pending-badge">평가 대기</span>
              )}
            </div>

            {!isLeaderKpi && isTeamLead && phaseAccess.isEvalPeriodActive && (
              <button
                type="button"
                onClick={() => onOpenLeaderEval(item)}
                disabled={!phaseAccess.canSubmitLeaderEval}
                className={`btn ${phaseAccess.canSubmitLeaderEval ? 'btn-primary' : 'btn-secondary'} tasks-action-btn`}
              >
                <UserCheck size={14} />{' '}
                {!hasSelfEvaluated
                  ? '1차 평가 (자가평가 선행 필요)'
                  : leaderScore5 !== null
                    ? '1차 평가 수정'
                    : '1차 평가 등록'}
              </button>
            )}
          </div>

          {isLeaderKpi ? (
            <div className="kpi-detail-empty-box">
              팀장 본인(또는 팀 공통) 과제는 별도 1차 팀장 평가 없이 STEP 1·2 결과를 바탕으로 STEP 4 실장 최종 평가가 진행됩니다.
            </div>
          ) : leaderScore5 !== null ? (
            <div className="kpi-step-body is-detail">
              <div className="kpi-detail-eval-content-box">
                <p className="kpi-step-field-val is-detail">
                  {item.leaderComment?.trim() || '작성된 의견이 없습니다.'}
                </p>
              </div>
            </div>
          ) : phaseAccess.isLocked ? (
            <div className="kpi-detail-empty-box">등록된 1차 팀장 평가 내역이 없습니다.</div>
          ) : !phaseAccess.isEvalPeriodActive ? (
            <div className="kpi-detail-empty-box">
              공식 평가 기간({phaseAccess.evalPeriodRangeLabel}) 중 본인 자가평가 완료 후 진행됩니다.
            </div>
          ) : !hasSelfEvaluated ? (
            <div className="kpi-detail-empty-box">
              STEP 1 [자가평가]가 먼저 등록되어야 1차 팀장 평가를 진행할 수 있습니다.
            </div>
          ) : (
            <div className="kpi-detail-empty-box">
              서비스기획팀장의 1차 평가 등록을 대기 중입니다.
            </div>
          )}
        </div>

        {/* STEP 4: 최종 실장 평가 */}
        <div
          className={`card kpi-eval-step-card is-detail ${
            finalGrade
              ? 'is-completed-admin'
              : !hasSelfEvaluated || (!isLeaderKpi && leaderScore5 === null)
                ? 'is-locked'
                : 'is-pending'
          }`}
        >
          <div className="kpi-eval-step-header">
            <div className="kpi-step-badge-wrap">
              <span className="kpi-step-num step-3">STEP 4</span>
              <span className="kpi-step-title">
                최종 실장 평가 (디지털마케팅실장 · 유은정 상무)
              </span>
              {finalGrade ? (
                <span className={`kpi-grade-chip grade-${finalGrade.toLowerCase()}`}>
                  최종 {finalGrade}등급 (가중 {evalMetrics.weightedPoint} / {item.weight}점)
                </span>
              ) : !phaseAccess.isEvalPeriodActive ? (
                <span className="kpi-step-pending-badge">평가 기간 대기</span>
              ) : !hasSelfEvaluated ? (
                <span className="kpi-step-pending-badge is-locked">STEP 1 선행 필요</span>
              ) : !isLeaderKpi && leaderScore5 === null ? (
                <span className="kpi-step-pending-badge is-locked">STEP 3 선행 필요</span>
              ) : (
                <span className="kpi-step-pending-badge">최종 등급 대기</span>
              )}
            </div>

            {isDivisionHead && phaseAccess.isEvalPeriodActive && (
              <button
                type="button"
                onClick={() => onOpenDirectorEval(item)}
                disabled={!phaseAccess.canSubmitDirectorEval}
                className={`btn ${phaseAccess.canSubmitDirectorEval ? 'btn-primary' : 'btn-secondary'} tasks-action-btn kpi-final-eval-btn`}
                title={
                  phaseAccess.canSubmitDirectorEval
                    ? '1~3단계 점수를 종합 확인하여 최종 등급(S~C) 확정 (확정 후 영구 잠금)'
                    : '선행 평가(자가평가 및 1차 팀장 평가)가 먼저 완료되어야 최종 등급을 확정할 수 있습니다.'
                }
              >
                <Award size={14} />{' '}
                {!phaseAccess.canSubmitDirectorEval
                  ? '최종 등급 확정 (선행 평가 필요)'
                  : '최종 등급 부여 · 확정'}
              </button>
            )}
          </div>

          {/* 1~3단계 점수 한눈 요약 바 (실장님이 등급 산정 시 바로 참고) */}
          {avgThreeStage5 !== null && (
            <div className="kpi-step4-score-summary-bar">
              <span>
                1~3단계 집계: 자가{' '}
                <strong>{selfScore5 !== null ? `${selfScore5.toFixed(1)}점` : '미입력'}</strong> · 다면{' '}
                <strong>
                  {peerInfo.avg !== null ? `${peerInfo.avg.toFixed(1)}점(${peerInfo.count}명)` : '미참여'}
                </strong>
                {!isLeaderKpi && (
                  <>
                    {' '}
                    · 1차 팀장{' '}
                    <strong>
                      {leaderScore5 !== null ? `${leaderScore5.toFixed(1)}점` : '미입력'}
                    </strong>
                  </>
                )}
              </span>
              <span className="kpi-step4-avg-badge">
                종합 평균 <strong>{avgThreeStage5.toFixed(1)}점</strong>
              </span>
            </div>
          )}

          {finalGrade ? (
            <div className="kpi-step-body is-detail">
              <div className="kpi-detail-eval-content-box">
                <p className="kpi-step-field-val is-detail">
                  {finalComment || '작성된 총평이 없습니다.'}
                </p>
              </div>
            </div>
          ) : phaseAccess.isLocked ? (
            <div className="kpi-detail-empty-box">최종 등급 미확정 상태로 평가 기간이 마감되었습니다.</div>
          ) : !phaseAccess.isEvalPeriodActive ? (
            <div className="kpi-detail-empty-box">
              공식 평가 기간({phaseAccess.evalPeriodRangeLabel}) 중 1~3단계 평가 결과를 종합하여 최종 등급이 확정됩니다.
            </div>
          ) : !phaseAccess.canSubmitDirectorEval ? (
            <div className="kpi-detail-empty-box">
              {isLeaderKpi
                ? 'STEP 1 [자가평가]가 먼저 등록되어야 최종 등급을 부여할 수 있습니다.'
                : 'STEP 1 [자가평가] 및 STEP 3 [1차 팀장 평가]가 완료되어야 최종 등급을 확정할 수 있습니다.'}
            </div>
          ) : (
            <div className="kpi-detail-empty-box">
              디지털마케팅실장(유은정 상무)께서 1~3단계 점수를 확인 후 최종 등급(S ~ C)을 확정합니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
