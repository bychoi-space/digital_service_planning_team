import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  KpiItem,
  KpiQuarter,
  KpiStatus,
  KpiTargetScope,
  KpiGrade,
  KpiTrack,
  KpiCycleSchedule,
  TaskItem,
  User,
} from '../types';
import { PlanningStorageService, getTodayDateString } from '../services/storage';
import {
  canManageUserPermissions,
  resolveKpiAccessRole,
  isTeamLeadName,
} from '../constants/departments';
import { KpiDetailPage } from './kpi/KpiDetailPage';
import { KpiScheduleEditModal } from './kpi/KpiScheduleEditModal';
import { TaskQuickDetailModal } from './common/TaskQuickDetailModal';
import {
  formatCycleFullLabel,
  formatShortDateRange,
  resolveCycleTimelineSteps,
  resolveKpiPhaseAccess,
} from './kpi/kpiSchedule';
import type { KpiPhaseAccess } from './kpi/kpiSchedule';
import {
  KPI_YEAR_OPTIONS,
  QUARTERS,
  STANDARD_KPI_TEMPLATES,
  TRACK_CONFIG,
  TRACK_LIST,
  SCORE_5_RUBRIC,
  GRADE_RUBRIC,
  parseKpiRouteFromHash,
  resolveCurrentQuarterFromDate,
  resolveKpiSlotIndex,
  resolveMemberDefaultTrack,
  resolveGradeFromHundredScore,
  recommendGradeFromFiveScore,
  resolveUnifiedSelfComment,
  checkHasSelfEval,
  getSelfScore5,
  getPeerScore5Info,
  getLeaderScore5,
  getThreeStageAvgScore5,
  isLeaderOwnedKpiItem,
  getValidFinalGrade,
  getValidFinalComment,
  getKpiEvalMetrics,
} from './kpi/kpiShared';
import type { KpiModeTab } from './kpi/kpiShared';
import {
  Award,
  X,
  ShieldCheck,
  MessageSquare,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  Users,
  Lock,
  Eye,
  UserCheck,
  Calendar,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';

interface KpiViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  pdfForceModeTab?: KpiModeTab;
  isPdfExport?: boolean;
}

export const KpiView: React.FC<KpiViewProps> = ({
  currentUser,
  isViewer,
  onShowToast,
  pdfForceModeTab,
  isPdfExport = false,
}) => {
  const [kpis, setKpis] = useState<KpiItem[]>(() => PlanningStorageService.getKpis());
  const [tasks, setTasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [teamMembers, setTeamMembers] = useState<User[]>(() =>
    PlanningStorageService.getServicePlanningMembers()
  );
  const [popupTask, setPopupTask] = useState<TaskItem | null>(null);

  // 조직 위계 기반 KPI 열람·평가 역할 판별
  const kpiRole = resolveKpiAccessRole(currentUser);
  const isTeamLead = kpiRole === 'team_lead'; // 최범열 차장 (서비스기획팀장 · 1차 평가)
  const isDivisionHead = kpiRole === 'division_head'; // 유은정 상무 (디지털마케팅실장 · 최종 평가)
  const isExecutiveViewer = kpiRole === 'executive_viewer'; // 박종삼 전무 · 신동휘 사장 (전체 열람 전용)
  const isTeamMember = kpiRole === 'team_member'; // 김리아 · 고범곤 · 박수민 대리 등 (본인 KPI + 동료 다면평가)
  const isCrossDept = kpiRole === 'cross_dept'; // 타 부서 · 유관부서 임직원 (무기명 협업 다면평가 전용)

  const canViewAllOrgKpis = isTeamLead || isDivisionHead || isExecutiveViewer;
  const canManageSchedule = canManageUserPermissions(currentUser);
  const [todayStr] = useState<string>(() => getTodayDateString());

  // URL 해시 기반 페이지 라우팅 상태 (#/kpi, #/kpi/peer, #/kpi/detail/{id}, ?year=2027&quarter=Q1)
  const [routeState, setRouteState] = useState(() => parseKpiRouteFromHash());
  const cameFromListRef = useRef<boolean>(false);

  const defaultQuarter = useMemo(
    () => resolveCurrentQuarterFromDate(todayStr),
    [todayStr]
  );

  const [selectedYear, setSelectedYear] = useState<number>(
    () =>
      (isPdfExport ? undefined : parseKpiRouteFromHash().queryYear) ||
      Number(todayStr.slice(0, 4)) ||
      2026
  );
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | KpiQuarter>(
    () =>
      (isPdfExport ? undefined : parseKpiRouteFromHash().queryQuarter) ||
      resolveCurrentQuarterFromDate(todayStr)
  );
  const [scheduleTick, setScheduleTick] = useState<number>(0);
  const [isScheduleEditOpen, setIsScheduleEditOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isPdfExport) return;
    const syncKpiRoute = () => {
      const parsed = parseKpiRouteFromHash(window.location.hash);
      if (parsed.queryYear) {
        setSelectedYear(parsed.queryYear);
      }
      if (parsed.queryQuarter) {
        setSelectedQuarter(parsed.queryQuarter);
      }
      if (isCrossDept) {
        if (!window.location.hash.toLowerCase().startsWith('#/kpi/peer')) {
          const qs = window.location.hash.includes('?')
            ? `?${window.location.hash.split('?')[1]}`
            : '';
          window.history.replaceState(null, '', `#/kpi/peer${qs}`);
        }
        setRouteState({
          mode: 'peer_feedback',
          detailId: null,
          queryYear: parsed.queryYear,
          queryQuarter: parsed.queryQuarter,
        });
        return;
      }
      if ((isDivisionHead || isExecutiveViewer) && parsed.mode === 'peer_feedback') {
        const qs = window.location.hash.includes('?')
          ? `?${window.location.hash.split('?')[1]}`
          : '';
        window.history.replaceState(null, '', `#/kpi${qs}`);
        setRouteState({
          mode: 'evaluation',
          detailId: null,
          queryYear: parsed.queryYear,
          queryQuarter: parsed.queryQuarter,
        });
        return;
      }
      setRouteState(parsed);
    };

    const handleScheduleStoreSync = () => {
      setScheduleTick((prev) => prev + 1);
      setKpis(PlanningStorageService.getKpis());
    };

    const handleKpiOrTaskSync = () => {
      setKpis(PlanningStorageService.getKpis());
      setTasks(PlanningStorageService.getTasks());
      setTeamMembers(PlanningStorageService.getServicePlanningMembers());
    };

    syncKpiRoute();
    window.addEventListener('hashchange', syncKpiRoute);
    window.addEventListener('ds-portal-kpi-schedules-updated', handleScheduleStoreSync);
    window.addEventListener('ds-portal-kpis-updated', handleKpiOrTaskSync);
    window.addEventListener('ds-portal-tasks-updated', handleKpiOrTaskSync);
    return () => {
      window.removeEventListener('hashchange', syncKpiRoute);
      window.removeEventListener('ds-portal-kpi-schedules-updated', handleScheduleStoreSync);
      window.removeEventListener('ds-portal-kpis-updated', handleKpiOrTaskSync);
      window.removeEventListener('ds-portal-tasks-updated', handleKpiOrTaskSync);
    };
  }, [isCrossDept, isDivisionHead, isExecutiveViewer, isPdfExport]);

  const effectiveModeTab: KpiModeTab = isCrossDept
    ? 'peer_feedback'
    : isDivisionHead || isExecutiveViewer
    ? 'evaluation'
    : isPdfExport && pdfForceModeTab
    ? pdfForceModeTab
    : routeState.mode;
  const selectedKpiId = isPdfExport ? null : routeState.detailId;

  const navigateToKpiMode = (nextMode: KpiModeTab) => {
    cameFromListRef.current = false;
    const targetHash = nextMode === 'peer_feedback' ? '#/kpi/peer' : '#/kpi';
    if (window.location.hash !== targetHash) {
      window.location.assign(targetHash);
    } else {
      setRouteState({ mode: nextMode, detailId: null });
    }
  };

  const navigateToKpiDetail = (kpiId: string) => {
    cameFromListRef.current = true;
    const targetHash = `#/kpi/detail/${encodeURIComponent(kpiId)}`;
    if (window.location.hash !== targetHash) {
      window.location.assign(targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateBackToKpiList = () => {
    if (cameFromListRef.current) {
      cameFromListRef.current = false;
      window.history.back();
    } else {
      window.location.assign('#/kpi');
    }
  };

  const availableYears = useMemo(() => {
    const set = new Set<number>(KPI_YEAR_OPTIONS);
    kpis.forEach((k) => {
      if (k.year) set.add(Number(k.year));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [kpis]);

  const effectiveScheduleQuarter: KpiQuarter =
    selectedQuarter === 'all' ? defaultQuarter : selectedQuarter;

  const activeCycleSchedule: KpiCycleSchedule = useMemo(() => {
    void scheduleTick;
    return PlanningStorageService.getKpiCycleSchedule(selectedYear, effectiveScheduleQuarter);
  }, [selectedYear, effectiveScheduleQuarter, scheduleTick]);

  const activeCycleTimeline = useMemo(
    () => resolveCycleTimelineSteps(activeCycleSchedule, todayStr),
    [activeCycleSchedule, todayStr]
  );

  const activeCycleRegisteredCount = useMemo(
    () =>
      kpis.filter(
        (k) =>
          Number(k.year || 2026) === selectedYear &&
          k.quarter === effectiveScheduleQuarter
      ).length,
    [kpis, selectedYear, effectiveScheduleQuarter]
  );

  const [trackFilter, setTrackFilter] = useState<'all' | KpiTrack>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [peerOwnerFilter, setPeerOwnerFilter] = useState<string>('all');

  // 상단 평가 기준표(3대 축 & 루브릭) 접기/펼치기 상태 (기본 접힘으로 주요 일정·목록 집중도 확보)
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(false);

  // 개별 KPI 기수별 스케줄 및 기간 기반 액션 허용/잠금 상태 조회
  const getPhaseAccessForKpi = useCallback(
    (kpi: KpiItem): KpiPhaseAccess => {
      void scheduleTick;
      const sched = PlanningStorageService.getKpiCycleSchedule(
        Number(kpi.year || 2026),
        kpi.quarter
      );
      return resolveKpiPhaseAccess(kpi, sched, todayStr);
    },
    [scheduleTick, todayStr]
  );

  // 현재 로그인한 사용자가 해당 KPI의 본인(담당자)인지 여부 판별
  const isKpiOwner = useCallback(
    (kpi: KpiItem): boolean => {
      const currentName = currentUser.name?.trim() || '';
      if (!currentName) return false;
      if (kpi.ownerName?.trim() === currentName) return true;
      if (kpi.ownerId && String(kpi.ownerId) === String(currentUser.id)) return true;
      return false;
    },
    [currentUser.id, currentUser.name]
  );

  // 현재 로그인한 사용자가 해당 KPI의 평가 내역(상세)을 열람할 수 있는지 여부 (기밀성 보호)
  const canReadKpiEvaluation = useCallback(
    (kpi: KpiItem): boolean => {
      if (canViewAllOrgKpis) return true;
      if (isTeamMember) {
        return isKpiOwner(kpi) || kpi.targetScope === 'team';
      }
      return false;
    },
    [canViewAllOrgKpis, isTeamMember, isKpiOwner]
  );

  // 현재 로그인한 사용자가 해당 KPI의 목표/과제 매핑을 편집할 수 있는지 여부
  const canEditKpiGoal = (kpi: KpiItem): boolean => {
    if (isTeamLead) return true;
    if (isTeamMember && isKpiOwner(kpi)) return true;
    return false;
  };

  // 상세 페이지에 표시할 현재 선택된 KPI 항목 (열람 권한이 없으면 자동 차단)
  const rawDetailTarget = useMemo(() => {
    if (!selectedKpiId || effectiveModeTab !== 'evaluation') return null;
    return kpis.find((k) => k.id === selectedKpiId) || null;
  }, [kpis, selectedKpiId, effectiveModeTab]);

  const selectedKpi = useMemo(() => {
    if (!rawDetailTarget || !canReadKpiEvaluation(rawDetailTarget)) return null;
    return rawDetailTarget;
  }, [rawDetailTarget, canReadKpiEvaluation]);

  const isDetailRouteActive = Boolean(selectedKpiId && effectiveModeTab === 'evaluation');

  // 평가/점검 모달: 'self_checkin' | 'peer_review' | 'leader_eval' (팀장 1차) | 'director_eval' (실장 최종) | 'task_mapping'
  const [actionModal, setActionModal] = useState<{
    type:
      | 'self_checkin'
      | 'peer_review'
      | 'leader_eval'
      | 'director_eval'
      | 'task_mapping'
      | null;
    kpi: KpiItem | null;
  }>({ type: null, kpi: null });

  const [mappingTaskIds, setMappingTaskIds] = useState<string[]>([]);
  const [mappingSearch, setMappingSearch] = useState<string>('');
  const [mappingShowAllTasks, setMappingShowAllTasks] = useState<boolean>(false);

  // 입력 폼 상태들 (1~3단계 모두 1~5점 통일, 4단계만 S~C 등급 — 평가 모달은 점수·의견만 간결하게 입력)
  const [selfForm, setSelfForm] = useState({
    status: 'in_progress' as KpiStatus,
    selfScore5: 4,
    unifiedComment: '',
  });

  const [peerForm, setPeerForm] = useState({
    scoreCollaboration: 5,
    scoreQuality: 5,
    commentGood: '',
    commentImprove: '',
  });

  const [leaderEvalForm, setLeaderEvalForm] = useState({
    score5: 4,
    comment: '',
  });

  const [directorEvalForm, setDirectorEvalForm] = useState({
    grade: 'A' as KpiGrade,
    status: 'achieved' as KpiStatus,
    comment: '',
  });

  const refreshKpis = () => {
    setKpis(PlanningStorageService.getKpis());
    setTasks(PlanningStorageService.getTasks());
    setTeamMembers(PlanningStorageService.getServicePlanningMembers());
  };

  const getLinkedTasksForKpi = (kpi: KpiItem): TaskItem[] => {
    const ids = Array.isArray(kpi.linkedTaskIds) ? kpi.linkedTaskIds : [];
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return tasks.filter((t) => idSet.has(t.id));
  };

  const getCandidateTasks = (params: {
    targetScope: KpiTargetScope;
    ownerName: string;
    ownerId?: string;
    track?: KpiTrack;
    includeAll?: boolean;
  }): TaskItem[] => {
    if (params.includeAll) return tasks;
    return tasks.filter((t) => {
      if (params.targetScope === 'team') {
        return !params.track || t.track === params.track;
      }
      return (
        t.assigneeName?.trim() === params.ownerName?.trim() ||
        (params.ownerId ? String(t.assigneeId) === String(params.ownerId) : false)
      );
    });
  };

  const toggleTaskIdInList = (list: string[], taskId: string): string[] => {
    return list.includes(taskId) ? list.filter((id) => id !== taskId) : [...list, taskId];
  };

  // 0) KPI별 실무 과제 매핑 전용 모달
  const handleOpenTaskMappingModal = (kpi: KpiItem) => {
    if (!canEditKpiGoal(kpi)) return;
    const access = getPhaseAccessForKpi(kpi);
    if (!access.canMapTasks) {
      onShowToast(
        access.lockDescription || '현재 단계에서는 실무 과제 매핑을 변경할 수 없습니다.',
        'error'
      );
      return;
    }
    setActionModal({ type: 'task_mapping', kpi });
    setMappingTaskIds(Array.isArray(kpi.linkedTaskIds) ? [...kpi.linkedTaskIds] : []);
    setMappingSearch('');
    setMappingShowAllTasks(false);
  };

  const handleSaveTaskMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        linkedTaskIds: mappingTaskIds,
      });
      onShowToast(
        `해당 KPI에 실무 수행 근거 과제(${mappingTaskIds.length}건)가 매핑되었습니다.`,
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '과제 매핑 저장 실패', 'error');
    }
  };

  // 1) STEP 1: 본인 자가평가 모달 (5점 만점 점수 + 단일 통합 코멘트)
  const handleOpenSelfModal = (kpi: KpiItem) => {
    if (!isKpiOwner(kpi)) return;
    const access = getPhaseAccessForKpi(kpi);
    if (!access.canSubmitSelfEval) {
      onShowToast(
        access.lockDescription ||
          `공식 평가 기간(${access.evalPeriodRangeLabel})에만 자가평가를 등록할 수 있습니다.`,
        'error'
      );
      return;
    }
    const existing5 = getSelfScore5(kpi);
    setActionModal({ type: 'self_checkin', kpi });
    setSelfForm({
      status: kpi.status === 'planning' ? 'in_progress' : kpi.status,
      selfScore5: existing5 !== null ? Math.round(existing5) : 4,
      unifiedComment: resolveUnifiedSelfComment(kpi),
    });
  };

  const handleSaveSelfCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    const cleanComment = selfForm.unifiedComment.trim();
    if (!cleanComment) {
      onShowToast('수행 실적 및 자가평가 의견을 입력해 주세요.', 'error');
      return;
    }
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        currentValue: '',
        status: selfForm.status,
        selfEvaluation: cleanComment,
        selfScore: Number(selfForm.selfScore5),
      });
      onShowToast(
        `자가평가(${selfForm.selfScore5}점)가 저장되었습니다.`,
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '저장 실패', 'error');
    }
  };

  // 2) STEP 2: 사내·유관부서 무기명 동료 협업 피드백 모달 (5점 만점 점수)
  const handleOpenPeerModal = (kpi: KpiItem) => {
    if (isKpiOwner(kpi)) {
      onShowToast('본인의 KPI에는 직접 동료 피드백을 평가할 수 없습니다.', 'info');
      return;
    }
    const access = getPhaseAccessForKpi(kpi);
    if (!access.canSubmitPeerEval) {
      onShowToast(
        access.lockDescription ||
          `공식 평가 기간(${access.evalPeriodRangeLabel})에만 무기명 협업 다면평가에 참여할 수 있습니다.`,
        'error'
      );
      return;
    }
    setActionModal({ type: 'peer_review', kpi });
    const existing = kpi.peerReviews?.find(
      (p) => String(p.reviewerId) === String(currentUser.id)
    );
    if (existing) {
      setPeerForm({
        scoreCollaboration: existing.scoreCollaboration,
        scoreQuality: existing.scoreQuality,
        commentGood: existing.commentGood,
        commentImprove: existing.commentImprove,
      });
    } else {
      setPeerForm({
        scoreCollaboration: 5,
        scoreQuality: 5,
        commentGood: '',
        commentImprove: '',
      });
    }
  };

  const handleSavePeerReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    if (isKpiOwner(actionModal.kpi)) {
      onShowToast('본인의 KPI에는 직접 동료 피드백을 등록할 수 없습니다.', 'error');
      return;
    }
    try {
      PlanningStorageService.submitPeerReview(actionModal.kpi.id, {
        reviewerId: currentUser.id,
        reviewerName: '익명 동료',
        scoreCollaboration: Number(peerForm.scoreCollaboration),
        scoreQuality: Number(peerForm.scoreQuality),
        commentGood: peerForm.commentGood.trim(),
        commentImprove: peerForm.commentImprove.trim(),
      });
      onShowToast(
        '무기명 협업 다면평가 점수가 등록되었습니다. (평가자 성명·부서는 철저히 비공개 처리됩니다)',
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '피드백 저장 실패', 'error');
    }
  };

  // 3) STEP 3: 팀장(최범열 차장) 1차 평가 모달 (5점 만점 점수 + 의견)
  const handleOpenLeaderEvalModal = (kpi: KpiItem) => {
    if (!isTeamLead || isLeaderOwnedKpiItem(kpi)) return;
    const access = getPhaseAccessForKpi(kpi);
    if (!access.isEvalPeriodActive) {
      onShowToast(
        access.lockDescription ||
          `공식 평가 기간(${access.evalPeriodRangeLabel})에만 1차 팀장 평가를 진행할 수 있습니다.`,
        'error'
      );
      return;
    }
    if (!checkHasSelfEval(kpi)) {
      onShowToast(
        '담당자의 [STEP 1 자가평가]가 먼저 등록되어야 팀장 1차 평가를 진행할 수 있습니다.',
        'error'
      );
      return;
    }
    const existingLeader5 = getLeaderScore5(kpi);
    const fallbackSelf5 = getSelfScore5(kpi);
    const initialScore =
      existingLeader5 !== null
        ? Math.round(existingLeader5)
        : fallbackSelf5 !== null
          ? Math.round(fallbackSelf5)
          : 4;
    setActionModal({ type: 'leader_eval', kpi });
    setLeaderEvalForm({
      score5: initialScore,
      comment: kpi.leaderComment || '',
    });
  };

  const handleSaveLeaderEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi || !isTeamLead || isLeaderOwnedKpiItem(actionModal.kpi)) return;
    if (!checkHasSelfEval(actionModal.kpi)) {
      onShowToast('담당자의 [STEP 1 자가평가]가 먼저 등록되어야 합니다.', 'error');
      return;
    }
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        stage: getValidFinalGrade(actionModal.kpi) ? 'finalized' : 'director_eval',
        leaderGrade: undefined,
        leaderScore: Number(leaderEvalForm.score5),
        leaderComment: leaderEvalForm.comment.trim(),
        leaderEvaluatorName: currentUser.name,
        leaderEvaluatedAt: new Date().toISOString(),
      });
      onShowToast(
        `1차 팀장 평가(${leaderEvalForm.score5}점)가 저장되었습니다.`,
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '1차 평가 저장 실패', 'error');
    }
  };

  // 4) STEP 4: 디지털마케팅실장(유은정 상무) 최종 등급(S~C) 및 총평 확정 모달
  const handleOpenDirectorEvalModal = (kpi: KpiItem) => {
    if (!isDivisionHead) return;
    const access = getPhaseAccessForKpi(kpi);
    if (!access.canSubmitDirectorEval) {
      onShowToast(
        access.lockDescription ||
          '공식 평가 기간 중 선행 평가(자가평가 및 팀장 1차 평가)가 완료되어야 최종 등급을 확정할 수 있습니다.',
        'error'
      );
      return;
    }
    const existingFinalGrade = getValidFinalGrade(kpi);
    const avg5 = getThreeStageAvgScore5(kpi);
    const initialGrade = existingFinalGrade || recommendGradeFromFiveScore(avg5);
    setActionModal({ type: 'director_eval', kpi });
    setDirectorEvalForm({
      grade: initialGrade,
      status:
        initialGrade === 'S' || initialGrade === 'A'
          ? 'achieved'
          : initialGrade === 'B'
            ? 'partially_achieved'
            : 'missed',
      comment: getValidFinalComment(kpi),
    });
  };

  const handleSaveDirectorEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi || !isDivisionHead) return;
    if (!checkHasSelfEval(actionModal.kpi)) {
      onShowToast(
        '담당자의 [실적 · 자가평가]가 먼저 등록되어야 최종 등급을 확정할 수 있습니다.',
        'error'
      );
      return;
    }
    if (
      !window.confirm(
        `[${actionModal.kpi.ownerName}] "${actionModal.kpi.title}" 항목을 최종 ${directorEvalForm.grade}등급으로 확정하시겠습니까?\n확정 후에는 과제 매핑 및 평가 내용을 더 이상 수정할 수 없습니다.`
      )
    ) {
      return;
    }
    const rubric =
      GRADE_RUBRIC.find((r) => r.grade === directorEvalForm.grade) || GRADE_RUBRIC[1];
    const autoStatus: KpiStatus =
      directorEvalForm.grade === 'S' || directorEvalForm.grade === 'A'
        ? 'achieved'
        : directorEvalForm.grade === 'B'
          ? 'partially_achieved'
          : 'missed';
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        stage: 'finalized',
        status: autoStatus,
        directorGrade: directorEvalForm.grade,
        directorScore: rubric.score,
        directorComment: directorEvalForm.comment.trim(),
        directorEvaluatorName: currentUser.name,
        directorEvaluatedAt: new Date().toISOString(),
        finalEvaluation: directorEvalForm.comment.trim(),
        evaluatorName: currentUser.name,
        achievementRate: rubric.score,
      });
      onShowToast(
        `최종 평가 등급(${directorEvalForm.grade}등급) 및 실장 총평이 확정되었습니다.`,
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '최종 평가 저장 실패', 'error');
    }
  };

  // [권한 기반 스코핑 1] 평가 열람 탭에서 접속자에게 허용된 KPI 원본 풀
  const accessibleEvalKpis = useMemo(() => {
    return kpis.filter((k) => canReadKpiEvaluation(k));
  }, [kpis, canReadKpiEvaluation]);

  // [권한 기반 스코핑 2] 선택된 연도·분기 기준 KPI 풀 및 필터 적용 목록
  const periodEvalKpis = useMemo(() => {
    return accessibleEvalKpis.filter((k) => {
      const matchesYear = Number(k.year || 2026) === selectedYear;
      const matchesQuarter =
        selectedQuarter === 'all' ? true : k.quarter === selectedQuarter;
      return matchesYear && matchesQuarter;
    });
  }, [accessibleEvalKpis, selectedYear, selectedQuarter]);

  const currentKpis = useMemo(() => {
    return periodEvalKpis.filter((k) => {
      const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
      const matchesOwner = !canViewAllOrgKpis
        ? true
        : ownerFilter === 'all'
          ? true
          : ownerFilter === 'team'
            ? k.targetScope === 'team'
            : k.ownerName?.trim() === ownerFilter.trim();

      return matchesTrack && matchesOwner;
    });
  }, [periodEvalKpis, trackFilter, ownerFilter, canViewAllOrgKpis]);

  // [권한 기반 스코핑 3] 협업 다면평가(무기명 피드백) 탭 대상 KPI 목록 (본인 제외 개인 KPI)
  const peerBaseKpis = useMemo(() => {
    return kpis.filter((k) => k.targetScope !== 'team' && !isKpiOwner(k));
  }, [kpis, isKpiOwner]);

  const periodPeerKpis = useMemo(() => {
    return peerBaseKpis.filter((k) => {
      const matchesYear = Number(k.year || 2026) === selectedYear;
      const matchesQuarter =
        selectedQuarter === 'all' ? true : k.quarter === selectedQuarter;
      return matchesYear && matchesQuarter;
    });
  }, [peerBaseKpis, selectedYear, selectedQuarter]);

  const visiblePeerKpis = useMemo(() => {
    return periodPeerKpis.filter((k) => {
      const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
      const matchesPeerOwner =
        peerOwnerFilter === 'all' ? true : k.ownerName?.trim() === peerOwnerFilter.trim();
      return matchesTrack && matchesPeerOwner;
    });
  }, [periodPeerKpis, trackFilter, peerOwnerFilter]);

  const peerCandidateMembers = useMemo(() => {
    const names = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.name.trim() !== currentUser.name?.trim()) {
        names.add(m.name.trim());
      }
    });
    peerBaseKpis.forEach((k) => {
      if (k.ownerName?.trim() && k.ownerName.trim() !== currentUser.name?.trim()) {
        names.add(k.ownerName.trim());
      }
    });
    return Array.from(names);
  }, [teamMembers, peerBaseKpis, currentUser.name]);

  // 담당자별 KPI 그룹 및 가중치 합계·평균 산출 (중단 중복 카드 대신 테이블 내 그룹 써머리 행으로 통합)
  const ownerGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        ownerKey: string;
        ownerLabel: string;
        isTeam: boolean;
        track: KpiTrack;
        items: KpiItem[];
        kpiCount: number;
        selfDoneCount: number;
        leaderDoneCount: number;
        finalizedCount: number;
        totalWeight: number;
        interimWeightSum: number;
        interimFiveWeightedSum: number;
        finalWeightSum: number;
        finalHundredWeightedSum: number;
      }
    >();

    currentKpis.forEach((item) => {
      const isTeam = item.targetScope === 'team';
      const ownerKey = isTeam ? 'team' : (item.ownerName || '미지정').trim();
      const ownerLabel = isTeam ? '서비스기획팀 공통' : ownerKey;
      const evalInfo = getKpiEvalMetrics(item);
      const hasSelf = checkHasSelfEval(item);
      const hasLeader = getLeaderScore5(item) !== null;

      const existing = map.get(ownerKey) || {
        ownerKey,
        ownerLabel,
        isTeam,
        track: (item.track || resolveMemberDefaultTrack(ownerKey)) as KpiTrack,
        items: [],
        kpiCount: 0,
        selfDoneCount: 0,
        leaderDoneCount: 0,
        finalizedCount: 0,
        totalWeight: 0,
        interimWeightSum: 0,
        interimFiveWeightedSum: 0,
        finalWeightSum: 0,
        finalHundredWeightedSum: 0,
      };

      existing.items.push(item);
      existing.kpiCount += 1;
      existing.totalWeight += evalInfo.weight;

      if (hasSelf) {
        existing.selfDoneCount += 1;
      }
      if (hasLeader) {
        existing.leaderDoneCount += 1;
      }
      if (evalInfo.avgScore5 !== null) {
        existing.interimWeightSum += evalInfo.weight;
        existing.interimFiveWeightedSum += evalInfo.avgScore5 * evalInfo.weight;
      }
      if (evalInfo.source === 'final' && evalInfo.weightedPoint !== null) {
        existing.finalizedCount += 1;
        existing.finalWeightSum += evalInfo.weight;
        existing.finalHundredWeightedSum =
          Math.round((existing.finalHundredWeightedSum + evalInfo.weightedPoint) * 10) / 10;
      }

      map.set(ownerKey, existing);
    });

    const trackSortOrder: Record<KpiTrack, number> = {
      기획: 0,
      디자인: 1,
      퍼블리싱: 2,
    };

    return Array.from(map.values())
      .map((entry) => {
        const isAllFinalized = entry.kpiCount > 0 && entry.finalizedCount === entry.kpiCount;
        const hasSingleCycle =
          new Set(entry.items.map((it) => it.quarter)).size <= 1;
        const interimAvg5 =
          entry.interimWeightSum > 0
            ? Math.round((entry.interimFiveWeightedSum / entry.interimWeightSum) * 10) / 10
            : null;
        const finalScore100 =
          isAllFinalized && entry.finalWeightSum > 0
            ? Math.round(((entry.finalHundredWeightedSum / entry.finalWeightSum) * 100) * 10) / 10
            : null;
        const overallGrade = isAllFinalized ? resolveGradeFromHundredScore(finalScore100) : null;

        return {
          ...entry,
          hasSingleCycle,
          interimAvg5,
          finalScore100,
          overallGrade,
          isAllFinalized,
        };
      })
      .sort((a, b) => {
        if (a.isTeam !== b.isTeam) return a.isTeam ? -1 : 1;
        const trackDiff = (trackSortOrder[a.track] ?? 0) - (trackSortOrder[b.track] ?? 0);
        if (trackDiff !== 0) return trackDiff;
        const aLead = isTeamLeadName(a.ownerKey) ? 0 : 1;
        const bLead = isTeamLeadName(b.ownerKey) ? 0 : 1;
        if (aLead !== bLead) return aLead - bLead;
        return a.ownerLabel.localeCompare(b.ownerLabel, 'ko-KR');
      });
  }, [currentKpis]);

  // 현재 접속자의 권한 안내 배너 문구
  const roleContextBanner = useMemo(() => {
    if (isExecutiveViewer) {
      return {
        icon: Eye,
        badge: `${currentUser.department} · 상위 임원 열람 권한`,
        desc: '서비스기획팀 전원의 KPI 목표, 수행 근거 과제 및 단계별 평가 현황을 열람합니다.',
        classKey: 'is-executive',
      };
    }
    if (isDivisionHead) {
      return {
        icon: Award,
        badge: '디지털마케팅실장 · 최종 평가 권한',
        desc: '1~3단계 평가 결과를 종합 검토하고 최종 평가 등급(S~C)을 확정합니다.',
        classKey: 'is-director',
      };
    }
    if (isTeamLead) {
      return {
        icon: UserCheck,
        badge: '서비스기획팀장 · 팀 전체 열람 및 1차 평가 권한',
        desc: '소속 구성원 KPI 관리 및 1차 평가를 진행하며, 최종 등급은 디지털마케팅실장이 확정합니다.',
        classKey: 'is-leader',
      };
    }
    if (isTeamMember) {
      return {
        icon: Lock,
        badge: '개인 평가 기밀 보호 적용 중',
        desc: '내 KPI 평가 내역은 본인과 상위 평가자에게만 공개되며 동료 간에는 비공개됩니다.',
        classKey: 'is-member',
      };
    }
    return {
      icon: Users,
      badge: `${currentUser.department} · 협업 다면평가 참여 모드`,
      desc: '협업 산출물 완성도와 소통 만족도를 무기명으로 평가합니다. (작성자 신원 완전 비공개)',
      classKey: 'is-cross',
    };
  }, [isExecutiveViewer, isDivisionHead, isTeamLead, isTeamMember, currentUser.department]);

  const BannerIcon = roleContextBanner.icon;

  const handleSaveScheduleOverride = async (nextSchedule: KpiCycleSchedule) => {
    const res = await PlanningStorageService.saveKpiCycleScheduleOverride(nextSchedule);
    if (res.success) {
      setScheduleTick((prev) => prev + 1);
      refreshKpis();
      setIsScheduleEditOpen(false);
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleResetScheduleOverride = async () => {
    const res = await PlanningStorageService.resetKpiCycleScheduleOverride(
      selectedYear,
      effectiveScheduleQuarter
    );
    if (res.success) {
      setScheduleTick((prev) => prev + 1);
      refreshKpis();
      setIsScheduleEditOpen(false);
      onShowToast(res.message, 'info');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const renderCycleScheduleCard = () => {
    if (selectedQuarter === 'all') return null;
    return (
      <div className="card kpi-cycle-schedule-card">
        <div className="kpi-cycle-schedule-top">
          <div className="kpi-cycle-schedule-left">
            <span className="kpi-cycle-title">
              <Calendar size={16} className="kpi-framework-icon" />
              {formatCycleFullLabel(selectedYear, effectiveScheduleQuarter)} 공식 평가 스케줄
            </span>
            <span className="kpi-cycle-phase-pill">
              {activeCycleTimeline.currentPhaseSummary}
            </span>
            {activeCycleTimeline.isCycleClosedByDate ? (
              <span className="kpi-cycle-closed-pill">
                <Lock size={14} /> 평가 마감 · 잠금
              </span>
            ) : null}
            {activeCycleSchedule.isCustomized && (
              <span className="kpi-cycle-custom-pill">기수 일정 조정됨</span>
            )}
          </div>

          <div className="kpi-cycle-schedule-right">
            {activeCycleRegisteredCount > 0 ? (
              <a href="#/schedule" className="kpi-cycle-calendar-link">
                <Calendar size={14} /> 팀 통합 일정 연동됨 ({activeCycleRegisteredCount}건)
              </a>
            ) : (
              <span className="kpi-cycle-calendar-note">
                이 기수에 KPI 등록 시 [팀 통합 일정]에 자동 반영됩니다
              </span>
            )}

            {canManageSchedule && (
              <button
                type="button"
                onClick={() => setIsScheduleEditOpen(true)}
                className="btn btn-secondary tasks-action-btn"
              >
                <SlidersHorizontal size={14} /> 기수 일정 조정
              </button>
            )}
          </div>
        </div>

        <div className="kpi-cycle-stepper-grid">
          {activeCycleTimeline.steps.map((st) => (
            <div
              key={st.key}
              className={`kpi-cycle-step-box state-${st.state}`}
            >
              <div className="kpi-cycle-step-head">
                <span className="kpi-cycle-step-tag">{st.stepLabel}</span>
                {st.dDayBadge && (
                  <span className="kpi-cycle-step-dday">{st.dDayBadge}</span>
                )}
              </div>
              <div className="kpi-cycle-step-name">{st.title}</div>
              <div className="kpi-cycle-step-dates">
                {formatShortDateRange(st.startDate, st.endDate)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="kpi-container">
      {/* 상단 권한·기밀 안내 및 뷰 전환 바 (독립 상세 페이지 진입 중이 아닐 때 표시) */}
      {!isDetailRouteActive && (
        <div className={`card kpi-access-banner ${roleContextBanner.classKey}`}>
          <div className="kpi-access-banner-left">
            <span className="kpi-access-role-pill">
              <BannerIcon size={15} />
              <span>{roleContextBanner.badge}</span>
            </span>
            <span className="kpi-access-role-desc">{roleContextBanner.desc}</span>
          </div>

          {(isTeamMember || isTeamLead) && (
            <div className="kpi-mode-switch" role="tablist" aria-label="KPI 화면 모드 전환">
              <button
                type="button"
                role="tab"
                aria-selected={effectiveModeTab === 'evaluation'}
                onClick={() => navigateToKpiMode('evaluation')}
                className={`kpi-mode-switch-btn ${
                  effectiveModeTab === 'evaluation' ? 'active' : ''
                }`}
              >
                <Award size={15} />
                <span>{isTeamMember ? '내 KPI 목표 · 평가' : '소속 구성원 KPI 평가'}</span>
                <span className="kpi-mode-switch-count">{periodEvalKpis.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveModeTab === 'peer_feedback'}
                onClick={() => navigateToKpiMode('peer_feedback')}
                className={`kpi-mode-switch-btn ${
                  effectiveModeTab === 'peer_feedback' ? 'active' : ''
                }`}
              >
                <MessageSquare size={15} />
                <span>협업 다면평가 (무기명)</span>
                <span className="kpi-mode-switch-count">{periodPeerKpis.length}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          모드 B: 사내 · 유관부서 무기명 협업 다면평가 전용 화면 (개인 점수·등급 완전 비공개)
          ===================================================================== */}
      {effectiveModeTab === 'peer_feedback' ? (
        <>
          <div className="card kpi-control-card">
            <div className="kpi-unified-toolbar">
              <div className="tasks-track-tabs">
                <button
                  type="button"
                  onClick={() => setTrackFilter('all')}
                  className={`tasks-track-tab track-all ${trackFilter === 'all' ? 'active' : ''}`}
                >
                  <span>전체 파트</span>
                  <span className="tasks-track-count">{periodPeerKpis.length}</span>
                </button>

                {TRACK_LIST.map((trackKey) => {
                  const cfg = TRACK_CONFIG[trackKey];
                  const IconComp = cfg.icon;
                  const isSelected = trackFilter === trackKey;
                  const count = periodPeerKpis.filter((k) => (k.track || '기획') === trackKey).length;
                  return (
                    <button
                      key={trackKey}
                      type="button"
                      onClick={() => setTrackFilter(trackKey)}
                      className={`tasks-track-tab ${cfg.classKey} ${isSelected ? 'active' : ''}`}
                    >
                      <IconComp size={15} className="tasks-track-tab-icon" />
                      <span>{cfg.label}</span>
                      <span className="tasks-track-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="kpi-toolbar-right">
                <div className="kpi-period-selector-group">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="form-select kpi-year-select"
                    aria-label="평가 연도 선택"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}년
                      </option>
                    ))}
                  </select>

                  <div className="kpi-quarter-tabs">
                    <button
                      type="button"
                      onClick={() => setSelectedQuarter('all')}
                      className={`kpi-quarter-btn ${selectedQuarter === 'all' ? 'active' : ''}`}
                    >
                      <span>전체</span>
                    </button>
                    {QUARTERS.map((q) => (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => setSelectedQuarter(q.key)}
                        className={`kpi-quarter-btn ${selectedQuarter === q.key ? 'active' : ''}`}
                      >
                        <span className="quarter-label-full">{q.label}</span>
                        <span className="quarter-label-short">{q.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <select
                  value={peerOwnerFilter}
                  onChange={(e) => setPeerOwnerFilter(e.target.value)}
                  className="form-select kpi-owner-select"
                  aria-label="협업 피드백 대상 담당자 선택"
                >
                  <option value="all">전체 담당자</option>
                  {peerCandidateMembers.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {renderCycleScheduleCard()}

          {visiblePeerKpis.length === 0 ? (
            <div className="card kpi-empty-card">
              <MessageSquare size={36} className="kpi-empty-icon" />
              <div className="kpi-empty-title">현재 선택된 조건에 해당하는 협업 피드백 대상 KPI가 없습니다.</div>
              <p className="kpi-empty-desc">
                서비스기획팀 구성원이 개인 KPI 목표를 등록하면 이곳에서 공개 목표와 협업 과제를 확인하고 무기명 피드백을 남길 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="kpi-peer-blind-list">
              {visiblePeerKpis.map((item) => {
                const trackCfg = TRACK_CONFIG[item.track || '기획'] || TRACK_CONFIG['기획'];
                const TrackIcon = trackCfg.icon;
                const linkedTasks = getLinkedTasksForKpi(item);
                const itemAccess = getPhaseAccessForKpi(item);
                const myPeerReview = (item.peerReviews || []).find(
                  (p) => String(p.reviewerId) === String(currentUser.id)
                );

                return (
                  <article
                    key={item.id}
                    className={`card kpi-peer-blind-card ${trackCfg.classKey}`}
                  >
                    <div className="kpi-peer-blind-top">
                      <div className="kpi-peer-blind-main">
                        <div className="tasks-card-badges">
                          <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                            <TrackIcon size={14} /> {trackCfg.label}
                          </span>
                          <span className="kpi-peer-owner-pill">{item.ownerName}</span>
                          <span className="kpi-weight-badge">
                            {item.year || 2026}년{' '}
                            {QUARTERS.find((q) => q.key === item.quarter)?.shortLabel ||
                              item.quarter}{' '}
                            · 가중치 {item.weight}%
                          </span>
                          {myPeerReview && (
                            <span className="kpi-stage-pill is-done-peer">
                              내 피드백 참여 완료 (완성도 {myPeerReview.scoreQuality}점 · 소통{' '}
                              {myPeerReview.scoreCollaboration}점)
                            </span>
                          )}
                        </div>
                        <h3 className="kpi-peer-blind-title">{item.title}</h3>
                        {item.targetValue && (
                          <p className="kpi-peer-blind-dod">달성 기준: {item.targetValue}</p>
                        )}
                      </div>

                      <div className="kpi-peer-blind-actions">
                        {itemAccess.canSubmitPeerEval ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPeerModal(item)}
                            className={`btn ${
                              myPeerReview ? 'btn-secondary' : 'btn-primary'
                            } kpi-peer-submit-btn`}
                          >
                            <MessageSquare size={15} />
                            <span>
                              {myPeerReview ? '내 무기명 피드백 수정' : '무기명 협업 피드백 작성'}
                            </span>
                          </button>
                        ) : itemAccess.isLocked ? (
                          <span className="kpi-readonly-lock-chip">
                            <Lock size={14} /> 평가 마감
                          </span>
                        ) : (
                          <span className="kpi-eval-wait-chip">
                            <Clock size={14} /> 평가 기간 오픈 ({itemAccess.evalPeriodRangeLabel})
                          </span>
                        )}
                      </div>
                    </div>

                    {linkedTasks.length > 0 && (
                      <div className="kpi-peer-blind-tasks">
                        <span className="kpi-peer-blind-tasks-label">
                          <LinkIcon size={14} /> 연관 협업 과제 ({linkedTasks.length}건)
                        </span>
                        <div className="kpi-peer-blind-task-chips">
                          {linkedTasks.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setPopupTask(t)}
                              className="kpi-peer-task-chip is-link"
                            >
                              <span>{t.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {myPeerReview && (
                      <div className="kpi-my-peer-preview">
                        <span className="kpi-my-peer-preview-badge">
                          <Lock size={13} /> 내가 작성한 무기명 코멘트 (본인에게만 표시)
                        </span>
                        <p className="kpi-my-peer-preview-text">{myPeerReview.commentGood}</p>
                        {myPeerReview.commentImprove && (
                          <p className="kpi-my-peer-preview-sub">
                            보완/건의: {myPeerReview.commentImprove}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : isDetailRouteActive ? (
        /* =====================================================================
           모드 A-상세 독립 페이지 (#/kpi/detail/{id})
           ===================================================================== */
        selectedKpi ? (
          <KpiDetailPage
            item={selectedKpi}
            currentUser={currentUser}
            linkedTasks={getLinkedTasksForKpi(selectedKpi)}
            phaseAccess={getPhaseAccessForKpi(selectedKpi)}
            isSelf={isKpiOwner(selectedKpi)}
            canEditGoal={canEditKpiGoal(selectedKpi)}
            isTeamLead={isTeamLead}
            isDivisionHead={isDivisionHead}
            isExecutiveViewer={isExecutiveViewer}
            onBackToList={navigateBackToKpiList}
            onOpenTaskMapping={handleOpenTaskMappingModal}
            onOpenTaskDetailPopup={(task) => setPopupTask(task)}
            onOpenSelfEval={handleOpenSelfModal}
            onOpenPeerEval={handleOpenPeerModal}
            onOpenLeaderEval={handleOpenLeaderEvalModal}
            onOpenDirectorEval={handleOpenDirectorEvalModal}
          />
        ) : (
          <div className="card kpi-empty-card">
            <Lock size={34} className="kpi-empty-icon" />
            <div className="kpi-empty-title">
              {rawDetailTarget
                ? '해당 KPI 평가 상세 페이지 열람 권한이 없습니다.'
                : '요청하신 KPI 항목을 찾을 수 없습니다.'}
            </div>
            <p className="kpi-empty-desc">
              {rawDetailTarget
                ? '개인 KPI 평가 내역은 담당자 본인과 상위 평가권자(팀장·실장·최상위 임원)만 열람할 수 있습니다.'
                : '삭제되었거나 잘못된 KPI 상세 주소입니다.'}
            </p>
            <button
              type="button"
              onClick={navigateBackToKpiList}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} /> KPI 목록으로 돌아가기
            </button>
          </div>
        )
      ) : (
        /* =====================================================================
           모드 A-목록: 내 KPI 평가 관리(팀원) / 소속 구성원 KPI 종합 평가(팀장·실장·임원)
           ===================================================================== */
        <>
          <div className="card kpi-control-card">
            <div className="kpi-unified-toolbar">
              <div className="tasks-track-tabs">
                <button
                  type="button"
                  onClick={() => setTrackFilter('all')}
                  className={`tasks-track-tab track-all ${trackFilter === 'all' ? 'active' : ''}`}
                >
                  <span>전체</span>
                  <span className="tasks-track-count">{periodEvalKpis.length}</span>
                </button>

                {TRACK_LIST.map((trackKey) => {
                  const cfg = TRACK_CONFIG[trackKey];
                  const IconComp = cfg.icon;
                  const isSelected = trackFilter === trackKey;
                  const count = periodEvalKpis.filter(
                    (k) => (k.track || '기획') === trackKey
                  ).length;
                  return (
                    <button
                      key={trackKey}
                      type="button"
                      onClick={() => setTrackFilter(trackKey)}
                      className={`tasks-track-tab ${cfg.classKey} ${isSelected ? 'active' : ''}`}
                    >
                      <IconComp size={15} className="tasks-track-tab-icon" />
                      <span>{cfg.label}</span>
                      <span className="tasks-track-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="kpi-toolbar-right">
                <div className="kpi-period-selector-group">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="form-select kpi-year-select"
                    aria-label="평가 연도 선택"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}년
                      </option>
                    ))}
                  </select>

                  <div className="kpi-quarter-tabs">
                    <button
                      type="button"
                      onClick={() => setSelectedQuarter('all')}
                      className={`kpi-quarter-btn ${selectedQuarter === 'all' ? 'active' : ''}`}
                    >
                      <span>전체</span>
                    </button>
                    {QUARTERS.map((q) => (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => setSelectedQuarter(q.key)}
                        className={`kpi-quarter-btn ${selectedQuarter === q.key ? 'active' : ''}`}
                      >
                        <span className="quarter-label-full">{q.label}</span>
                        <span className="quarter-label-short">{q.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {canViewAllOrgKpis && (
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="form-select kpi-owner-select"
                    aria-label="KPI 대상자 필터"
                  >
                    <option value="all">전체 구성원 ({teamMembers.length}명)</option>
                    <option value="team">팀 공통 목표</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setIsFrameworkOpen((prev) => !prev)}
                  className="btn btn-secondary kpi-framework-toggle-btn"
                >
                  <ShieldCheck size={15} />
                  <span>파트별 표준 KPI · 평가 기준</span>
                  {isFrameworkOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {isFrameworkOpen && (
              <div className="kpi-framework-collapse-body">
                <div className="kpi-pillars-grid">
                  {TRACK_LIST.map((tk) => {
                    const tkCfg = TRACK_CONFIG[tk];
                    const templates = STANDARD_KPI_TEMPLATES[tk];
                    return (
                      <div key={tk} className={`kpi-pillar-box ${tkCfg.classKey}`}>
                        <div className="kpi-pillar-top">
                          <span className="kpi-pillar-name">
                            <span className="kpi-pillar-num">{tkCfg.label}</span> 분기 자동 생성 표준 목표 (100%)
                          </span>
                        </div>
                        <ul className="kpi-standard-tpl-list">
                          {templates.map((tpl) => (
                            <li key={tpl.slotIndex} className="kpi-standard-tpl-item">
                              <span className="kpi-standard-tpl-title">
                                {tpl.slotIndex}. {tpl.title}
                              </span>
                              <strong className="kpi-standard-tpl-weight">{tpl.weight}%</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="kpi-rubric-bar">
                  {GRADE_RUBRIC.map((r) => (
                    <div key={r.grade} className={`kpi-rubric-item ${r.classKey}`}>
                      <span className={`kpi-grade-chip ${r.classKey}`}>최종 {r.shortLabel}</span>
                      <span className="kpi-rubric-text">
                        {r.rangeGuide} · {r.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {renderCycleScheduleCard()}

          {/* KPI 테이블 목록 (담당자별 그룹 써머리 라인 통합 · 중복 중단 카드 제거) */}
          {currentKpis.length === 0 ? (
            <div className="card kpi-empty-card">
              <Award size={36} className="kpi-empty-icon" />
              <div className="kpi-empty-title">
                선택한 기수에 도래한 KPI 목표가 아직 없습니다.
              </div>
              <p className="kpi-empty-desc">
                매 분기 개시일(1월 1일 · 4월 1일 · 7월 1일 · 10월 1일)이 도래하면 파트별 3대 표준 KPI 목표가 자동으로 생성됩니다.
              </p>
            </div>
          ) : (
            <div className="card kpi-table-card">
              <div className="kpi-table-scroll">
                <table className="kpi-list-table">
                  <thead>
                    <tr>
                      <th className="kpi-col-cycle">구분</th>
                      <th className="kpi-col-title">KPI 목표명</th>
                      <th className="kpi-col-weight">가중치</th>
                      <th className="kpi-col-tasks">연결 과제</th>
                      <th className="kpi-col-self">자가평가</th>
                      <th className="kpi-col-peer">협업다면</th>
                      <th className="kpi-col-leader">1차(팀장)</th>
                      <th className="kpi-col-final">최종(실장)</th>
                      <th className="kpi-col-action">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerGroups.map((group) => {
                      const groupTrackCfg =
                        TRACK_CONFIG[group.track] || TRACK_CONFIG['기획'];
                      const GroupTrackIcon = groupTrackCfg.icon;
                      const showLeaderStat =
                        !group.isTeam && !isTeamLeadName(group.ownerKey);

                      return (
                        <React.Fragment key={group.ownerKey}>
                          <tr className={`kpi-owner-group-row ${groupTrackCfg.classKey}`}>
                            <td colSpan={9} className="kpi-owner-group-cell">
                              <div className="kpi-owner-group-bar">
                                <div className="kpi-owner-group-left">
                                  <span
                                    className={`tasks-badge-track ${groupTrackCfg.classKey}`}
                                  >
                                    <GroupTrackIcon size={13} /> {groupTrackCfg.label}
                                  </span>
                                  <strong className="kpi-scorecard-name">
                                    {group.ownerLabel}
                                  </strong>
                                  <span className="kpi-scorecard-submeta">
                                    목표 {group.kpiCount}건
                                  </span>
                                  {group.hasSingleCycle && (
                                    <span
                                      className={`kpi-scorecard-weight-pill ${
                                        group.totalWeight === 100
                                          ? 'is-valid'
                                          : 'is-warn'
                                      }`}
                                    >
                                      가중치 합계 {group.totalWeight}%
                                    </span>
                                  )}
                                </div>

                                <div className="kpi-owner-group-right">
                                  <span className="kpi-group-progress-meta">
                                    자가 <strong>{group.selfDoneCount}/{group.kpiCount}</strong>
                                    {showLeaderStat && (
                                      <>
                                        {' '}
                                        · 1차{' '}
                                        <strong>
                                          {group.leaderDoneCount}/{group.kpiCount}
                                        </strong>
                                      </>
                                    )}{' '}
                                    · 최종{' '}
                                    <strong>{group.finalizedCount}/{group.kpiCount}</strong>
                                  </span>

                                  <span
                                    className="kpi-scorecard-divider"
                                    aria-hidden="true"
                                  />

                                  <div className="kpi-scorecard-inline-metric">
                                    <span className="kpi-scorecard-metric-label">
                                      {group.isAllFinalized
                                        ? '확정 점수'
                                        : '1~3단계 평균'}
                                    </span>
                                    <strong className="kpi-scorecard-metric-val is-highlight">
                                      {group.isAllFinalized &&
                                      group.finalScore100 !== null
                                        ? `${group.finalScore100}점`
                                        : group.interimAvg5 !== null
                                          ? `${group.interimAvg5.toFixed(1)}점`
                                          : '미산출'}
                                    </strong>
                                  </div>

                                  {group.isAllFinalized && group.overallGrade && (
                                    <span
                                      className={`kpi-grade-chip grade-${group.overallGrade.toLowerCase()}`}
                                    >
                                      최종 {group.overallGrade}등급
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {[...group.items]
                            .sort((a, b) => resolveKpiSlotIndex(a) - resolveKpiSlotIndex(b))
                            .map((item) => {
                            const cycleBadgeLabel =
                              QUARTERS.find((q) => q.key === item.quarter)?.shortLabel ||
                              item.quarter;
                            const isLeaderKpi = isLeaderOwnedKpiItem(item);
                            const selfScore5 = getSelfScore5(item);
                            const peerInfo = getPeerScore5Info(item);
                            const leaderScore5 = getLeaderScore5(item);
                            const finalGrade = getValidFinalGrade(item);
                            const evalMetrics = getKpiEvalMetrics(item);
                            const linkedTasks = getLinkedTasksForKpi(item);
                            const itemAccess = getPhaseAccessForKpi(item);
                            const canQuickMap = canEditKpiGoal(item) && itemAccess.canMapTasks;

                            return (
                              <tr
                                key={item.id}
                                onClick={() => navigateToKpiDetail(item.id)}
                                className="kpi-table-row"
                              >
                                <td className="kpi-col-cycle">
                                  <span className="kpi-cycle-type-badge is-quarter">
                                    {cycleBadgeLabel}
                                  </span>
                                </td>

                                <td className="kpi-col-title">
                                  <span className="kpi-table-title">{item.title}</span>
                                </td>

                                <td className="kpi-col-weight">
                                  <span className="kpi-weight-badge">{item.weight}%</span>
                                </td>

                                <td className="kpi-col-tasks">
                                  {canQuickMap ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTaskMappingModal(item);
                                      }}
                                      className={`kpi-quick-map-btn ${
                                        linkedTasks.length > 0 ? 'has-tasks' : 'is-empty'
                                      }`}
                                      title="클릭하여 실무 수행 근거 과제 매핑"
                                    >
                                      <LinkIcon size={14} />
                                      <span>
                                        {linkedTasks.length > 0
                                          ? `${linkedTasks.length}건 · 매핑`
                                          : '+ 과제 매핑'}
                                      </span>
                                    </button>
                                  ) : (
                                    <span
                                      className={`kpi-stage-pill ${
                                        linkedTasks.length > 0 ? 'is-done-task' : 'is-wait'
                                      }`}
                                    >
                                      {linkedTasks.length > 0
                                        ? `${linkedTasks.length}건 연결`
                                        : '미연결'}
                                    </span>
                                  )}
                                </td>

                                <td className="kpi-col-self">
                                  <span
                                    className={`kpi-stage-pill ${
                                      selfScore5 !== null ? 'is-done-self' : 'is-wait'
                                    }`}
                                  >
                                    {selfScore5 !== null
                                      ? `${selfScore5.toFixed(1)}점`
                                      : '대기'}
                                  </span>
                                </td>

                                <td className="kpi-col-peer">
                                  <span
                                    className={`kpi-stage-pill ${
                                      peerInfo.avg !== null ? 'is-done-peer' : 'is-wait'
                                    }`}
                                  >
                                    {peerInfo.avg !== null
                                      ? `${peerInfo.avg.toFixed(1)}점 (${peerInfo.count}명)`
                                      : '대기'}
                                  </span>
                                </td>

                                <td className="kpi-col-leader">
                                  {isLeaderKpi ? (
                                    <span className="kpi-stage-pill is-wait">본인과제</span>
                                  ) : (
                                    <span
                                      className={`kpi-stage-pill ${
                                        leaderScore5 !== null ? 'is-done-self' : 'is-wait'
                                      }`}
                                    >
                                      {leaderScore5 !== null
                                        ? `${leaderScore5.toFixed(1)}점`
                                        : '대기'}
                                    </span>
                                  )}
                                </td>

                                <td className="kpi-col-final">
                                  <span
                                    className={`kpi-stage-pill ${
                                      finalGrade
                                        ? `is-done-final grade-${finalGrade.toLowerCase()}`
                                        : 'is-wait'
                                    }`}
                                  >
                                    {finalGrade
                                      ? `${finalGrade}등급 (${evalMetrics.weightedPoint}점)`
                                      : '대기'}
                                  </span>
                                </td>

                                <td className="kpi-col-action">
                                  <span className="kpi-summary-arrow">
                                    상세 <ChevronRight size={15} />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          모달 2: 실무 수행 근거 과제 전용 매핑 모달
          ===================================================================== */}
      {actionModal.type === 'task_mapping' &&
        actionModal.kpi &&
        (() => {
          const targetKpi = actionModal.kpi;
          const baseCandidates = getCandidateTasks({
            targetScope: targetKpi.targetScope,
            ownerName: targetKpi.ownerName,
            ownerId: targetKpi.ownerId,
            track: targetKpi.track,
            includeAll: mappingShowAllTasks,
          });
          const kw = mappingSearch.trim().toLowerCase();
          const filteredCandidates = kw
            ? baseCandidates.filter(
                (t) =>
                  t.title.toLowerCase().includes(kw) ||
                  t.category.toLowerCase().includes(kw) ||
                  t.assigneeName.toLowerCase().includes(kw)
              )
            : baseCandidates;

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">KPI별 실무 수행 근거 과제 매핑</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveTaskMapping} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>
                        [{targetKpi.ownerName}] {targetKpi.title}
                      </strong>
                      <span>
                        이 KPI 목표를 달성하기 위해 수행한 실무 업무만 체크하여 연결해 주세요. (현재{' '}
                        {mappingTaskIds.length}건 선택됨)
                      </span>
                    </div>

                    <div className="kpi-task-map-toolbar">
                      <input
                        type="text"
                        placeholder="업무명, 도메인, 담당자 검색..."
                        value={mappingSearch}
                        onChange={(e) => setMappingSearch(e.target.value)}
                        className="form-input kpi-task-map-search"
                      />
                      <div className="kpi-task-map-actions">
                        <label className="kpi-task-map-scope-toggle">
                          <input
                            type="checkbox"
                            checked={mappingShowAllTasks}
                            onChange={(e) => setMappingShowAllTasks(e.target.checked)}
                          />
                          <span>팀 전체 업무에서 찾기</span>
                        </label>
                        {filteredCandidates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = filteredCandidates.map((t) => t.id);
                              const allSelected = allIds.every((id) =>
                                mappingTaskIds.includes(id)
                              );
                              if (allSelected) {
                                setMappingTaskIds((prev) =>
                                  prev.filter((id) => !allIds.includes(id))
                                );
                              } else {
                                setMappingTaskIds((prev) =>
                                  Array.from(new Set([...prev, ...allIds]))
                                );
                              }
                            }}
                            className="btn btn-secondary kpi-task-map-selectall-btn"
                          >
                            {filteredCandidates.every((t) => mappingTaskIds.includes(t.id))
                              ? '목록 선택 해제'
                              : '목록 전체 선택'}
                          </button>
                        )}
                      </div>
                    </div>

                    {filteredCandidates.length === 0 ? (
                      <div className="kpi-task-map-empty">
                        조건에 해당하는 실무 과제가 없습니다. 우측 상단 [팀 전체 업무에서 찾기]를 체크하거나 [서비스기획 업무 관리]에서 업무를 먼저 등록해 주세요.
                      </div>
                    ) : (
                      <div className="kpi-task-map-list">
                        {filteredCandidates.map((t) => {
                          const isChecked = mappingTaskIds.includes(t.id);
                          const tTrackCfg =
                            TRACK_CONFIG[t.track || '기획'] || TRACK_CONFIG['기획'];
                          return (
                            <label
                              key={t.id}
                              className={`kpi-task-map-item ${isChecked ? 'is-checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setMappingTaskIds((prev) => toggleTaskIdInList(prev, t.id))
                                }
                                className="kpi-task-map-checkbox"
                              />
                              <div className="kpi-task-map-info">
                                <div className="kpi-task-map-title-row">
                                  <span className={`tasks-badge-track ${tTrackCfg.classKey}`}>
                                    {tTrackCfg.label}
                                  </span>
                                  <span className="tasks-badge-category">{t.category}</span>
                                  <span className="kpi-task-map-title">{t.title}</span>
                                </div>
                                <span className="kpi-task-map-meta">
                                  담당: {t.assigneeName} · 일정:{' '}
                                  {t.startDate || t.dueDate
                                    ? `${t.startDate || '미정'} ~ ${t.dueDate || '미정'}`
                                    : '일정 미정'}{' '}
                                  · 상태:{' '}
                                  {t.status === 'done'
                                    ? '완료'
                                    : t.status === 'in_progress'
                                      ? '진행중'
                                      : '대기'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: null, kpi: null })}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      매핑 저장 ({mappingTaskIds.length}건)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          모달 3: STEP 1 본인 자가평가 모달
          ===================================================================== */}
      {actionModal.type === 'self_checkin' &&
        actionModal.kpi &&
        (() => {
          const targetKpi = actionModal.kpi;
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">STEP 1 — 자가평가 등록</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveSelfCheckin} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>{targetKpi.title}</strong>
                      <span>완료 기준(DoD): {targetKpi.targetValue}</span>
                      {modalLinkedTasks.length > 0 && (
                        <div className="kpi-modal-mapped-tasks-bar">
                          <span className="kpi-modal-mapped-tasks-label">
                            <LinkIcon size={13} /> 매핑 과제 ({modalLinkedTasks.length}건)
                          </span>
                          <div className="kpi-modal-mapped-tasks-pills">
                            {modalLinkedTasks.map((t) => (
                              <span key={t.id} className="kpi-modal-mapped-task-pill">
                                {t.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">점수 선택 *</label>
                      <div className="kpi-five-score-grid">
                        {SCORE_5_RUBRIC.map((item5) => {
                          const isSelected = selfForm.selfScore5 === item5.score;
                          return (
                            <button
                              key={item5.score}
                              type="button"
                              onClick={() =>
                                setSelfForm({ ...selfForm, selfScore5: item5.score })
                              }
                              className={`kpi-five-score-btn ${isSelected ? 'is-active' : ''}`}
                            >
                              <strong className="kpi-five-score-num">{item5.shortLabel}</strong>
                              <span className="kpi-five-score-desc">{item5.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">수행 실적 및 의견 *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="완료 기준(DoD) 대비 주요 수행 실적과 달성 근거를 작성해 주세요."
                        value={selfForm.unifiedComment}
                        onChange={(e) =>
                          setSelfForm({ ...selfForm, unifiedComment: e.target.value })
                        }
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: null, kpi: null })}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      자가평가 저장 ({selfForm.selfScore5}점)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          모달 4: 사내 · 유관부서 무기명 협업 다면평가 모달
          ===================================================================== */}
      {actionModal.type === 'peer_review' &&
        actionModal.kpi &&
        (() => {
          const targetKpi = actionModal.kpi;
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">STEP 2 — 협업 다면평가 (무기명)</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSavePeerReview} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>
                        [{targetKpi.ownerName}] {targetKpi.title}
                      </strong>
                      <span>
                        익명 보장 안내: 작성자의 성명·소속 부서 등 신원 정보는 일절 저장·노출되지 않습니다.
                      </span>
                      {modalLinkedTasks.length > 0 && (
                        <div className="kpi-modal-mapped-tasks-bar">
                          <span className="kpi-modal-mapped-tasks-label">
                            <LinkIcon size={13} /> 매핑 과제 ({modalLinkedTasks.length}건)
                          </span>
                          <div className="kpi-modal-mapped-tasks-pills">
                            {modalLinkedTasks.map((t) => (
                              <span key={t.id} className="kpi-modal-mapped-task-pill">
                                {t.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="tasks-form-grid-2">
                      <div className="form-group">
                        <label className="form-label">산출물 명확성 · 완성도 *</label>
                        <select
                          value={peerForm.scoreQuality}
                          onChange={(e) =>
                            setPeerForm({ ...peerForm, scoreQuality: Number(e.target.value) })
                          }
                          className="form-select"
                        >
                          <option value={5}>5점 · 탁월 (명확하고 완성도 높음)</option>
                          <option value={4}>4점 · 우수 (기준 충족)</option>
                          <option value={3}>3점 · 보통</option>
                          <option value={2}>2점 · 보완 필요</option>
                          <option value={1}>1점 · 미흡</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">일정 공유 · 협업 소통 *</label>
                        <select
                          value={peerForm.scoreCollaboration}
                          onChange={(e) =>
                            setPeerForm({
                              ...peerForm,
                              scoreCollaboration: Number(e.target.value),
                            })
                          }
                          className="form-select"
                        >
                          <option value={5}>5점 · 탁월 (적극적이고 원활한 소통)</option>
                          <option value={4}>4점 · 우수 (기준 충족)</option>
                          <option value={3}>3점 · 보통</option>
                          <option value={2}>2점 · 보완 필요</option>
                          <option value={1}>1점 · 미흡</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">협업 시 좋았던 점 (강점) *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="기획서 정책 명시, 디자인 가이드 일관성, 마크업 정확도, 유관부서 요청 대응 등 협업에 도움이 된 점을 남겨주세요."
                        value={peerForm.commentGood}
                        onChange={(e) =>
                          setPeerForm({ ...peerForm, commentGood: e.target.value })
                        }
                        className="form-textarea"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">향후 보완/건의 사항 (선택)</label>
                      <textarea
                        rows={2}
                        placeholder="다음 프로젝트에서 더 원활한 협업을 위해 바라는 점이 있다면 남겨주세요."
                        value={peerForm.commentImprove}
                        onChange={(e) =>
                          setPeerForm({ ...peerForm, commentImprove: e.target.value })
                        }
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: null, kpi: null })}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      무기명 피드백 등록
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          모달 5: STEP 3 1차 팀장 평가 모달
          ===================================================================== */}
      {actionModal.type === 'leader_eval' &&
        actionModal.kpi &&
        isTeamLead &&
        (() => {
          const targetKpi = actionModal.kpi;
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);
          const modalSelf5 = getSelfScore5(targetKpi);
          const modalPeerInfo = getPeerScore5Info(targetKpi);

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">STEP 3 — 1차 팀장 평가</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveLeaderEval} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>
                        [{targetKpi.ownerName}] {targetKpi.title} (가중치 {targetKpi.weight}%)
                      </strong>
                      <span>완료 기준(DoD): {targetKpi.targetValue}</span>
                      <span>
                        자가평가: {modalSelf5 !== null ? `${modalSelf5.toFixed(1)}점` : '미입력'} · 협업다면:{' '}
                        {modalPeerInfo.avg !== null
                          ? `${modalPeerInfo.avg.toFixed(1)}점 (${modalPeerInfo.count}명)`
                          : '미참여'}
                      </span>
                      {modalLinkedTasks.length > 0 && (
                        <div className="kpi-modal-mapped-tasks-bar">
                          <span className="kpi-modal-mapped-tasks-label">
                            <LinkIcon size={13} /> 매핑 과제 ({modalLinkedTasks.length}건)
                          </span>
                          <div className="kpi-modal-mapped-tasks-pills">
                            {modalLinkedTasks.map((t) => (
                              <span key={t.id} className="kpi-modal-mapped-task-pill">
                                {t.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">점수 선택 *</label>
                      <div className="kpi-five-score-grid">
                        {SCORE_5_RUBRIC.map((item5) => {
                          const isSelected = leaderEvalForm.score5 === item5.score;
                          return (
                            <button
                              key={item5.score}
                              type="button"
                              onClick={() =>
                                setLeaderEvalForm({
                                  ...leaderEvalForm,
                                  score5: item5.score,
                                })
                              }
                              className={`kpi-five-score-btn ${isSelected ? 'is-active' : ''}`}
                            >
                              <strong className="kpi-five-score-num">{item5.shortLabel}</strong>
                              <span className="kpi-five-score-desc">{item5.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">평가 의견 *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="일정 준수, 산출물 무결성, 협업 기여도에 대한 1차 평가 의견을 작성해 주세요."
                        value={leaderEvalForm.comment}
                        onChange={(e) =>
                          setLeaderEvalForm({ ...leaderEvalForm, comment: e.target.value })
                        }
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: null, kpi: null })}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      1차 평가 저장 ({leaderEvalForm.score5}점)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          모달 6: STEP 4 디지털마케팅실장 최종 등급 확정 모달
          ===================================================================== */}
      {actionModal.type === 'director_eval' &&
        actionModal.kpi &&
        isDivisionHead &&
        (() => {
          const targetKpi = actionModal.kpi;
          const isLeaderKpi = isLeaderOwnedKpiItem(targetKpi);
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);
          const modalDoneTasks = modalLinkedTasks.filter((t) => t.status === 'done').length;
          const modalSelf5 = getSelfScore5(targetKpi);
          const modalPeerInfo = getPeerScore5Info(targetKpi);
          const modalLeader5 = getLeaderScore5(targetKpi);
          const modalAvg5 = getThreeStageAvgScore5(targetKpi);
          const recommendedGrade = recommendGradeFromFiveScore(modalAvg5);
          const selfCommentText = resolveUnifiedSelfComment(targetKpi);

          const selectedRubric =
            GRADE_RUBRIC.find((r) => r.grade === directorEvalForm.grade) || GRADE_RUBRIC[1];
          const selectedWeightedPoint =
            Math.round(((selectedRubric.score * Number(targetKpi.weight || 0)) / 100) * 10) / 10;

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">STEP 4 — 최종 등급 확정</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveDirectorEval} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>
                        [{targetKpi.ownerName}] {targetKpi.title} (가중치 {targetKpi.weight}%)
                      </strong>
                      <span>완료 기준(DoD): {targetKpi.targetValue}</span>
                      {selfCommentText && (
                        <span>자가평가 의견: {selfCommentText}</span>
                      )}
                      {!isLeaderKpi && targetKpi.leaderComment && (
                        <span>
                          1차 팀장 의견({modalLeader5 !== null ? `${modalLeader5.toFixed(1)}점` : '-'}):{' '}
                          {targetKpi.leaderComment}
                        </span>
                      )}
                      {modalLinkedTasks.length > 0 && (
                        <div className="kpi-modal-mapped-tasks-bar">
                          <span className="kpi-modal-mapped-tasks-label">
                            <LinkIcon size={13} /> 매핑 과제 ({modalDoneTasks}/{modalLinkedTasks.length}건 완료)
                          </span>
                          <div className="kpi-modal-mapped-tasks-pills">
                            {modalLinkedTasks.map((t) => (
                              <span key={t.id} className="kpi-modal-mapped-task-pill">
                                {t.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="kpi-admin-calc-box">
                      <div className="kpi-admin-calc-header">
                        <span className="kpi-admin-calc-title">
                          1~3단계 평가 점수 집계
                        </span>
                        {directorEvalForm.grade !== recommendedGrade && (
                          <button
                            type="button"
                            onClick={() =>
                              setDirectorEvalForm((prev) => ({
                                ...prev,
                                grade: recommendedGrade,
                                status:
                                  recommendedGrade === 'S' || recommendedGrade === 'A'
                                    ? 'achieved'
                                    : recommendedGrade === 'B'
                                      ? 'partially_achieved'
                                      : 'missed',
                              }))
                            }
                            className="kpi-recommend-apply-btn"
                          >
                            권장 {recommendedGrade}등급 적용
                          </button>
                        )}
                      </div>

                      <div className="kpi-admin-calc-grid">
                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">STEP 1 자가평가</span>
                          <strong className="kpi-admin-calc-value">
                            {modalSelf5 !== null ? `${modalSelf5.toFixed(1)}점` : '미입력'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">STEP 2 협업다면</span>
                          <strong className="kpi-admin-calc-value">
                            {modalPeerInfo.avg !== null
                              ? `${modalPeerInfo.avg.toFixed(1)}점 (${modalPeerInfo.count}명)`
                              : '미참여'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">STEP 3 1차 팀장</span>
                          <strong className="kpi-admin-calc-value">
                            {isLeaderKpi
                              ? '팀장 본인 과제'
                              : modalLeader5 !== null
                                ? `${modalLeader5.toFixed(1)}점`
                                : '미입력'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item is-recommend">
                          <span className="kpi-admin-calc-label">종합 평균 · 권장 등급</span>
                          <strong className="kpi-admin-calc-value is-accent">
                            {modalAvg5 !== null ? `${modalAvg5.toFixed(1)}점` : '-'} ({recommendedGrade}등급 권장)
                          </strong>
                        </div>
                      </div>

                      <div className="kpi-admin-weighted-preview">
                        <span>
                          선택 등급(
                          <strong>
                            {directorEvalForm.grade}등급 · 환산 {selectedRubric.score}점
                          </strong>
                          ) 확정 시 가중치 반영 득점:
                        </span>
                        <strong>
                          {selectedWeightedPoint}점 / {targetKpi.weight}점
                        </strong>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">최종 등급 선택 *</label>
                      <div className="kpi-final-grade-grid">
                        {GRADE_RUBRIC.map((r) => {
                          const isSelected = directorEvalForm.grade === r.grade;
                          return (
                            <button
                              key={r.grade}
                              type="button"
                              onClick={() =>
                                setDirectorEvalForm({
                                  ...directorEvalForm,
                                  grade: r.grade,
                                  status:
                                    r.grade === 'S' || r.grade === 'A'
                                      ? 'achieved'
                                      : r.grade === 'B'
                                        ? 'partially_achieved'
                                        : 'missed',
                                })
                              }
                              className={`kpi-final-grade-card ${r.classKey} ${
                                isSelected ? 'is-active' : ''
                              }`}
                            >
                              <strong className="kpi-final-grade-title">{r.label}</strong>
                              <span className="kpi-final-grade-range">{r.rangeGuide}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">최종 평가 총평 *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="1~3단계 점수와 산출물·협업 기여도를 종합한 최종 평가 총평을 작성해 주세요."
                        value={directorEvalForm.comment}
                        onChange={(e) =>
                          setDirectorEvalForm({ ...directorEvalForm, comment: e.target.value })
                        }
                        className="form-textarea"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setActionModal({ type: null, kpi: null })}
                      className="btn btn-secondary"
                    >
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      최종 {directorEvalForm.grade}등급 확정
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* 모달 7: 최범열 전용 기수별 KPI 공식 일정 미세 조정 모달 */}
      {canManageSchedule && isScheduleEditOpen && (
        <KpiScheduleEditModal
          year={selectedYear}
          quarter={effectiveScheduleQuarter}
          initialSchedule={activeCycleSchedule}
          onClose={() => setIsScheduleEditOpen(false)}
          onSave={handleSaveScheduleOverride}
          onResetToDefault={handleResetScheduleOverride}
          onShowToast={onShowToast}
        />
      )}

      {/* 모달 8: 매핑 과제 제목 클릭 시 페이지 이동 없이 띄우는 업무 상세 팝업 */}
      {popupTask && (
        <TaskQuickDetailModal
          task={popupTask}
          currentUser={currentUser}
          isViewer={isViewer}
          onClose={() => setPopupTask(null)}
          onTaskSaved={() => refreshKpis()}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
