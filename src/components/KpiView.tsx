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
  computeDefaultKpiCycleSchedule,
  formatCycleFullLabel,
  formatShortDateRange,
  resolveCycleTimelineSteps,
} from './kpi/kpiSchedule';
import {
  KPI_YEAR_OPTIONS,
  QUARTERS,
  TRACK_CONFIG,
  TRACK_LIST,
  STATUS_MAP,
  SCORE_5_RUBRIC,
  GRADE_RUBRIC,
  parseKpiRouteFromHash,
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
  Plus,
  Award,
  Trash2,
  X,
  ShieldCheck,
  CheckCircle2,
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
  SlidersHorizontal,
} from 'lucide-react';

interface KpiViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface KpiPreset {
  track: KpiTrack;
  pillar: string;
  title: string;
  metric: string;
  targetValue: string;
}

const KPI_PRESETS: KpiPreset[] = [
  // 기획 (파란색)
  {
    track: '기획',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 Front UI Renewal 및 제휴 프로모션 화면설계(SB) 적기 완수',
    metric: '연간 핵심 과제 및 시즌/제휴 프로모션 화면설계서(SB) 마일스톤 일정 준수 여부',
    targetValue: '합의된 착수·마감 일정 내 기획서 확정 및 유관부서 리뷰 완료',
  },
  {
    track: '기획',
    pillar: '품질 · 무결성',
    title: '이커머스 주문·결제·혜택 정책 명세 무결성 확보 및 스펙 재작업 방지',
    metric: '개발·QA 단계에서 기획 정책 누락으로 인한 스펙 변경 및 오픈 후 크리티컬 장애 건수',
    targetValue: '예외 케이스 사전 정의를 통한 오픈 후 정책 결함 최소화 및 표준 가이드 정립',
  },
  {
    track: '기획',
    pillar: '서비스 · 협업 기여',
    title: '어드민(백오피스) 운영 프로세스 효율화 및 유관부서 협업 리드',
    metric: '온라인MD·마케팅·정보실 요구사항 조율 및 반복 수기 업무 개선 기여도',
    targetValue: '운영 현장 애로사항 반영 및 부서 간 R&R·업무 프로세스 표준화 완수',
  },
  // 디자인 (녹색)
  {
    track: '디자인',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 개편 화면 및 시즌 프로모션 UI/UX 시안 납기 준수',
    metric: '기획 인계 후 주요 화면 UI 시안 및 프로모션 그래픽 산출물 리드타임 준수 여부',
    targetValue: '목표 일정 내 고해상도 시안 확정 및 퍼블리싱 인계 완료',
  },
  {
    track: '디자인',
    pillar: '품질 · 표준화',
    title: '브랜드 아이덴티티 기반 UI 디자인 시스템 및 공통 컴포넌트 규격 표준화',
    metric: '타이포그래피·컬러·공통 UI 요소의 페이지 간 일관성 및 디자인 QA 통과 여부',
    targetValue: '전 화면 시각적 위계 통일 및 재사용 가능한 UI 디자인 가이드 자산화',
  },
  {
    track: '디자인',
    pillar: '서비스 · 협업 기여',
    title: 'PC·모바일 디바이스별 쇼핑 탐색 가독성 및 시인성 개선',
    metric: '모바일·태블릿·데스크톱 환경에서의 상품 탐색 몰입도 및 디자인 핸드오프 명확성',
    targetValue: '전 해상도 최적화된 시각 경험 구현 및 기획·퍼블리싱 협업 만족도 확보',
  },
  // 퍼블리싱 (보라색)
  {
    track: '퍼블리싱',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 개편 및 프로모션 반응형 웹 마크업·인터랙션 적기 구현',
    metric: '디자인 인계 후 목표 마감일 내 마크업 및 UI 스크립트 구현 완료 여부',
    targetValue: '합의된 오픈 일정 내 퍼블리싱 산출물 인계 및 프론트엔드 반영 지원 완료',
  },
  {
    track: '퍼블리싱',
    pillar: '품질 · 무결성',
    title: 'PC·태블릿·모바일 전 해상도 반응형 레이아웃 및 크로스브라우징 무결성 확보',
    metric: '디바이스·브라우저별 레이아웃 깨짐 및 UI 인터랙션 QA 결함 발생 여부',
    targetValue: '주요 기기·브라우저 검수 통과 및 웹 표준·접근성 준수 마크업 구현',
  },
  {
    track: '퍼블리싱',
    pillar: '서비스 · 협업 기여',
    title: '재사용 가능한 공통 UI 마크업 모듈화 및 유지보수 효율 강화',
    metric: '공통 컴포넌트 스타일시트(CSS)·마크업 구조화 및 신규 페이지 제작 대응력',
    targetValue: '반복 활용 가능한 표준 마크업 모듈 구축으로 프로모션·개편 제작 효율 개선',
  },
];

export const KpiView: React.FC<KpiViewProps> = ({ currentUser, isViewer, onShowToast }) => {
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
  const canCreateGoal = isTeamLead || isTeamMember;
  const canManageSchedule = canManageUserPermissions(currentUser);
  const [todayStr] = useState<string>(() => getTodayDateString());

  // URL 해시 기반 페이지 라우팅 상태 (#/kpi, #/kpi/peer, #/kpi/detail/{id}, ?year=2027&quarter=Q1)
  const [routeState, setRouteState] = useState(() => parseKpiRouteFromHash());
  const cameFromListRef = useRef<boolean>(false);

  const [selectedYear, setSelectedYear] = useState<number>(
    () => parseKpiRouteFromHash().queryYear || 2026
  );
  const [selectedQuarter, setSelectedQuarter] = useState<KpiQuarter>(
    () => parseKpiRouteFromHash().queryQuarter || 'Annual'
  );
  const [scheduleTick, setScheduleTick] = useState<number>(0);
  const [isScheduleEditOpen, setIsScheduleEditOpen] = useState<boolean>(false);

  useEffect(() => {
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

    syncKpiRoute();
    window.addEventListener('hashchange', syncKpiRoute);
    window.addEventListener('ds-portal-kpi-schedules-updated', handleScheduleStoreSync);
    return () => {
      window.removeEventListener('hashchange', syncKpiRoute);
      window.removeEventListener('ds-portal-kpi-schedules-updated', handleScheduleStoreSync);
    };
  }, [isCrossDept, isDivisionHead, isExecutiveViewer]);

  const effectiveModeTab: KpiModeTab = isCrossDept ? 'peer_feedback' : routeState.mode;
  const selectedKpiId = routeState.detailId;

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

  const activeCycleSchedule: KpiCycleSchedule = useMemo(() => {
    void scheduleTick;
    return PlanningStorageService.getKpiCycleSchedule(selectedYear, selectedQuarter);
  }, [selectedYear, selectedQuarter, scheduleTick]);

  const activeCycleTimeline = useMemo(
    () => resolveCycleTimelineSteps(activeCycleSchedule, todayStr),
    [activeCycleSchedule, todayStr]
  );

  const activeCycleRegisteredCount = useMemo(
    () =>
      kpis.filter(
        (k) =>
          Number(k.year || 2026) === selectedYear &&
          (k.quarter || 'Annual') === selectedQuarter
      ).length,
    [kpis, selectedYear, selectedQuarter]
  );

  const [trackFilter, setTrackFilter] = useState<'all' | KpiTrack>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [peerOwnerFilter, setPeerOwnerFilter] = useState<string>('all');

  // 기본 목표 수립/수정 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiItem | null>(null);

  // 상단 평가 기준표(3대 축 & 루브릭) 접기/펼치기 상태
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(true);

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

  // 입력 폼 상태들 (1~3단계 모두 1~5점 통일, 4단계만 S~C 등급)
  const [selfForm, setSelfForm] = useState({
    status: 'in_progress' as KpiStatus,
    selfScore5: 4,
    unifiedComment: '',
    linkedTaskIds: [] as string[],
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

  const [formData, setFormData] = useState({
    year: 2026,
    quarter: 'Annual' as KpiQuarter,
    targetScope: 'individual' as KpiTargetScope,
    ownerId: currentUser.id,
    ownerName: currentUser.name || '최범열',
    track: resolveMemberDefaultTrack(currentUser.name),
    title: '',
    targetMetric: '',
    targetValue: '',
    currentValue: '',
    weight: 35,
    status: 'in_progress' as KpiStatus,
    linkedTaskIds: [] as string[],
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

  const handleApplyPreset = (preset: KpiPreset) => {
    setFormData((prev) => ({
      ...prev,
      track: preset.track,
      title: preset.title,
      targetMetric: preset.metric,
      targetValue: preset.targetValue,
    }));
    onShowToast(`[${preset.track} · ${preset.pillar}] 표준 KPI 템플릿이 적용되었습니다.`, 'info');
  };

  // 신규 KPI 목표 수립 모달 열기
  const handleOpenCreateModal = (defaultTrack?: KpiTrack) => {
    if (!canCreateGoal) {
      onShowToast('서비스기획팀 구성원만 KPI 목표를 수립할 수 있습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const matchedSelf =
      latestMembers.find(
        (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
      ) || currentUser;

    const initialTrack =
      defaultTrack ||
      (trackFilter !== 'all' ? trackFilter : resolveMemberDefaultTrack(matchedSelf.name));
    const targetSchedule = PlanningStorageService.getKpiCycleSchedule(
      selectedYear,
      selectedQuarter
    );
    const defaultStatus: KpiStatus =
      todayStr < targetSchedule.execStart ? 'planning' : 'in_progress';

    setEditingKpi(null);
    setFormData({
      year: selectedYear,
      quarter: selectedQuarter,
      targetScope: 'individual',
      ownerId: matchedSelf.id,
      ownerName: matchedSelf.name,
      track: initialTrack,
      title: '',
      targetMetric: '',
      targetValue: '',
      currentValue: '',
      weight: 35,
      status: defaultStatus,
      linkedTaskIds: [],
    });
    setIsModalOpen(true);
  };

  // KPI 수정 모달 열기
  const handleOpenEditModal = (item: KpiItem) => {
    if (!canEditKpiGoal(item)) {
      onShowToast('본인의 KPI 또는 팀장 권한만 목표를 수정할 수 있습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const matchedMember = latestMembers.find(
      (m) => String(m.id) === String(item.ownerId) || m.name.trim() === item.ownerName?.trim()
    );

    setEditingKpi(item);
    setFormData({
      year: item.year,
      quarter: item.quarter,
      targetScope: item.targetScope,
      ownerId: matchedMember ? matchedMember.id : item.ownerId || '',
      ownerName:
        item.targetScope === 'team'
          ? '서비스기획팀 전체'
          : matchedMember
            ? matchedMember.name
            : item.ownerName,
      track: item.track || '기획',
      title: item.title,
      targetMetric: item.targetMetric,
      targetValue: item.targetValue,
      currentValue: item.currentValue || '',
      weight: item.weight,
      status: item.status,
      linkedTaskIds: Array.isArray(item.linkedTaskIds) ? [...item.linkedTaskIds] : [],
    });
    setIsModalOpen(true);
  };

  // KPI 저장
  const handleSaveKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateGoal) return;

    if (!formData.title.trim()) {
      onShowToast('KPI 목표명을 입력해 주세요.', 'error');
      return;
    }

    const effectiveScope: KpiTargetScope = isTeamMember ? 'individual' : formData.targetScope;
    const ownerIdFinal =
      effectiveScope === 'team'
        ? undefined
        : isTeamMember
          ? currentUser.id
          : formData.ownerId;
    const ownerNameFinal =
      effectiveScope === 'team'
        ? '서비스기획팀 전체'
        : isTeamMember
          ? currentUser.name
          : formData.ownerName;

    try {
      if (editingKpi) {
        PlanningStorageService.updateKpi(editingKpi.id, {
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: effectiveScope,
          ownerId: ownerIdFinal,
          ownerName: ownerNameFinal,
          track: formData.track,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric.trim(),
          targetValue: formData.targetValue.trim(),
          currentValue: formData.currentValue.trim(),
          weight: Number(formData.weight),
          status: formData.status,
          linkedTaskIds: formData.linkedTaskIds,
        });
        onShowToast('KPI 목표 및 매핑 과제 정보가 수정되었습니다.', 'success');
      } else {
        PlanningStorageService.createKpi({
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: effectiveScope,
          ownerId: ownerIdFinal,
          ownerName: ownerNameFinal,
          track: formData.track,
          title: formData.title.trim(),
          targetMetric: formData.targetMetric.trim(),
          targetValue: formData.targetValue.trim(),
          currentValue: formData.currentValue.trim(),
          weight: Number(formData.weight),
          achievementRate: 0,
          status: formData.status,
          linkedTaskIds: formData.linkedTaskIds,
          stage: 'aligned',
          selfEvaluation: '',
          finalEvaluation: '',
          evaluatorName: '유은정',
        });
        onShowToast('새로운 KPI 목표가 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
      refreshKpis();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.';
      onShowToast(msg, 'error');
    }
  };

  // KPI 삭제
  const handleDeleteKpi = (id: string, title: string) => {
    const target = kpis.find((k) => k.id === id);
    if (!target || !canEditKpiGoal(target)) return;
    if (window.confirm(`정말 "${title}" KPI 항목을 삭제하시겠습니까?`)) {
      try {
        PlanningStorageService.deleteKpi(id);
        onShowToast('KPI 항목이 삭제되었습니다.', 'info');
        setIsModalOpen(false);
        if (selectedKpiId === id) {
          cameFromListRef.current = false;
          window.history.replaceState(null, '', '#/kpi');
          setRouteState({ mode: 'evaluation', detailId: null });
        }
        refreshKpis();
      } catch (err) {
        onShowToast(err instanceof Error ? err.message : '삭제 실패', 'error');
      }
    }
  };

  // 0) KPI별 실무 과제 매핑 전용 모달
  const handleOpenTaskMappingModal = (kpi: KpiItem) => {
    if (!canEditKpiGoal(kpi)) return;
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
    const existing5 = getSelfScore5(kpi);
    setActionModal({ type: 'self_checkin', kpi });
    setSelfForm({
      status: kpi.status === 'planning' ? 'in_progress' : kpi.status,
      selfScore5: existing5 !== null ? Math.round(existing5) : 4,
      unifiedComment: resolveUnifiedSelfComment(kpi),
      linkedTaskIds: Array.isArray(kpi.linkedTaskIds) ? [...kpi.linkedTaskIds] : [],
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
        linkedTaskIds: selfForm.linkedTaskIds,
      });
      onShowToast(
        `자가평가(${selfForm.selfScore5} / 5점) 및 수행 실적이 저장되었습니다.`,
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
        `팀장 1차 평가(${leaderEvalForm.score5} / 5점)가 저장되었습니다. 디지털마케팅실장 최종 등급 확정 단계로 상신됩니다.`,
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
    if (!checkHasSelfEval(kpi)) {
      onShowToast(
        '담당자의 [STEP 1 자가평가]가 먼저 등록되어야 최종 등급을 확정할 수 있습니다.',
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

  // [권한 기반 스코핑 2] 평가 열람 탭 필터 적용 목록
  const currentKpis = useMemo(() => {
    return accessibleEvalKpis.filter((k) => {
      const matchesYear = Number(k.year || 2026) === selectedYear;
      const matchesQuarter = (k.quarter || 'Annual') === selectedQuarter;
      const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
      const matchesOwner = !canViewAllOrgKpis
        ? true
        : ownerFilter === 'all'
          ? true
          : ownerFilter === 'team'
            ? k.targetScope === 'team'
            : k.ownerName?.trim() === ownerFilter.trim();

      return matchesYear && matchesQuarter && matchesTrack && matchesOwner;
    });
  }, [accessibleEvalKpis, selectedYear, selectedQuarter, trackFilter, ownerFilter, canViewAllOrgKpis]);

  // [권한 기반 스코핑 3] 협업 다면평가(무기명 피드백) 탭 대상 KPI 목록 (본인 제외 개인 KPI)
  const peerBaseKpis = useMemo(() => {
    return kpis.filter((k) => k.targetScope !== 'team' && !isKpiOwner(k));
  }, [kpis, isKpiOwner]);

  const visiblePeerKpis = useMemo(() => {
    return peerBaseKpis.filter((k) => {
      const matchesYear = Number(k.year || 2026) === selectedYear;
      const matchesQuarter = (k.quarter || 'Annual') === selectedQuarter;
      const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
      const matchesPeerOwner =
        peerOwnerFilter === 'all' ? true : k.ownerName?.trim() === peerOwnerFilter.trim();
      return matchesYear && matchesQuarter && matchesTrack && matchesPeerOwner;
    });
  }, [peerBaseKpis, selectedYear, selectedQuarter, trackFilter, peerOwnerFilter]);

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

  // 대상별 가중치 합산 종합 평점(1~3단계 5.0 만점) 및 실장 최종 확정 점수·등급 산출
  const ownerScorecards = useMemo(() => {
    const map = new Map<
      string,
      {
        ownerKey: string;
        ownerLabel: string;
        isTeam: boolean;
        track: KpiTrack;
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

    return Array.from(map.values()).map((entry) => {
      const isAllFinalized = entry.kpiCount > 0 && entry.finalizedCount === entry.kpiCount;
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
        interimAvg5,
        finalScore100,
        overallGrade,
        isAllFinalized,
      };
    });
  }, [currentKpis]);

  // 현재 접속자의 권한 안내 배너 문구
  const roleContextBanner = useMemo(() => {
    if (isExecutiveViewer) {
      return {
        icon: Eye,
        badge: `${currentUser.department} · 상위 임원 열람 권한`,
        desc: '산하 소속(서비스기획팀 전원)의 KPI 목표, 수행 근거 과제, 무기명 협업 다면평가 및 1차·최종 평가 현황 전체를 열람합니다.',
        classKey: 'is-executive',
      };
    }
    if (isDivisionHead) {
      return {
        icon: Award,
        badge: '디지털마케팅실장 · 최종 평가 권한',
        desc: '소속 서비스기획팀 전원의 KPI 수행 실적·다면평가·팀장 1차 평가를 종합 검토하고 최종 평가 등급을 확정합니다.',
        classKey: 'is-director',
      };
    }
    if (isTeamLead) {
      return {
        icon: UserCheck,
        badge: '서비스기획팀장 · 팀 전체 열람 및 1차 평가 권한',
        desc: '서비스기획팀 구성원 전원의 KPI를 관리·1차 평가하며, 최종 평가는 디지털마케팅실장(유은정 상무)이 확정합니다.',
        classKey: 'is-leader',
      };
    }
    if (isTeamMember) {
      return {
        icon: Lock,
        badge: '개인 평가 기밀 보호 적용 중',
        desc: '내 KPI 평가 내역은 본인과 직속 상위 평가자(팀장 · 실장 · 총괄 · 본부장)에게만 공개되며, 동료 간에는 노출되지 않습니다.',
        classKey: 'is-member',
      };
    }
    return {
      icon: Users,
      badge: `${currentUser.department} · 협업 다면평가 참여 모드`,
      desc: '서비스기획팀 담당자들과 협업하며 느낀 산출물 명확성·소통 만족도를 무기명으로 평가합니다. (평가자 성명·부서는 철저히 비공개 처리됩니다)',
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
      selectedQuarter
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

  const renderCycleScheduleCard = () => (
    <div className="card kpi-cycle-schedule-card">
      <div className="kpi-cycle-schedule-top">
        <div className="kpi-cycle-schedule-left">
          <span className="kpi-cycle-title">
            <Calendar size={16} className="kpi-framework-icon" />
            {formatCycleFullLabel(selectedYear, selectedQuarter)} 공식 평가 스케줄
          </span>
          <span className="kpi-cycle-phase-pill">
            {activeCycleTimeline.currentPhaseSummary}
          </span>
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
                <span className="kpi-mode-switch-count">{accessibleEvalKpis.length}</span>
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
                <span className="kpi-mode-switch-count">{peerBaseKpis.length}</span>
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
                  <span className="tasks-track-count">{peerBaseKpis.length}</span>
                </button>

                {TRACK_LIST.map((trackKey) => {
                  const cfg = TRACK_CONFIG[trackKey];
                  const IconComp = cfg.icon;
                  const isSelected = trackFilter === trackKey;
                  const count = peerBaseKpis.filter((k) => (k.track || '기획') === trackKey).length;
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
                            <TrackIcon size={13} /> {trackCfg.label}
                          </span>
                          <span className="kpi-peer-owner-pill">{item.ownerName}</span>
                          <span className="kpi-weight-badge">
                            {QUARTERS.find((q) => q.key === (item.quarter || 'Annual'))?.label ||
                              '2026 연간'}
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
                              title="클릭하여 업무 상세 팝업 확인"
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
            isSelf={isKpiOwner(selectedKpi)}
            canEditGoal={canEditKpiGoal(selectedKpi)}
            isTeamLead={isTeamLead}
            isDivisionHead={isDivisionHead}
            isExecutiveViewer={isExecutiveViewer}
            onBackToList={navigateBackToKpiList}
            onOpenEditGoal={handleOpenEditModal}
            onDeleteGoal={handleDeleteKpi}
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
                  <span className="tasks-track-count">{accessibleEvalKpis.length}</span>
                </button>

                {TRACK_LIST.map((trackKey) => {
                  const cfg = TRACK_CONFIG[trackKey];
                  const IconComp = cfg.icon;
                  const isSelected = trackFilter === trackKey;
                  const count = accessibleEvalKpis.filter(
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
                  <span>평가 기준</span>
                  {isFrameworkOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {canCreateGoal && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal()}
                    className="btn btn-primary kpi-create-main-btn"
                  >
                    <Plus size={16} /> {isTeamMember ? '내 KPI 목표 수립' : 'KPI 목표 수립'}
                  </button>
                )}
              </div>
            </div>

            {isFrameworkOpen && (
              <div className="kpi-framework-collapse-body">
                <div className="kpi-pillars-grid">
                  <div className="kpi-pillar-box">
                    <div className="kpi-pillar-top">
                      <span className="kpi-pillar-name">① 일정 및 딜리버리 준수</span>
                    </div>
                    <p className="kpi-pillar-desc">
                      연간/분기 로드맵 과제 및 제휴 프로모션의 합의된 마일스톤(착수~마감일) 적기 완수 여부
                    </p>
                  </div>

                  <div className="kpi-pillar-box">
                    <div className="kpi-pillar-top">
                      <span className="kpi-pillar-name">② 산출물 무결성 및 표준화</span>
                    </div>
                    <p className="kpi-pillar-desc">
                      기획 정책 누락 방지, UI 디자인 일관성, 전 해상도 반응형 마크업 무결성 및 표준 모듈 자산화
                    </p>
                  </div>

                  <div className="kpi-pillar-box">
                    <div className="kpi-pillar-top">
                      <span className="kpi-pillar-name">③ 서비스·운영 개선 및 협업 기여</span>
                    </div>
                    <p className="kpi-pillar-desc">
                      시선닷컴 탐색·주문 사용성 강화, 어드민 수기 공수 절감 및 사내·유관부서 협업 만족도
                    </p>
                  </div>
                </div>

                <div className="kpi-rubric-bar">
                  <div className="kpi-rubric-item">
                    <span className="kpi-score5-chip is-self">1~3단계 점수제 통일</span>
                    <span className="kpi-rubric-text">
                      자가 · 협업다면 · 1차 팀장 평가는 동일하게 <strong>1~5점(5.0 만점)</strong> 척도로 입력
                    </span>
                  </div>
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

          {/* 대상자별 종합 산출 요약 바 */}
          {ownerScorecards.length > 0 && (
            <div className="kpi-scorecard-list">
              {ownerScorecards.map((sc) => {
                const trackCfg = TRACK_CONFIG[sc.track] || TRACK_CONFIG['기획'];
                const TrackIcon = trackCfg.icon;
                const isSelectedOwner =
                  canViewAllOrgKpis &&
                  ((sc.isTeam && ownerFilter === 'team') ||
                    (!sc.isTeam && ownerFilter === sc.ownerKey));

                return (
                  <div
                    key={sc.ownerKey}
                    onClick={() => {
                      if (!canViewAllOrgKpis) return;
                      const targetFilter = sc.isTeam ? 'team' : sc.ownerKey;
                      setOwnerFilter((prev) => (prev === targetFilter ? 'all' : targetFilter));
                    }}
                    className={`card kpi-scorecard-row ${trackCfg.classKey} ${
                      isSelectedOwner ? 'is-selected' : ''
                    }`}
                    title={canViewAllOrgKpis ? '클릭하여 해당 구성원 KPI만 필터링' : undefined}
                  >
                    <div className="kpi-scorecard-row-left">
                      <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                        <TrackIcon size={13} /> {trackCfg.label}
                      </span>
                      <strong className="kpi-scorecard-name">{sc.ownerLabel}</strong>
                      <span className="kpi-scorecard-submeta">목표 {sc.kpiCount}건</span>
                      <span
                        className={`kpi-scorecard-weight-pill ${
                          sc.totalWeight === 100 ? 'is-valid' : 'is-warn'
                        }`}
                      >
                        가중치 {sc.totalWeight}%
                      </span>
                    </div>

                    <div className="kpi-scorecard-row-right">
                      <span className="kpi-scorecard-stat-pill">
                        자가평가 <strong>{sc.selfDoneCount}/{sc.kpiCount}</strong>
                      </span>
                      {!sc.isTeam && !isTeamLeadName(sc.ownerKey) && (
                        <span className="kpi-scorecard-stat-pill">
                          팀장1차 <strong>{sc.leaderDoneCount}/{sc.kpiCount}</strong>
                        </span>
                      )}
                      <span className="kpi-scorecard-stat-pill">
                        실장최종 <strong>{sc.finalizedCount}/{sc.kpiCount}</strong>
                      </span>

                      <span className="kpi-scorecard-divider" aria-hidden="true" />

                      <div className="kpi-scorecard-inline-metric">
                        <span className="kpi-scorecard-metric-label">
                          {sc.isAllFinalized ? '실장 확정 점수' : '1~3단계 가집계 평점'}
                        </span>
                        <strong className="kpi-scorecard-metric-val is-highlight">
                          {sc.isAllFinalized && sc.finalScore100 !== null
                            ? `${sc.finalScore100}점`
                            : sc.interimAvg5 !== null
                              ? `${sc.interimAvg5.toFixed(1)} / 5.0`
                              : '미산출'}
                        </strong>
                      </div>

                      {sc.isAllFinalized && sc.overallGrade && (
                        <span
                          className={`kpi-grade-chip grade-${sc.overallGrade.toLowerCase()}`}
                        >
                          최종 {sc.overallGrade}등급
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* KPI 테이블 목록 */}
          {currentKpis.length === 0 ? (
            <div className="card kpi-empty-card">
              <Award size={36} className="kpi-empty-icon" />
              <div className="kpi-empty-title">
                {isTeamMember
                  ? `${currentUser.name}님의 등록된 KPI 목표 과제가 없습니다.`
                  : '선택한 조건에 등록된 KPI 목표 과제가 없습니다.'}
              </div>
              <p className="kpi-empty-desc">
                {canCreateGoal
                  ? '상단 [+ KPI 목표 수립] 버튼을 눌러 직무 파트별 목표와 달성 기준(DoD)을 등록해 주세요.'
                  : '소속 구성원이 KPI 목표를 등록하면 이곳에서 진행 현황과 평가 내역을 열람하실 수 있습니다.'}
              </p>
              {canCreateGoal && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> {isTeamMember ? '내 KPI 목표 수립' : 'KPI 목표 수립'}
                </button>
              )}
            </div>
          ) : (
            <div className="card kpi-table-card">
              <div className="kpi-table-scroll">
                <table className="kpi-list-table">
                  <thead>
                    <tr>
                      <th className="kpi-col-owner">파트 / 담당</th>
                      <th className="kpi-col-title">KPI 목표명 및 달성 기준</th>
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
                    {currentKpis.map((item) => {
                      const trackCfg = TRACK_CONFIG[item.track || '기획'] || TRACK_CONFIG['기획'];
                      const TrackIcon = trackCfg.icon;
                      const isLeaderKpi = isLeaderOwnedKpiItem(item);
                      const selfScore5 = getSelfScore5(item);
                      const peerInfo = getPeerScore5Info(item);
                      const leaderScore5 = getLeaderScore5(item);
                      const finalGrade = getValidFinalGrade(item);
                      const evalMetrics = getKpiEvalMetrics(item);
                      const linkedTasks = getLinkedTasksForKpi(item);

                      return (
                        <tr
                          key={item.id}
                          onClick={() => navigateToKpiDetail(item.id)}
                          className="kpi-table-row"
                        >
                          <td className="kpi-col-owner">
                            <div className="kpi-owner-cell">
                              <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                                <TrackIcon size={13} /> {trackCfg.label}
                              </span>
                              <strong className="kpi-owner-name">
                                {item.targetScope === 'team' ? '팀 공통' : item.ownerName}
                              </strong>
                            </div>
                          </td>

                          <td className="kpi-col-title">
                            <div className="kpi-title-cell">
                              <span className="kpi-table-title">{item.title}</span>
                              {item.targetValue && (
                                <span className="kpi-table-subdesc">{item.targetValue}</span>
                              )}
                            </div>
                          </td>

                          <td className="kpi-col-weight">
                            <span className="kpi-weight-badge">{item.weight}%</span>
                          </td>

                          <td className="kpi-col-tasks">
                            <span
                              className={`kpi-stage-pill ${
                                linkedTasks.length > 0 ? 'is-done-task' : 'is-wait'
                              }`}
                            >
                              {linkedTasks.length > 0 ? `${linkedTasks.length}건 연결` : '미연결'}
                            </span>
                          </td>

                          <td className="kpi-col-self">
                            <span
                              className={`kpi-stage-pill ${
                                selfScore5 !== null ? 'is-done-self' : 'is-wait'
                              }`}
                            >
                              {selfScore5 !== null ? `${selfScore5.toFixed(1)} / 5.0` : '대기'}
                            </span>
                          </td>

                          <td className="kpi-col-peer">
                            <span
                              className={`kpi-stage-pill ${
                                peerInfo.avg !== null ? 'is-done-peer' : 'is-wait'
                              }`}
                            >
                              {peerInfo.avg !== null
                                ? `${peerInfo.avg.toFixed(1)} / 5.0 (${peerInfo.count}명)`
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
                                  ? `${leaderScore5.toFixed(1)} / 5.0`
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
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          모달 1: KPI 목표 수립 / 수정 모달
          ===================================================================== */}
      {isModalOpen && canCreateGoal && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingKpi ? 'KPI 목표 및 달성 기준(DoD) 수정' : '신규 KPI 목표 수립'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveKpi} className="tasks-modal-form">
              <div className="modal-body">
                <div className="form-group tasks-modal-track-group">
                  <label className="form-label">직무 파트 구분 *</label>
                  <div className="tasks-modal-track-grid">
                    {TRACK_LIST.map((trackKey) => {
                      const config = TRACK_CONFIG[trackKey];
                      const isSelected = formData.track === trackKey;
                      const IconComponent = config.icon;
                      return (
                        <button
                          key={trackKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, track: trackKey })}
                          className={`tasks-modal-track-btn ${config.classKey} ${
                            isSelected ? 'active' : ''
                          }`}
                        >
                          <div className="tasks-modal-track-info">
                            <div className="tasks-modal-track-icon-box">
                              <IconComponent size={16} />
                            </div>
                            <div className="tasks-modal-track-text">
                              <div className="tasks-modal-track-name">{config.label}</div>
                              <div className="tasks-modal-track-en">{config.enLabel}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 size={16} className="tasks-modal-track-check" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!editingKpi && (
                  <div className="kpi-preset-box">
                    <div className="kpi-preset-header">
                      <span>[{formData.track}] 파트 객관적 KPI 표준 템플릿 (클릭 시 자동 입력)</span>
                    </div>
                    <div className="kpi-preset-list">
                      {KPI_PRESETS.filter((p) => p.track === formData.track).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="kpi-preset-item-btn"
                        >
                          <span className="kpi-preset-pillar">[{preset.pillar}]</span>
                          <span className="kpi-preset-title">{preset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">목표 범위 *</label>
                    <select
                      disabled={isTeamMember}
                      value={isTeamMember ? 'individual' : formData.targetScope}
                      onChange={(e) => {
                        const nextScope = e.target.value as KpiTargetScope;
                        setFormData({
                          ...formData,
                          targetScope: nextScope,
                          ownerName:
                            nextScope === 'team'
                              ? '서비스기획팀 전체'
                              : currentUser.name || teamMembers[0]?.name || '최범열',
                        });
                      }}
                      className="form-select"
                    >
                      <option value="individual">개인별 KPI 과제</option>
                      {isTeamLead && <option value="team">서비스기획팀 공통 과제</option>}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">담당자 *</label>
                    {formData.targetScope === 'team' && isTeamLead ? (
                      <input
                        type="text"
                        disabled
                        value="서비스기획팀 전체"
                        className="form-input"
                      />
                    ) : isTeamMember ? (
                      <input
                        type="text"
                        disabled
                        value={currentUser.name}
                        className="form-input"
                      />
                    ) : (
                      <select
                        value={formData.ownerName}
                        onChange={(e) => {
                          const target = teamMembers.find((m) => m.name === e.target.value);
                          setFormData({
                            ...formData,
                            ownerId: target ? target.id : formData.ownerId,
                            ownerName: e.target.value,
                            track: resolveMemberDefaultTrack(e.target.value),
                          });
                        }}
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

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">평가 연도 *</label>
                    <select
                      value={formData.year}
                      onChange={(e) => {
                        const nextYear = Number(e.target.value);
                        const sch = PlanningStorageService.getKpiCycleSchedule(
                          nextYear,
                          formData.quarter
                        );
                        setFormData({
                          ...formData,
                          year: nextYear,
                          status:
                            !editingKpi && todayStr < sch.execStart
                              ? 'planning'
                              : !editingKpi
                                ? 'in_progress'
                                : formData.status,
                        });
                      }}
                      className="form-select"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}년
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">평가 기수 *</label>
                    <select
                      value={formData.quarter}
                      onChange={(e) => {
                        const nextQuarter = e.target.value as KpiQuarter;
                        const sch = PlanningStorageService.getKpiCycleSchedule(
                          formData.year,
                          nextQuarter
                        );
                        setFormData({
                          ...formData,
                          quarter: nextQuarter,
                          status:
                            !editingKpi && todayStr < sch.execStart
                              ? 'planning'
                              : !editingKpi
                                ? 'in_progress'
                                : formData.status,
                        });
                      }}
                      className="form-select"
                    >
                      {QUARTERS.map((q) => (
                        <option key={q.key} value={q.key}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const previewSch =
                    PlanningStorageService.getKpiCycleSchedule(
                      Number(formData.year || 2026),
                      formData.quarter
                    ) || computeDefaultKpiCycleSchedule(Number(formData.year || 2026), formData.quarter);
                  return (
                    <div className="kpi-modal-schedule-preview">
                      <span className="kpi-modal-schedule-preview-title">
                        {formatCycleFullLabel(Number(formData.year || 2026), formData.quarter)} 자동 연계 스케줄 ([팀 통합 일정] 반영)
                      </span>
                      <div className="kpi-modal-schedule-preview-grid">
                        <span>
                          목표 수립: <strong>{formatShortDateRange(previewSch.goalSetupStart, previewSch.goalSetupEnd)}</strong>
                        </span>
                        <span>
                          수행 기간: <strong>{formatShortDateRange(previewSch.execStart, previewSch.execEnd)}</strong>
                        </span>
                        <span>
                          1주 본인평가: <strong>{formatShortDateRange(previewSch.selfEvalStart, previewSch.selfEvalEnd)}</strong>
                        </span>
                        <span>
                          2주 다면평가: <strong>{formatShortDateRange(previewSch.peerEvalStart, previewSch.peerEvalEnd)}</strong>
                        </span>
                        <span>
                          3주 팀장1차: <strong>{formatShortDateRange(previewSch.leaderEvalStart, previewSch.leaderEvalEnd)}</strong>
                        </span>
                        <span>
                          4주 실장최종: <strong>{formatShortDateRange(previewSch.finalEvalStart, previewSch.finalEvalEnd)}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">가중치 (%) *</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      required
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: Number(e.target.value) })
                      }
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">진행 상태</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as KpiStatus })
                      }
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

                <div className="form-group">
                  <label className="form-label">KPI 핵심 목표명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 시선닷컴 Front UI Renewal 및 프로모션 화면설계(SB) 적기 완수"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">객관적 측정 기준 (Metric) *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 마일스톤 마감 일정 준수 여부 및 QA 단계 스펙 누락/결함 최소화"
                    value={formData.targetMetric}
                    onChange={(e) =>
                      setFormData({ ...formData, targetMetric: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">완료 및 달성 기준 (DoD) *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="예: 합의된 일정 내 기획서/디자인/마크업 산출물 확정 및 중대 결함 없이 정상 오픈"
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData({ ...formData, targetValue: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                {(() => {
                  const candidateTasks = getCandidateTasks({
                    targetScope: isTeamMember ? 'individual' : formData.targetScope,
                    ownerName: isTeamMember ? currentUser.name : formData.ownerName,
                    ownerId: isTeamMember ? currentUser.id : formData.ownerId,
                    track: formData.track,
                  });
                  return (
                    <div className="form-group">
                      <label className="form-label">
                        실무 수행 근거 과제 매핑 (선택됨 {formData.linkedTaskIds.length}건 / 후보{' '}
                        {candidateTasks.length}건)
                      </label>
                      {candidateTasks.length === 0 ? (
                        <div className="kpi-task-map-empty">
                          [서비스기획 업무 관리]에 등록된{' '}
                          {formData.targetScope === 'team' && isTeamLead
                            ? `${formData.track} 파트`
                            : `${isTeamMember ? currentUser.name : formData.ownerName} 담당`}{' '}
                          업무가 없습니다.
                        </div>
                      ) : (
                        <div className="kpi-task-map-list is-compact">
                          {candidateTasks.map((t) => {
                            const isChecked = formData.linkedTaskIds.includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className={`kpi-task-map-item ${isChecked ? 'is-checked' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      linkedTaskIds: toggleTaskIdInList(prev.linkedTaskIds, t.id),
                                    }))
                                  }
                                  className="kpi-task-map-checkbox"
                                />
                                <div className="kpi-task-map-info">
                                  <div className="kpi-task-map-title-row">
                                    <span className="tasks-badge-category">{t.category}</span>
                                    <span className="kpi-task-map-title">{t.title}</span>
                                  </div>
                                  <span className="kpi-task-map-meta">
                                    {t.assigneeName} ·{' '}
                                    {t.startDate || t.dueDate
                                      ? `${t.startDate || '미정'} ~ ${t.dueDate || '미정'}`
                                      : '일정 미정'}{' '}
                                    ({t.status === 'done' ? '완료' : '진행/대기'})
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {editingKpi && (
                  <div className="tasks-audit-bar">
                    <span>
                      최초 등록: <strong>{editingKpi.createdBy}</strong> (
                      {new Date(editingKpi.createdAt).toLocaleString('ko-KR')})
                    </span>
                    <span>
                      최종 수정: <strong>{editingKpi.updatedBy}</strong> (
                      {new Date(editingKpi.updatedAt).toLocaleString('ko-KR')})
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {editingKpi && canEditKpiGoal(editingKpi) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteKpi(editingKpi.id, editingKpi.title)}
                    className="btn btn-danger tasks-modal-delete-btn"
                  >
                    <Trash2 size={15} /> 삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingKpi ? '수정 내용 저장' : 'KPI 목표 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
          모달 3: STEP 1 본인 자가평가 모달 (5.0 만점 점수 + 단일 통합 코멘트)
          ===================================================================== */}
      {actionModal.type === 'self_checkin' && actionModal.kpi && (
        <div
          className="modal-overlay"
          onClick={() => setActionModal({ type: null, kpi: null })}
        >
          <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">STEP 1 — 본인 자가평가 등록 (5점 척도)</h3>
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
                  <strong>{actionModal.kpi.title}</strong>
                  <span>완료 기준(DoD): {actionModal.kpi.targetValue}</span>
                </div>

                <div className="form-group">
                  <label className="form-label">본인 자가평가 점수 선택 (1~5점) *</label>
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

                {(() => {
                  const candidateTasks = getCandidateTasks({
                    targetScope: actionModal.kpi.targetScope,
                    ownerName: actionModal.kpi.ownerName,
                    ownerId: actionModal.kpi.ownerId,
                    track: actionModal.kpi.track,
                  });
                  return (
                    <div className="form-group">
                      <label className="form-label">
                        매핑된 실무 수행 근거 과제 확인 (선택됨 {selfForm.linkedTaskIds.length}건)
                      </label>
                      {candidateTasks.length === 0 ? (
                        <div className="kpi-task-map-empty">등록된 담당 업무가 없습니다.</div>
                      ) : (
                        <div className="kpi-task-map-list is-compact">
                          {candidateTasks.map((t) => {
                            const isChecked = selfForm.linkedTaskIds.includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className={`kpi-task-map-item ${isChecked ? 'is-checked' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    setSelfForm((prev) => ({
                                      ...prev,
                                      linkedTaskIds: toggleTaskIdInList(prev.linkedTaskIds, t.id),
                                    }))
                                  }
                                  className="kpi-task-map-checkbox"
                                />
                                <div className="kpi-task-map-info">
                                  <div className="kpi-task-map-title-row">
                                    <span className="tasks-badge-category">{t.category}</span>
                                    <span className="kpi-task-map-title">{t.title}</span>
                                  </div>
                                  <span className="kpi-task-map-meta">
                                    {t.startDate || t.dueDate
                                      ? `${t.startDate || '미정'} ~ ${t.dueDate || '미정'}`
                                      : '일정 미정'}{' '}
                                    ({t.status === 'done' ? '완료' : '진행/대기'})
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label className="form-label">수행 실적 및 자가평가 의견 *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="완료 기준(DoD) 대비 주요 수행 실적과 달성 근거를 하나로 작성해 주세요."
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
                  자가평가 저장 ({selfForm.selfScore5} / 5점)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          모달 4: 사내 · 유관부서 무기명 협업 다면평가 모달
          ===================================================================== */}
      {actionModal.type === 'peer_review' && actionModal.kpi && (
        <div
          className="modal-overlay"
          onClick={() => setActionModal({ type: null, kpi: null })}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">사내 · 유관부서 무기명 협업 다면평가</h3>
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
                    [{actionModal.kpi.ownerName}] {actionModal.kpi.title}
                  </strong>
                  <span>
                    익명 보장 안내: 작성자의 성명·소속 부서 등 신원 정보는 일절 저장·노출되지 않으며, 대상자 본인과 상위 평가자에게는 무기명 결과만 전달됩니다.
                  </span>
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">산출물 명확성 · 완성도 (1~5점)</label>
                    <select
                      value={peerForm.scoreQuality}
                      onChange={(e) =>
                        setPeerForm({ ...peerForm, scoreQuality: Number(e.target.value) })
                      }
                      className="form-select"
                    >
                      <option value={5}>5점 - 매우 명확하고 완성도 높음</option>
                      <option value={4}>4점 - 우수함</option>
                      <option value={3}>3점 - 보통</option>
                      <option value={2}>2점 - 보완 필요</option>
                      <option value={1}>1점 - 미흡</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">일정 공유 및 부서 간 협업 소통 (1~5점)</label>
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
                      <option value={5}>5점 - 적극적이고 원활한 소통</option>
                      <option value={4}>4점 - 우수함</option>
                      <option value={3}>3점 - 보통</option>
                      <option value={2}>2점 - 보완 필요</option>
                      <option value={1}>1점 - 미흡</option>
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
                    placeholder="다음 프로젝트에서 더 원활한 부서 간 협업을 위해 바라는 점이 있다면 남겨주세요."
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
      )}

      {/* =====================================================================
          모달 5: STEP 3 서비스기획팀장(최범열 차장) 1차 평가 모달 (5.0 만점 점수 입력)
          ===================================================================== */}
      {actionModal.type === 'leader_eval' &&
        actionModal.kpi &&
        isTeamLead &&
        (() => {
          const targetKpi = actionModal.kpi;
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);
          const modalDoneTasks = modalLinkedTasks.filter((t) => t.status === 'done').length;
          const modalSelf5 = getSelfScore5(targetKpi);
          const modalPeerInfo = getPeerScore5Info(targetKpi);

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">STEP 3 — 서비스기획팀장 1차 평가 (5점 척도)</h3>
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
                        실무 수행 완료 {modalDoneTasks}/{modalLinkedTasks.length}건 · STEP 1 자가평가:{' '}
                        {modalSelf5 !== null ? `${modalSelf5.toFixed(1)} / 5.0점` : '미입력'} · STEP 2 협업다면:{' '}
                        {modalPeerInfo.avg !== null
                          ? `${modalPeerInfo.avg.toFixed(1)} / 5.0점 (${modalPeerInfo.count}명)`
                          : '미참여'}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">팀장 1차 평가 점수 선택 (1~5점) *</label>
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
                      <label className="form-label">팀장 1차 평가 의견 (실장 상신용 코멘트) *</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="소속 팀원의 일정 준수, 산출물 무결성, 협업 기여도에 대한 1차 평가 의견을 작성해 주세요."
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
                      1차 평가 저장 ({leaderEvalForm.score5} / 5점)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          모달 6: STEP 4 디지털마케팅실장(유은정 상무) 최종 등급(S~C) 직접 부여 모달
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
                  <h3 className="modal-title">STEP 4 — 디지털마케팅실장 최종 등급 확정</h3>
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
                        <span>STEP 1 자가평가 의견: {selfCommentText}</span>
                      )}
                      {!isLeaderKpi && targetKpi.leaderComment && (
                        <span>
                          STEP 3 팀장 1차 의견({modalLeader5 !== null ? `${modalLeader5.toFixed(1)}점` : '-'}):{' '}
                          {targetKpi.leaderComment}
                        </span>
                      )}
                    </div>

                    <div className="kpi-admin-calc-box">
                      <div className="kpi-admin-calc-header">
                        <span className="kpi-admin-calc-title">
                          1~3단계 통일 점수(5.0 만점) 종합 확인 (근거 과제 완료 {modalDoneTasks}/{modalLinkedTasks.length}건)
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
                            {modalSelf5 !== null ? `${modalSelf5.toFixed(1)} / 5.0점` : '미입력'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">STEP 2 협업다면</span>
                          <strong className="kpi-admin-calc-value">
                            {modalPeerInfo.avg !== null
                              ? `${modalPeerInfo.avg.toFixed(1)} / 5.0 (${modalPeerInfo.count}명)`
                              : '미참여'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">STEP 3 1차 팀장</span>
                          <strong className="kpi-admin-calc-value">
                            {isLeaderKpi
                              ? '팀장 본인 과제'
                              : modalLeader5 !== null
                                ? `${modalLeader5.toFixed(1)} / 5.0점`
                                : '미입력'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item is-recommend">
                          <span className="kpi-admin-calc-label">종합 평균 · 권장 등급</span>
                          <strong className="kpi-admin-calc-value is-accent">
                            {modalAvg5 !== null ? `${modalAvg5.toFixed(1)} / 5.0` : '-'} ({recommendedGrade}등급 권장)
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
                          {selectedWeightedPoint}점 / {targetKpi.weight}점 만점
                        </strong>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">실장 최종 확정 등급 선택 (S ~ C등급) *</label>
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
                      <label className="form-label">실장 최종 평가 총평 *</label>
                      <textarea
                        rows={4}
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
          quarter={selectedQuarter}
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
