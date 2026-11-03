import React, { useState, useMemo } from 'react';
import type {
  KpiItem,
  KpiQuarter,
  KpiStatus,
  KpiTargetScope,
  KpiGrade,
  KpiTrack,
  TaskItem,
  User,
} from '../types';
import { PlanningStorageService } from '../services/storage';
import {
  Plus,
  Award,
  Edit2,
  Trash2,
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Palette,
  Code,
  ExternalLink,
  ClipboardCheck,
  MessageSquare,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface KpiViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const QUARTERS: { key: KpiQuarter; label: string; shortLabel: string }[] = [
  { key: 'Annual', label: '2026 연간 종합', shortLabel: '연간 종합' },
  { key: 'Q1', label: '1분기 (Q1)', shortLabel: '1분기' },
  { key: 'Q2', label: '2분기 (Q2)', shortLabel: '2분기' },
  { key: 'Q3', label: '3분기 (Q3)', shortLabel: '3분기' },
  { key: 'Q4', label: '4분기 (Q4)', shortLabel: '4분기' },
];

// 직무 파트 설정 (기획=파란색, 디자인=녹색, 퍼블리싱=보라색 통일)
const TRACK_CONFIG: Record<
  KpiTrack,
  {
    label: string;
    enLabel: string;
    classKey: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: {
    label: '기획',
    enLabel: 'Planning',
    classKey: 'track-planning',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    enLabel: 'Design',
    classKey: 'track-design',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    classKey: 'track-publishing',
    icon: Code,
  },
};

const TRACK_LIST: KpiTrack[] = ['기획', '디자인', '퍼블리싱'];

const STATUS_MAP: Record<KpiStatus, { label: string; classKey: string }> = {
  planning: { label: '목표 수립', classKey: 'kpi-status-planning' },
  in_progress: { label: '수행 · 점검중', classKey: 'kpi-status-progress' },
  achieved: { label: '목표 달성', classKey: 'kpi-status-achieved' },
  partially_achieved: { label: '부분 달성', classKey: 'kpi-status-partial' },
  missed: { label: '미달성 · 보완', classKey: 'kpi-status-missed' },
};

const GRADE_RUBRIC: {
  grade: KpiGrade;
  score: number;
  label: string;
  desc: string;
  classKey: string;
}[] = [
  {
    grade: 'S',
    score: 100,
    label: 'S등급 (탁월)',
    desc: '목표 일정 준수 + 무결점 오픈 + 향후 반복 활용 가능한 표준 가이드·모듈 자산화',
    classKey: 'grade-s',
  },
  {
    grade: 'A',
    score: 90,
    label: 'A등급 (우수 · 기준)',
    desc: '합의된 마일스톤 일정 내에 목표 스펙과 품질 기준을 충족하여 정상 오픈',
    classKey: 'grade-a',
  },
  {
    grade: 'B',
    score: 80,
    label: 'B등급 (보통)',
    desc: '오픈은 완료했으나 내부 사유로 일정이 일부 지연되었거나 오픈 직후 보완 수정 발생',
    classKey: 'grade-b',
  },
  {
    grade: 'C',
    score: 70,
    label: 'C등급 (미흡)',
    desc: '주요 마일스톤 지연으로 일정에 차질이 발생했거나 핵심 요구사항 일부 누락',
    classKey: 'grade-c',
  },
];

// 시선인터내셔널 서비스기획팀 직무별 객관적 KPI 표준 프리셋 (정성적·구조적·무결성 기준)
interface KpiPreset {
  track: KpiTrack;
  pillar: string;
  title: string;
  metric: string;
  targetValue: string;
  weight: number;
}

const KPI_PRESETS: KpiPreset[] = [
  // 기획 (파란색)
  {
    track: '기획',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 Front UI Renewal 및 제휴 프로모션 화면설계(SB) 적기 완수',
    metric: '연간 핵심 과제 및 시즌/제휴 프로모션 화면설계서(SB) 마일스톤 일정 준수 여부',
    targetValue: '합의된 착수·마감 일정 내 기획서 확정 및 유관부서 리뷰 완료',
    weight: 35,
  },
  {
    track: '기획',
    pillar: '품질 · 무결성',
    title: '이커머스 주문·결제·혜택 정책 명세 무결성 확보 및 스펙 재작업 방지',
    metric: '개발·QA 단계에서 기획 정책 누락으로 인한 스펙 변경 및 오픈 후 크리티컬 장애 건수',
    targetValue: '예외 케이스 사전 정의를 통한 오픈 후 정책 결함 최소화 및 표준 가이드 정립',
    weight: 35,
  },
  {
    track: '기획',
    pillar: '서비스 · 협업 기여',
    title: '어드민(백오피스) 운영 프로세스 효율화 및 유관부서 협업 리드',
    metric: '온라인MD·마케팅·정보실 요구사항 조율 및 반복 수기 업무 개선 기여도',
    targetValue: '운영 현장 애로사항 반영 및 부서 간 R&R·업무 프로세스 표준화 완수',
    weight: 30,
  },
  // 디자인 (녹색)
  {
    track: '디자인',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 개편 화면 및 시즌 프로모션 UI/UX 시안 납기 준수',
    metric: '기획 인계 후 주요 화면 UI 시안 및 프로모션 그래픽 산출물 리드타임 준수 여부',
    targetValue: '목표 일정 내 고해상도 시안 확정 및 퍼블리싱 인계 완료',
    weight: 35,
  },
  {
    track: '디자인',
    pillar: '품질 · 표준화',
    title: '브랜드 아이덴티티 기반 UI 디자인 시스템 및 공통 컴포넌트 규격 표준화',
    metric: '타이포그래피·컬러·공통 UI 요소의 페이지 간 일관성 및 디자인 QA 통과 여부',
    targetValue: '전 화면 시각적 위계 통일 및 재사용 가능한 UI 디자인 가이드 자산화',
    weight: 35,
  },
  {
    track: '디자인',
    pillar: '서비스 · 협업 기여',
    title: 'PC·모바일 디바이스별 쇼핑 탐색 가독성 및 시인성 개선',
    metric: '모바일·태블릿·데스크톱 환경에서의 상품 탐색 몰입도 및 디자인 핸드오프 명확성',
    targetValue: '전 해상도 최적화된 시각 경험 구현 및 기획·퍼블리싱 협업 만족도 확보',
    weight: 30,
  },
  // 퍼블리싱 (보라색)
  {
    track: '퍼블리싱',
    pillar: '일정 · 딜리버리',
    title: '시선닷컴 개편 및 프로모션 반응형 웹 마크업·인터랙션 적기 구현',
    metric: '디자인 인계 후 목표 마감일 내 마크업 및 UI 스크립트 구현 완료 여부',
    targetValue: '합의된 오픈 일정 내 퍼블리싱 산출물 인계 및 프론트엔드 반영 지원 완료',
    weight: 35,
  },
  {
    track: '퍼블리싱',
    pillar: '품질 · 무결성',
    title: 'PC·태블릿·모바일 전 해상도 반응형 레이아웃 및 크로스브라우징 무결성 확보',
    metric: '디바이스·브라우저별 레이아웃 깨짐 및 UI 인터랙션 QA 결함 발생 여부',
    targetValue: '주요 기기·브라우저 검수 통과 및 웹 표준·접근성 준수 마크업 구현',
    weight: 35,
  },
  {
    track: '퍼블리싱',
    pillar: '서비스 · 협업 기여',
    title: '재사용 가능한 공통 UI 마크업 모듈화 및 유지보수 효율 강화',
    metric: '공통 컴포넌트 스타일시트(CSS)·마크업 구조화 및 신규 페이지 제작 대응력',
    targetValue: '반복 활용 가능한 표준 마크업 모듈 구축으로 프로모션·개편 제작 효율 개선',
    weight: 30,
  },
];

export const KpiView: React.FC<KpiViewProps> = ({ currentUser, isViewer, onShowToast }) => {
  const [kpis, setKpis] = useState<KpiItem[]>(() => PlanningStorageService.getKpis());
  const [tasks] = useState<TaskItem[]>(() => PlanningStorageService.getTasks());
  const [teamMembers, setTeamMembers] = useState<User[]>(() =>
    PlanningStorageService.getServicePlanningMembers()
  );

  const [selectedQuarter, setSelectedQuarter] = useState<KpiQuarter>('Annual');
  const [trackFilter, setTrackFilter] = useState<'all' | KpiTrack>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  // 기본 목표 수립/수정 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiItem | null>(null);

  // 상단 평가 기준표(3대 축 & 루브릭) 접기/펼치기 상태 및 카드별 실무 근거 전체보기 상태
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(true);
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>({});

  // 평가/점검 모달: 'self_checkin' (실적·자가평가) | 'peer_review' (타 임직원 동료 피드백 작성) | 'admin_eval' (관리자 최종평가) | 'task_mapping' (실무 과제 매핑)
  const [actionModal, setActionModal] = useState<{
    type: 'self_checkin' | 'peer_review' | 'admin_eval' | 'task_mapping' | null;
    kpi: KpiItem | null;
  }>({ type: null, kpi: null });

  // KPI별 실무 과제 매핑 전용 모달 상태
  const [mappingTaskIds, setMappingTaskIds] = useState<string[]>([]);
  const [mappingSearch, setMappingSearch] = useState<string>('');
  const [mappingShowAllTasks, setMappingShowAllTasks] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'admin' || currentUser.name?.trim() === '최범열';

  // 점수(0~100)를 등급(S/A/B/C)으로 변환하는 헬퍼
  const resolveSelfGrade = (selfScore?: number | null): KpiGrade | null => {
    if (typeof selfScore !== 'number' || Number.isNaN(selfScore)) return null;
    if (selfScore >= 95) return 'S';
    if (selfScore >= 85) return 'A';
    if (selfScore >= 75) return 'B';
    return 'C';
  };

  // 등급(S/A/B/C)을 표준 점수(100/90/80/70)로 변환하는 헬퍼
  const getScoreFromGrade = (grade?: KpiGrade | null): number | null => {
    if (!grade) return null;
    const found = GRADE_RUBRIC.find((r) => r.grade === grade);
    return found ? found.score : null;
  };

  // 개별 KPI 항목의 평가 점수 및 가중치 반영 득점(Weighted Point) 산출
  const getKpiEvalMetrics = (kpi: KpiItem) => {
    const finalGrade = kpi.directorGrade || kpi.leaderGrade || null;
    const selfGrade = resolveSelfGrade(kpi.selfScore);
    const weight = Number(kpi.weight || 0);

    if (finalGrade) {
      const score = kpi.directorScore ?? kpi.leaderScore ?? getScoreFromGrade(finalGrade) ?? 90;
      const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
      return {
        source: 'final' as const,
        grade: finalGrade,
        score,
        weight,
        weightedPoint,
      };
    }

    if (typeof kpi.selfScore === 'number' && !Number.isNaN(kpi.selfScore)) {
      const score = kpi.selfScore;
      const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
      return {
        source: 'self' as const,
        grade: selfGrade,
        score,
        weight,
        weightedPoint,
      };
    }

    return {
      source: 'none' as const,
      grade: null,
      score: null,
      weight,
      weightedPoint: null,
    };
  };

  // 현재 로그인한 사용자가 해당 KPI의 본인(담당자)인지 여부 판별
  const isKpiOwner = (kpi: KpiItem): boolean => {
    const currentName = currentUser.name?.trim() || '';
    if (kpi.ownerName?.trim() === currentName) return true;
    if (kpi.ownerId && String(kpi.ownerId) === String(currentUser.id)) return true;
    if (kpi.targetScope === 'team' && kpi.createdBy?.trim() === currentName) return true;
    return false;
  };

  // 실적 및 본인 자가평가 입력 폼
  const [selfForm, setSelfForm] = useState({
    currentValue: '',
    status: 'in_progress' as KpiStatus,
    selfEvaluation: '',
    selfGrade: 'A' as KpiGrade,
    linkedTaskIds: [] as string[],
  });

  // 동료 협업 피드백 입력 폼
  const [peerForm, setPeerForm] = useState({
    scoreCollaboration: 5,
    scoreQuality: 5,
    commentGood: '',
    commentImprove: '',
  });

  // 관리자 최종 평가 입력 폼
  const [adminEvalForm, setAdminEvalForm] = useState({
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
    track: '기획' as KpiTrack,
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
    setTeamMembers(PlanningStorageService.getServicePlanningMembers());
  };

  // 특정 KPI에 담당자가 직접 매핑한 실무 과제(linkedTaskIds) 목록 조회
  const getLinkedTasksForKpi = (kpi: KpiItem): TaskItem[] => {
    const ids = Array.isArray(kpi.linkedTaskIds) ? kpi.linkedTaskIds : [];
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return tasks.filter((t) => idSet.has(t.id));
  };

  // 매핑 모달/폼에서 선택 가능한 후보 실무 과제 목록 조회 (기본: 본인 담당 업무 또는 팀 파트 업무)
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

  // 배열 내 특정 업무 ID 토글 헬퍼
  const toggleTaskIdInList = (list: string[], taskId: string): string[] => {
    return list.includes(taskId) ? list.filter((id) => id !== taskId) : [...list, taskId];
  };

  // 직무별 표준 템플릿 적용
  const handleApplyPreset = (preset: KpiPreset) => {
    setFormData((prev) => ({
      ...prev,
      track: preset.track,
      title: preset.title,
      targetMetric: preset.metric,
      targetValue: preset.targetValue,
      weight: preset.weight,
    }));
    onShowToast(`[${preset.track} · ${preset.pillar}] 표준 KPI 템플릿이 적용되었습니다.`, 'info');
  };

  // 신규 KPI 목표 수립 모달 열기
  const handleOpenCreateModal = (defaultTrack?: KpiTrack) => {
    if (isViewer) {
      onShowToast('유관부서(읽기 전용) 모드에서는 KPI를 등록할 수 없습니다.', 'error');
      return;
    }
    const latestMembers = PlanningStorageService.getServicePlanningMembers();
    setTeamMembers(latestMembers);
    const defaultMember =
      latestMembers.find(
        (m) => String(m.id) === String(currentUser.id) || m.name.trim() === currentUser.name.trim()
      ) ||
      latestMembers[0] ||
      currentUser;

    setEditingKpi(null);
    setFormData({
      year: 2026,
      quarter: selectedQuarter,
      targetScope: 'individual',
      ownerId: defaultMember.id,
      ownerName: defaultMember.name,
      track: defaultTrack || (trackFilter !== 'all' ? trackFilter : '기획'),
      title: '',
      targetMetric: '',
      targetValue: '',
      currentValue: '',
      weight: 35,
      status: 'in_progress',
      linkedTaskIds: [],
    });
    setIsModalOpen(true);
  };

  // KPI 수정 모달 열기
  const handleOpenEditModal = (item: KpiItem) => {
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
    if (isViewer) return;

    if (!formData.title.trim()) {
      onShowToast('KPI 목표명을 입력해 주세요.', 'error');
      return;
    }

    const ownerNameFinal =
      formData.targetScope === 'team' ? '서비스기획팀 전체' : formData.ownerName;

    try {
      if (editingKpi) {
        PlanningStorageService.updateKpi(editingKpi.id, {
          year: Number(formData.year),
          quarter: formData.quarter,
          targetScope: formData.targetScope,
          ownerId: formData.targetScope === 'team' ? undefined : formData.ownerId,
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
          targetScope: formData.targetScope,
          ownerId: formData.targetScope === 'team' ? undefined : formData.ownerId,
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
          evaluatorName: '최범열',
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
    if (isViewer) return;
    if (window.confirm(`정말 "${title}" KPI 항목을 삭제하시겠습니까?`)) {
      PlanningStorageService.deleteKpi(id);
      onShowToast('KPI 항목이 삭제되었습니다.', 'info');
      setIsModalOpen(false);
      refreshKpis();
    }
  };

  // 0) KPI별 실무 과제 매핑 전용 모달 열기 & 저장
  const handleOpenTaskMappingModal = (kpi: KpiItem) => {
    if (isViewer) return;
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

  // 1) 실적 점검 및 본인 자가평가 모달 열기
  const handleOpenSelfModal = (kpi: KpiItem) => {
    const scoreToGrade: KpiGrade =
      (kpi.selfScore ?? 90) >= 95
        ? 'S'
        : (kpi.selfScore ?? 90) >= 85
        ? 'A'
        : (kpi.selfScore ?? 90) >= 75
        ? 'B'
        : 'C';
    setActionModal({ type: 'self_checkin', kpi });
    setSelfForm({
      currentValue: kpi.currentValue || '',
      status: kpi.status === 'planning' ? 'in_progress' : kpi.status,
      selfEvaluation: kpi.selfEvaluation || '',
      selfGrade: scoreToGrade,
      linkedTaskIds: Array.isArray(kpi.linkedTaskIds) ? [...kpi.linkedTaskIds] : [],
    });
  };

  const handleSaveSelfCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi) return;
    const rubric = GRADE_RUBRIC.find((r) => r.grade === selfForm.selfGrade) || GRADE_RUBRIC[1];
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        currentValue: selfForm.currentValue.trim(),
        status: selfForm.status,
        selfEvaluation: selfForm.selfEvaluation.trim(),
        selfScore: rubric.score,
        linkedTaskIds: selfForm.linkedTaskIds,
      });
      onShowToast('수행 실적, 매핑 과제 및 본인 자가평가가 저장되었습니다.', 'success');
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '저장 실패', 'error');
    }
  };

  // 2-A) 타 임직원(회원) 전용 무기명 동료 피드백 평가 모달 열기
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
      onShowToast('무기명 동료 피드백이 등록되었습니다. (대상자에게는 결과만 익명으로 표시됩니다)', 'success');
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '피드백 저장 실패', 'error');
    }
  };

  // 3) 관리자(최범열) 최종 등급 및 총평 확정 모달 열기
  const handleOpenAdminEvalModal = (kpi: KpiItem) => {
    const selfGrade = resolveSelfGrade(kpi.selfScore);
    const existingGrade = kpi.directorGrade || kpi.leaderGrade || selfGrade || 'A';
    setActionModal({ type: 'admin_eval', kpi });
    setAdminEvalForm({
      grade: existingGrade,
      status:
        existingGrade === 'S' || existingGrade === 'A'
          ? 'achieved'
          : existingGrade === 'B'
          ? 'partially_achieved'
          : 'missed',
      comment: kpi.directorComment || kpi.leaderComment || kpi.finalEvaluation || '',
    });
  };

  const handleSaveAdminEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.kpi || !isAdmin) return;
    const rubric = GRADE_RUBRIC.find((r) => r.grade === adminEvalForm.grade) || GRADE_RUBRIC[1];
    try {
      PlanningStorageService.updateKpi(actionModal.kpi.id, {
        stage: 'finalized',
        status: adminEvalForm.status,
        leaderGrade: adminEvalForm.grade,
        leaderScore: rubric.score,
        leaderComment: adminEvalForm.comment.trim(),
        leaderEvaluatorName: currentUser.name,
        directorGrade: adminEvalForm.grade,
        directorScore: rubric.score,
        directorComment: adminEvalForm.comment.trim(),
        directorEvaluatorName: currentUser.name,
        finalEvaluation: adminEvalForm.comment.trim(),
        evaluatorName: currentUser.name,
        achievementRate: rubric.score,
      });
      onShowToast(
        `최종 평가 등급(${adminEvalForm.grade}등급) 및 관리자 총평이 확정되었습니다.`,
        'success'
      );
      setActionModal({ type: null, kpi: null });
      refreshKpis();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : '최종 평가 저장 실패', 'error');
    }
  };

  // 필터링된 KPI 목록
  const currentKpis = useMemo(() => {
    return kpis.filter((k) => {
      const matchesQuarter =
        selectedQuarter === 'Annual'
          ? true
          : k.quarter === selectedQuarter || k.quarter === 'Annual';
      const matchesTrack = trackFilter === 'all' || (k.track || '기획') === trackFilter;
      const matchesOwner =
        ownerFilter === 'all'
          ? true
          : ownerFilter === 'team'
          ? k.targetScope === 'team'
          : k.ownerName?.trim() === ownerFilter.trim();

      return matchesQuarter && matchesTrack && matchesOwner;
    });
  }, [kpis, selectedQuarter, trackFilter, ownerFilter]);

  const filteredTotalWeight = currentKpis.reduce((acc, cur) => acc + (cur.weight || 0), 0);
  const myTotalWeight = currentKpis
    .filter((k) => isKpiOwner(k))
    .reduce((acc, cur) => acc + (cur.weight || 0), 0);
  const finalizedCount = currentKpis.filter(
    (k) => k.stage === 'finalized' || k.directorGrade || k.leaderGrade
  ).length;

  // 대상별(팀 공통 및 개인별) 가중치 합산 종합 점수·등급 자동 산출 (MBO + BARS 가중 평균)
  const ownerScorecards = useMemo(() => {
    const map = new Map<
      string,
      {
        ownerKey: string;
        ownerLabel: string;
        isTeam: boolean;
        track: KpiTrack;
        kpiCount: number;
        finalizedCount: number;
        evaluatedCount: number;
        totalWeight: number;
        evaluatedWeight: number;
        weightedEarnedSum: number;
      }
    >();

    currentKpis.forEach((item) => {
      const isTeam = item.targetScope === 'team';
      const ownerKey = isTeam ? 'team' : (item.ownerName || '미지정').trim();
      const ownerLabel = isTeam ? '서비스기획팀 공통' : ownerKey;
      const evalInfo = getKpiEvalMetrics(item);

      const existing = map.get(ownerKey) || {
        ownerKey,
        ownerLabel,
        isTeam,
        track: (item.track || '기획') as KpiTrack,
        kpiCount: 0,
        finalizedCount: 0,
        evaluatedCount: 0,
        totalWeight: 0,
        evaluatedWeight: 0,
        weightedEarnedSum: 0,
      };

      existing.kpiCount += 1;
      existing.totalWeight += evalInfo.weight;

      if (evalInfo.source === 'final') {
        existing.finalizedCount += 1;
      }
      if (evalInfo.source !== 'none' && evalInfo.weightedPoint !== null) {
        existing.evaluatedCount += 1;
        existing.evaluatedWeight += evalInfo.weight;
        existing.weightedEarnedSum =
          Math.round((existing.weightedEarnedSum + evalInfo.weightedPoint) * 10) / 10;
      }

      map.set(ownerKey, existing);
    });

    return Array.from(map.values()).map((entry) => {
      const normalizedScore =
        entry.evaluatedWeight > 0
          ? Math.round(((entry.weightedEarnedSum / entry.evaluatedWeight) * 100) * 10) / 10
          : null;
      const overallGrade = resolveSelfGrade(normalizedScore);
      const isAllFinalized = entry.kpiCount > 0 && entry.finalizedCount === entry.kpiCount;
      const evalStageLabel = isAllFinalized
        ? '최종 확정'
        : entry.evaluatedCount > 0
        ? '가집계 (진행중)'
        : '평가 대기';

      return {
        ...entry,
        normalizedScore,
        overallGrade,
        isAllFinalized,
        evalStageLabel,
      };
    });
  }, [currentKpis]);

  return (
    <div className="kpi-container">
      {/* 1. 상단 KPI 요약 배너 */}
      <div className="card kpi-hero-card">
        <div className="kpi-hero-info">
          <div className="kpi-hero-eyebrow">
            <Award size={16} /> 서비스기획팀 객관적 성과관리 체계 (납기 · 품질 · 기여도 기반)
          </div>
          <h2 className="kpi-hero-title">
            {selectedQuarter === 'Annual'
              ? '2026 연간 종합 KPI 목표 및 평가'
              : `2026년 ${QUARTERS.find((q) => q.key === selectedQuarter)?.label} KPI 현황`}
          </h2>
          <div className="kpi-hero-stats">
            <span className="kpi-hero-stat-pill">조회 과제 {currentKpis.length}건</span>
            <span className="kpi-hero-stat-pill">
              {ownerFilter === 'all'
                ? `내 KPI 가중치 합계 ${myTotalWeight}%`
                : `선택 대상 가중치 합계 ${filteredTotalWeight}%`}
            </span>
            <span className="kpi-hero-stat-pill">평가 확정 {finalizedCount}건</span>
            <span className="kpi-hero-stat-pill">연동 실무 과제 {tasks.length}건</span>
          </div>
        </div>

        <div className="kpi-hero-actions">
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            disabled={isViewer}
            className="btn btn-primary kpi-create-main-btn"
            title={
              isViewer
                ? '유관부서(읽기 전용) 모드에서는 등록이 제한됩니다'
                : '신규 KPI 목표 수립'
            }
          >
            <Plus size={16} /> KPI 목표 수립
          </button>
        </div>
      </div>

      {/* 2. 객관적 KPI 3대 평가 축 & 루브릭(DoD) 등급 기준표 (접기/펼치기 지원) */}
      <div className="card kpi-framework-card">
        <div className="kpi-framework-header">
          <div className="kpi-framework-title-wrap">
            <ShieldCheck size={18} className="kpi-framework-icon" />
            <h3 className="kpi-framework-title">
              서비스기획팀 객관적 평가 기준 (3대 측정 축 & 등급 판정 루브릭)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsFrameworkOpen((prev) => !prev)}
            className="btn btn-secondary kpi-framework-toggle-btn"
          >
            {isFrameworkOpen ? (
              <>
                <span>기준표 접기</span>
                <ChevronUp size={15} />
              </>
            ) : (
              <>
                <span>기준표 펼치기</span>
                <ChevronDown size={15} />
              </>
            )}
          </button>
        </div>

        {isFrameworkOpen && (
          <>
            {/* 3대 평가 축 */}
            <div className="kpi-pillars-grid">
              <div className="kpi-pillar-box">
                <div className="kpi-pillar-top">
                  <span className="kpi-pillar-name">① 일정 및 딜리버리 준수</span>
                  <span className="kpi-pillar-weight">비중 30%</span>
                </div>
                <p className="kpi-pillar-desc">
                  연간/분기 로드맵 과제 및 제휴 프로모션의 합의된 마일스톤(착수~마감일) 적기 완수 여부
                </p>
              </div>

              <div className="kpi-pillar-box">
                <div className="kpi-pillar-top">
                  <span className="kpi-pillar-name">② 산출물 무결성 및 표준화</span>
                  <span className="kpi-pillar-weight">비중 40%</span>
                </div>
                <p className="kpi-pillar-desc">
                  기획 정책 누락 방지, UI 디자인 일관성, 전 해상도 반응형 마크업 무결성 및 표준 모듈 자산화
                </p>
              </div>

              <div className="kpi-pillar-box">
                <div className="kpi-pillar-top">
                  <span className="kpi-pillar-name">③ 서비스·운영 개선 및 협업 기여</span>
                  <span className="kpi-pillar-weight">비중 30%</span>
                </div>
                <p className="kpi-pillar-desc">
                  시선닷컴 탐색·주문 사용성 강화, 어드민 수기 공수 절감 및 기획➔디자인➔퍼블 인수인계 협업 품질
                </p>
              </div>
            </div>

            {/* S / A / B / C 등급 판정 기준표 */}
            <div className="kpi-rubric-bar">
              {GRADE_RUBRIC.map((r) => (
                <div key={r.grade} className={`kpi-rubric-item ${r.classKey}`}>
                  <span className={`kpi-grade-chip ${r.classKey}`}>{r.label}</span>
                  <span className="kpi-rubric-text">{r.desc}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. 필터 바 (직무 파트 탭 + 분기 + 담당자 필터) */}
      <div className="card kpi-control-card">
        {/* 3-A. 직무 파트 탭 (기획=파랑, 디자인=녹색, 퍼블리싱=보라) */}
        <div className="tasks-track-bar">
          <div className="tasks-track-filter-group">
            <span className="tasks-track-label">직무 파트:</span>
            <div className="tasks-track-tabs">
              <button
                type="button"
                onClick={() => setTrackFilter('all')}
                className={`tasks-track-tab track-all ${trackFilter === 'all' ? 'active' : ''}`}
              >
                <span>전체 파트</span>
                <span className="tasks-track-count">{kpis.length}</span>
              </button>

              {TRACK_LIST.map((trackKey) => {
                const cfg = TRACK_CONFIG[trackKey];
                const IconComp = cfg.icon;
                const isSelected = trackFilter === trackKey;
                const count = kpis.filter((k) => (k.track || '기획') === trackKey).length;
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
          </div>
        </div>

        {/* 3-B. 기간 탭 & 대상자 드롭다운 */}
        <div className="kpi-subfilter-bar">
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

          <div className="kpi-owner-filter">
            <span className="kpi-filter-label">대상 구분:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="form-select kpi-owner-select"
              aria-label="KPI 대상자 필터"
            >
              <option value="all">전체 (팀 공통 + 개인)</option>
              <option value="team">서비스기획팀 공통 목표</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} (개인 KPI)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-C. 대상별 가중치 합산 종합 산출 요약표 (MBO 가중 평균 성적표) */}
      {ownerScorecards.length > 0 && (
        <div className="card kpi-scorecard-card">
          <div className="kpi-scorecard-header">
            <div className="kpi-scorecard-title-wrap">
              <Award size={17} className="kpi-framework-icon" />
              <h3 className="kpi-scorecard-title">
                대상별 가중치 합산 종합 산출 현황 (항목별 점수 × 가중치 합산)
              </h3>
            </div>
            <span className="kpi-scorecard-formula">
              산출식: Σ (항목 등급점수 × 가중치%) · S=100 / A=90 / B=80 / C=70점
            </span>
          </div>

          <div className="kpi-scorecard-grid">
            {ownerScorecards.map((sc) => {
              const trackCfg = TRACK_CONFIG[sc.track] || TRACK_CONFIG['기획'];
              const TrackIcon = trackCfg.icon;
              const isSelectedOwner =
                (sc.isTeam && ownerFilter === 'team') ||
                (!sc.isTeam && ownerFilter === sc.ownerKey);

              return (
                <div
                  key={sc.ownerKey}
                  onClick={() => {
                    const targetFilter = sc.isTeam ? 'team' : sc.ownerKey;
                    setOwnerFilter((prev) => (prev === targetFilter ? 'all' : targetFilter));
                  }}
                  className={`kpi-scorecard-item ${trackCfg.classKey} ${
                    isSelectedOwner ? 'is-selected' : ''
                  }`}
                  title="클릭하여 해당 대상 KPI만 필터링"
                >
                  <div className="kpi-scorecard-item-top">
                    <div className="kpi-scorecard-owner">
                      <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                        <TrackIcon size={13} /> {trackCfg.label}
                      </span>
                      <strong className="kpi-scorecard-name">{sc.ownerLabel}</strong>
                    </div>
                    <span
                      className={`kpi-scorecard-stage ${
                        sc.isAllFinalized
                          ? 'is-final'
                          : sc.evaluatedCount > 0
                          ? 'is-provisional'
                          : 'is-pending'
                      }`}
                    >
                      {sc.evalStageLabel} ({sc.finalizedCount}/{sc.kpiCount}건 확정)
                    </span>
                  </div>

                  <div className="kpi-scorecard-metrics">
                    <div className="kpi-scorecard-metric-col">
                      <span className="kpi-scorecard-metric-label">가중치 합계</span>
                      <strong
                        className={`kpi-scorecard-metric-val ${
                          sc.totalWeight === 100 ? 'is-valid' : 'is-warn'
                        }`}
                      >
                        {sc.totalWeight}%
                      </strong>
                    </div>

                    <div className="kpi-scorecard-metric-col">
                      <span className="kpi-scorecard-metric-label">가중 합산 득점</span>
                      <strong className="kpi-scorecard-metric-val">
                        {sc.evaluatedCount > 0
                          ? `${sc.weightedEarnedSum} / ${sc.evaluatedWeight}점`
                          : '-'}
                      </strong>
                    </div>

                    <div className="kpi-scorecard-metric-col">
                      <span className="kpi-scorecard-metric-label">100점 환산 종합</span>
                      <div className="kpi-scorecard-final-wrap">
                        <strong className="kpi-scorecard-metric-val is-highlight">
                          {sc.normalizedScore !== null ? `${sc.normalizedScore}점` : '미산출'}
                        </strong>
                        {sc.overallGrade && (
                          <span
                            className={`kpi-grade-chip grade-${sc.overallGrade.toLowerCase()}`}
                          >
                            종합 {sc.overallGrade}등급
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. KPI 카드 그리드 */}
      <div className="kpi-cards-grid">
        {currentKpis.length === 0 ? (
          <div className="card kpi-empty-card">
            <Award size={36} className="kpi-empty-icon" />
            <div className="kpi-empty-title">등록된 KPI 목표 과제가 없습니다.</div>
            <p className="kpi-empty-desc">
              상단 <strong>[+ KPI 목표 수립]</strong> 버튼을 눌러 기획·디자인·퍼블리싱 파트별 객관적 목표와 달성 기준(DoD)을 수립해 보세요.
            </p>
            {!isViewer && (
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="btn btn-primary"
              >
                <Plus size={16} /> 첫 KPI 목표 수립하기
              </button>
            )}
          </div>
        ) : (
          currentKpis.map((item) => {
            const trackCfg = TRACK_CONFIG[item.track || '기획'] || TRACK_CONFIG['기획'];
            const TrackIcon = trackCfg.icon;
            const statusCfg = STATUS_MAP[item.status] || STATUS_MAP.in_progress;
            const finalGrade = item.directorGrade || item.leaderGrade;
            const selfGrade = resolveSelfGrade(item.selfScore);
            const evalMetrics = getKpiEvalMetrics(item);
            const linkedTasks = getLinkedTasksForKpi(item);
            const doneLinkedCount = linkedTasks.filter((t) => t.status === 'done').length;
            const isEvidenceExpanded = !!expandedEvidenceIds[item.id];
            const visibleLinkedTasks = isEvidenceExpanded ? linkedTasks : linkedTasks.slice(0, 4);
            const isSelf = isKpiOwner(item);
            const peerReviews = item.peerReviews || [];
            const peerCount = peerReviews.length;
            const myPeerReview = peerReviews.find(
              (p) => String(p.reviewerId) === String(currentUser.id)
            );
            const avgQuality =
              peerCount > 0
                ? (
                    peerReviews.reduce((acc, r) => acc + Number(r.scoreQuality || 5), 0) /
                    peerCount
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

            return (
              <div key={item.id} className={`card kpi-item-card ${trackCfg.classKey}`}>
                {/* 카드 상단 메타 배지 & 가중치 */}
                <div className="kpi-card-top">
                  <div className="tasks-card-badges">
                    <span className={`tasks-badge-track ${trackCfg.classKey}`}>
                      <TrackIcon size={13} /> {trackCfg.label}
                    </span>
                    <span className="tasks-badge-category">
                      {item.targetScope === 'team' ? '팀 공통' : item.ownerName}
                    </span>
                    <span className="kpi-weight-badge">가중치 {item.weight}%</span>
                    <span className={`kpi-status-badge ${statusCfg.classKey}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="kpi-card-grade-group">
                    {evalMetrics.weightedPoint !== null && (
                      <span
                        className="kpi-weighted-point-badge"
                        title={
                          evalMetrics.source === 'final'
                            ? '최종 등급 기준 가중치 환산 득점'
                            : '자가진단 등급 기준 가중치 환산 예상 득점'
                        }
                      >
                        가중 득점 {evalMetrics.weightedPoint} / {item.weight}점
                      </span>
                    )}
                    {finalGrade && (
                      <span
                        className={`kpi-grade-chip grade-${finalGrade.toLowerCase()}`}
                        title="관리자 최종 확정 등급"
                      >
                        최종 {finalGrade}등급
                      </span>
                    )}
                  </div>
                </div>

                {/* 목표 타이틀 */}
                <h3 className="kpi-card-title">{item.title}</h3>

                {/* 객관적 측정 지표 & 완료 기준(DoD) 박스 */}
                <div className="kpi-criteria-box">
                  <div className="kpi-criteria-row">
                    <span className="kpi-criteria-label">측정 기준 (Metric)</span>
                    <p className="kpi-criteria-value">{item.targetMetric || '-'}</p>
                  </div>
                  <div className="kpi-criteria-row">
                    <span className="kpi-criteria-label">완료/달성 기준 (DoD · A등급 기준)</span>
                    <p className="kpi-criteria-value is-target">{item.targetValue || '-'}</p>
                  </div>
                  <div className="kpi-criteria-row">
                    <span className="kpi-criteria-label">수행 실적 요약</span>
                    <p className="kpi-criteria-value">
                      {item.currentValue || '아직 기록된 수행 실적이 없습니다.'}
                    </p>
                  </div>
                </div>

                {/* [서비스기획 업무 관리] KPI별 직접 매핑 근거 과제 (Evidence Tasks) */}
                <div className="kpi-evidence-section">
                  <div className="kpi-evidence-header">
                    <span className="kpi-evidence-title">
                      <LinkIcon size={14} /> 매핑된 실무 수행 근거 ({linkedTasks.length}건)
                    </span>
                    <div className="kpi-evidence-header-right">
                      {linkedTasks.length > 0 && (
                        <span className="kpi-evidence-summary-badge">
                          완료 {doneLinkedCount} / 매핑 {linkedTasks.length}건
                        </span>
                      )}
                      {!isViewer && (isSelf || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleOpenTaskMappingModal(item)}
                          className="kpi-evidence-map-btn"
                        >
                          {linkedTasks.length > 0 ? '과제 매핑 편집' : '+ 실무 과제 매핑'}
                        </button>
                      )}
                    </div>
                  </div>
                  {linkedTasks.length === 0 ? (
                    <div className="kpi-evidence-empty">
                      {!isViewer && (isSelf || isAdmin)
                        ? '아직 이 KPI 목표에 매핑된 실무 과제가 없습니다. 우측 상단 [+ 실무 과제 매핑] 버튼을 눌러 해당 업무를 직접 선택해 주세요.'
                        : '아직 담당자가 이 KPI 목표에 매핑한 실무 수행 근거 과제가 없습니다.'}
                    </div>
                  ) : (
                    <div className="kpi-evidence-list">
                      {visibleLinkedTasks.map((t) => {
                        const outUrl = t.links?.[0]?.url || t.artifactUrl;
                        return (
                          <div key={t.id} className="kpi-evidence-item">
                            <div className="kpi-evidence-main">
                              <CheckCircle2
                                size={14}
                                className={
                                  t.status === 'done'
                                    ? 'kpi-evidence-check'
                                    : 'kpi-evidence-progress'
                                }
                              />
                              <span className="kpi-evidence-task-name">{t.title}</span>
                              <span className="kpi-evidence-assignee">({t.assigneeName})</span>
                            </div>
                            <div className="kpi-evidence-meta">
                              <span className="kpi-evidence-date">
                                <Clock size={13} /> {t.startDate} ~ {t.dueDate}
                              </span>
                              {outUrl && (
                                <a
                                  href={outUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="kpi-evidence-link"
                                >
                                  산출물 <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {linkedTasks.length > 4 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEvidenceIds((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          className="kpi-evidence-more-btn"
                        >
                          {isEvidenceExpanded
                            ? '실무 수행 근거 접기'
                            : `+${linkedTasks.length - 4}건의 실무 수행 근거 더보기`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 평가 기록 요약 (자가평가 / 무기명 동료 피드백 결과 / 관리자 최종평가) */}
                <div className="kpi-eval-summary-box">
                  {(item.selfEvaluation || selfGrade) && (
                    <div className="kpi-eval-row">
                      <span className="kpi-eval-badge is-self">
                        본인 자가평가{selfGrade ? ` (${selfGrade}등급)` : ''}
                      </span>
                      {item.selfEvaluation && (
                        <span className="kpi-eval-text">{item.selfEvaluation}</span>
                      )}
                    </div>
                  )}

                  {/* 무기명 동료 피드백 결과 영역 */}
                  <div className="kpi-peer-anon-section">
                    <div className="kpi-peer-anon-header">
                      <span className="kpi-eval-badge is-peer">
                        무기명 동료 피드백 결과 ({peerCount}명 참여)
                      </span>
                      {peerCount > 0 && (
                        <span className="kpi-peer-anon-scores">
                          종합 <strong>{avgTotal}</strong> / 5.0점 · 산출물 완성도{' '}
                          <strong>{avgQuality}</strong>점 · 협업 소통 <strong>{avgCollab}</strong>점
                        </span>
                      )}
                    </div>

                    {peerCount === 0 ? (
                      <div className="kpi-peer-anon-empty">
                        {isSelf
                          ? '다른 임직원(회원)이 평가하면 평가자 정보 없이 결과만 무기명으로 이곳에 표시됩니다.'
                          : '아직 등록된 동료 피드백이 없습니다. 하단 [동료 피드백 평가하기] 버튼으로 무기명 평가를 남길 수 있습니다.'}
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {(item.directorComment || item.leaderComment || item.finalEvaluation) && (
                    <div className="kpi-eval-row">
                      <span className="kpi-eval-badge is-admin">
                        관리자 최종평가 ({finalGrade || 'A'}등급)
                      </span>
                      <span className="kpi-eval-text">
                        {item.directorComment || item.leaderComment || item.finalEvaluation}
                      </span>
                    </div>
                  )}
                </div>

                {/* 하단 액션 버튼 바: 본인 vs 다른 임직원(회원) 역할 분리 */}
                <div className="kpi-card-footer">
                  <div className="kpi-eval-buttons">
                    {/* 1. 본인(담당자)에게만 [실적 · 자가평가] 노출 */}
                    {isSelf && !isViewer && (
                      <button
                        type="button"
                        onClick={() => handleOpenSelfModal(item)}
                        className="btn btn-secondary tasks-action-btn"
                      >
                        <ClipboardCheck size={14} /> 실적 · 자가평가
                      </button>
                    )}

                    {/* 2. 다른 임직원(다른 회원)에게만 [동료 피드백 평가하기] 노출 (본인 직접 평가 불가) */}
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleOpenPeerModal(item)}
                        className="btn btn-secondary tasks-action-btn kpi-peer-eval-btn"
                      >
                        <MessageSquare size={14} />{' '}
                        {myPeerReview
                          ? '내 동료 피드백 수정 (무기명)'
                          : '동료 피드백 평가하기 (무기명)'}
                      </button>
                    )}

                    {/* 3. 관리자(최범열)에게만 [최종 등급 확정] 노출 */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenAdminEvalModal(item)}
                        className="btn btn-primary tasks-action-btn"
                      >
                        <Award size={14} /> 최종 등급 확정
                      </button>
                    )}
                  </div>

                  {/* 목표 수정/삭제는 본인 또는 관리자에게만 노출 */}
                  {!isViewer && (isSelf || isAdmin) && (
                    <div className="tasks-row-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="btn btn-secondary tasks-action-btn"
                        title="목표 수정"
                      >
                        <Edit2 size={14} /> 수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKpi(item.id, item.title)}
                        className="btn btn-secondary tasks-delete-icon-btn"
                        title="목표 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. KPI 목표 수립 / 수정 모달 */}
      {isModalOpen && (
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
                {/* 0. 직무 파트 선택 (기획=파랑 / 디자인=녹색 / 퍼블리싱=보라) */}
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
                          disabled={isViewer}
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

                {/* 직무별 추천 표준 KPI 템플릿 원클릭 적용 */}
                {!editingKpi && !isViewer && (
                  <div className="kpi-preset-box">
                    <div className="kpi-preset-header">
                      <span>
                        [{formData.track}] 파트 객관적 KPI 표준 템플릿 (클릭 시 자동 입력)
                      </span>
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
                          <span className="kpi-preset-weight">가중치 {preset.weight}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 구분 & 담당자 */}
                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">목표 범위 *</label>
                    <select
                      disabled={isViewer}
                      value={formData.targetScope}
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
                      <option value="team">서비스기획팀 공통 과제</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">담당자 *</label>
                    {formData.targetScope === 'team' ? (
                      <input
                        type="text"
                        disabled
                        value="서비스기획팀 전체"
                        className="form-input"
                      />
                    ) : (
                      <select
                        disabled={isViewer}
                        value={formData.ownerName}
                        onChange={(e) => {
                          const target = teamMembers.find((m) => m.name === e.target.value);
                          setFormData({
                            ...formData,
                            ownerId: target ? target.id : formData.ownerId,
                            ownerName: e.target.value,
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

                {/* 평가 기간 & 가중치 & 진행 상태 */}
                <div className="tasks-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">평가 기간 *</label>
                    <select
                      disabled={isViewer}
                      value={formData.quarter}
                      onChange={(e) =>
                        setFormData({ ...formData, quarter: e.target.value as KpiQuarter })
                      }
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
                    <label className="form-label">가중치 (%) *</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      disabled={isViewer}
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
                      disabled={isViewer}
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

                {/* KPI 목표명 */}
                <div className="form-group">
                  <label className="form-label">KPI 핵심 목표명 *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    placeholder="예: 시선닷컴 Front UI Renewal 및 프로모션 화면설계(SB) 적기 완수"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                {/* 객관적 측정 지표 */}
                <div className="form-group">
                  <label className="form-label">객관적 측정 기준 (Metric) *</label>
                  <input
                    type="text"
                    disabled={isViewer}
                    required
                    placeholder="예: 마일스톤 마감 일정 준수 여부 및 QA 단계 스펙 누락/결함 최소화"
                    value={formData.targetMetric}
                    onChange={(e) =>
                      setFormData({ ...formData, targetMetric: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                {/* 완료 기준 (DoD: Definition of Done) */}
                <div className="form-group">
                  <label className="form-label">완료 및 달성 기준 (DoD · A등급 기준) *</label>
                  <textarea
                    rows={2}
                    disabled={isViewer}
                    required
                    placeholder="예: 합의된 일정 내 기획서/디자인/마크업 산출물 확정 및 중대 결함 없이 정상 오픈"
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData({ ...formData, targetValue: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                {/* 현재 수행 실적 요약 */}
                <div className="form-group">
                  <label className="form-label">현재 수행 실적 요약 (선택)</label>
                  <textarea
                    rows={2}
                    disabled={isViewer}
                    placeholder="현재까지 완료한 주요 과제나 산출물 현황을 요약해 주세요."
                    value={formData.currentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, currentValue: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                {/* KPI별 직접 매핑할 실무 수행 근거 과제 선택 */}
                {(() => {
                  const candidateTasks = getCandidateTasks({
                    targetScope: formData.targetScope,
                    ownerName: formData.ownerName,
                    ownerId: formData.ownerId,
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
                          {formData.targetScope === 'team'
                            ? `${formData.track} 파트`
                            : `${formData.ownerName} 담당`}{' '}
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
                                  disabled={isViewer}
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
                                    {t.assigneeName} · {t.startDate} ~ {t.dueDate} (
                                    {t.status === 'done' ? '완료' : '진행/대기'})
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
                {editingKpi && !isViewer && (
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
                {!isViewer && (
                  <button type="submit" className="btn btn-primary">
                    {editingKpi ? '수정 내용 저장' : 'KPI 목표 등록'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-0. KPI별 실무 수행 근거 과제 전용 매핑 모달 */}
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
                                  담당: {t.assigneeName} · 일정: {t.startDate} ~ {t.dueDate} · 상태:{' '}
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

      {/* 6-A. 실적 점검 및 본인 자가평가 모달 */}
      {actionModal.type === 'self_checkin' && actionModal.kpi && (
        <div
          className="modal-overlay"
          onClick={() => setActionModal({ type: null, kpi: null })}
        >
          <div className="modal-box kpi-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">수행 실적 기록 및 본인 자가평가</h3>
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

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">진행 상태 업데이트</label>
                    <select
                      value={selfForm.status}
                      onChange={(e) =>
                        setSelfForm({ ...selfForm, status: e.target.value as KpiStatus })
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

                  <div className="form-group">
                    <label className="form-label">본인 자가 진단 등급 (루브릭 기준)</label>
                    <select
                      value={selfForm.selfGrade}
                      onChange={(e) =>
                        setSelfForm({ ...selfForm, selfGrade: e.target.value as KpiGrade })
                      }
                      className="form-select"
                    >
                      {GRADE_RUBRIC.map((r) => (
                        <option key={r.grade} value={r.grade}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 자가평가 시에도 매핑 과제 바로 체크/해제 지원 */}
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
                        <div className="kpi-task-map-empty">
                          등록된 담당 업무가 없습니다.
                        </div>
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
                                    {t.startDate} ~ {t.dueDate} (
                                    {t.status === 'done' ? '완료' : '진행/대기'})
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
                  <label className="form-label">수행 실적 요약 *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="완료한 화면설계/디자인/퍼블리싱 산출물 및 일정 준수 내역을 요약해 주세요."
                    value={selfForm.currentValue}
                    onChange={(e) =>
                      setSelfForm({ ...selfForm, currentValue: e.target.value })
                    }
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">본인 자가평가 의견 (달성 근거)</label>
                  <textarea
                    rows={3}
                    placeholder="사전 합의된 완료 기준(DoD) 대비 달성도와 기여한 점을 작성해 주세요."
                    value={selfForm.selfEvaluation}
                    onChange={(e) =>
                      setSelfForm({ ...selfForm, selfEvaluation: e.target.value })
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
                  실적 및 자가평가 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-B. 타 임직원(회원) 전용 무기명 동료 피드백 평가 모달 */}
      {actionModal.type === 'peer_review' && actionModal.kpi && (
        <div
          className="modal-overlay"
          onClick={() => setActionModal({ type: null, kpi: null })}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">무기명 동료 피드백 평가</h3>
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
                    익명 보장 안내: 평가자 성명·부서 등 신원 정보는 일체 노출되지 않으며, 대상자 본인에게는 평가 점수와 피드백 결과만 무기명으로 표시됩니다.
                  </span>
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">인수인계 산출물 명확성 · 완성도 (1~5점)</label>
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
                    <label className="form-label">일정 공유 및 협업 소통 (1~5점)</label>
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
                    placeholder="기획서 정책 명시, 디자인 가이드 일관성, 마크업 구현 정확도 등 협업에 도움이 된 점을 남겨주세요."
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
                    placeholder="다음 프로젝트에서 더 원활한 인수인계를 위해 바라는 점이 있다면 남겨주세요."
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

      {/* 6-C. 관리자(최범열) 최종 평가 등급 확정 모달 */}
      {actionModal.type === 'admin_eval' &&
        actionModal.kpi &&
        (() => {
          const targetKpi = actionModal.kpi;
          const modalLinkedTasks = getLinkedTasksForKpi(targetKpi);
          const modalDoneTasks = modalLinkedTasks.filter((t) => t.status === 'done').length;
          const modalSelfScore =
            typeof targetKpi.selfScore === 'number' && !Number.isNaN(targetKpi.selfScore)
              ? targetKpi.selfScore
              : null;
          const modalSelfGrade = resolveSelfGrade(modalSelfScore);
          const modalPeerReviews = targetKpi.peerReviews || [];
          const modalPeerCount = modalPeerReviews.length;
          const modalPeerAvg5 =
            modalPeerCount > 0
              ? targetKpi.peerAvgScore ??
                Number(
                  (
                    modalPeerReviews.reduce(
                      (acc, r) =>
                        acc + (Number(r.scoreQuality || 5) + Number(r.scoreCollaboration || 5)) / 2,
                      0
                    ) / modalPeerCount
                  ).toFixed(1)
                )
              : null;
          const modalPeerScore100 =
            modalPeerAvg5 !== null ? Math.round((modalPeerAvg5 / 5) * 100) : null;

          // 다각도 참고 산출 점수 (본인 자가진단 70% + 다면 협업 피드백 환산 30%)
          const referenceScore =
            modalSelfScore !== null && modalPeerScore100 !== null
              ? Math.round((modalSelfScore * 0.7 + modalPeerScore100 * 0.3) * 10) / 10
              : modalSelfScore !== null
              ? modalSelfScore
              : modalPeerScore100 !== null
              ? modalPeerScore100
              : 90;
          const recommendedGrade = resolveSelfGrade(referenceScore) || 'A';

          const selectedRubric =
            GRADE_RUBRIC.find((r) => r.grade === adminEvalForm.grade) || GRADE_RUBRIC[1];
          const selectedWeightedPoint =
            Math.round(((selectedRubric.score * Number(targetKpi.weight || 0)) / 100) * 10) / 10;

          return (
            <div
              className="modal-overlay"
              onClick={() => setActionModal({ type: null, kpi: null })}
            >
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">관리자 최종 등급 및 평가 확정</h3>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null, kpi: null })}
                    className="tasks-modal-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveAdminEval} className="tasks-modal-form">
                  <div className="modal-body">
                    <div className="kpi-modal-target-summary">
                      <strong>
                        [{targetKpi.ownerName}] {targetKpi.title} (가중치 {targetKpi.weight}%)
                      </strong>
                      <span>완료 기준(DoD): {targetKpi.targetValue}</span>
                      {targetKpi.selfEvaluation && (
                        <span>본인 자가평가 의견: {targetKpi.selfEvaluation}</span>
                      )}
                    </div>

                    {/* 다각도 종합 산출 가이드 박스 */}
                    <div className="kpi-admin-calc-box">
                      <div className="kpi-admin-calc-header">
                        <span className="kpi-admin-calc-title">
                          다각도 평가 산출 참고 지표 (업적 · 동료 다면피드백 종합)
                        </span>
                        {adminEvalForm.grade !== recommendedGrade && (
                          <button
                            type="button"
                            onClick={() =>
                              setAdminEvalForm((prev) => ({
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
                            추천 {recommendedGrade}등급 적용
                          </button>
                        )}
                      </div>

                      <div className="kpi-admin-calc-grid">
                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">실무 수행 근거</span>
                          <strong className="kpi-admin-calc-value">
                            완료 {modalDoneTasks} / {modalLinkedTasks.length}건
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">본인 자가진단</span>
                          <strong className="kpi-admin-calc-value">
                            {modalSelfGrade
                              ? `${modalSelfGrade}등급 (${modalSelfScore}점)`
                              : '미입력'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item">
                          <span className="kpi-admin-calc-label">동료 피드백 환산</span>
                          <strong className="kpi-admin-calc-value">
                            {modalPeerAvg5 !== null
                              ? `${modalPeerAvg5}/5.0 (환산 ${modalPeerScore100}점)`
                              : '미참여'}
                          </strong>
                        </div>

                        <div className="kpi-admin-calc-item is-recommend">
                          <span className="kpi-admin-calc-label">산출 추천 등급</span>
                          <strong className="kpi-admin-calc-value is-accent">
                            {recommendedGrade}등급 (참고 {referenceScore}점)
                          </strong>
                        </div>
                      </div>

                      <div className="kpi-admin-weighted-preview">
                        <span>
                          선택 등급(<strong>{adminEvalForm.grade}등급 · {selectedRubric.score}점</strong>) 확정 시 가중치 반영 득점:
                        </span>
                        <strong>
                          {selectedWeightedPoint}점 / {targetKpi.weight}점 만점
                        </strong>
                      </div>
                    </div>

                    <div className="tasks-form-grid-2">
                      <div className="form-group">
                        <label className="form-label">최종 평가 등급 (루브릭 기준) *</label>
                        <select
                          value={adminEvalForm.grade}
                          onChange={(e) => {
                            const g = e.target.value as KpiGrade;
                            setAdminEvalForm({
                              ...adminEvalForm,
                              grade: g,
                              status:
                                g === 'S' || g === 'A'
                                  ? 'achieved'
                                  : g === 'B'
                                  ? 'partially_achieved'
                                  : 'missed',
                            });
                          }}
                          className="form-select"
                        >
                          {GRADE_RUBRIC.map((r) => (
                            <option key={r.grade} value={r.grade}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">달성 결과 상태</label>
                        <select
                          value={adminEvalForm.status}
                          onChange={(e) =>
                            setAdminEvalForm({
                              ...adminEvalForm,
                              status: e.target.value as KpiStatus,
                            })
                          }
                          className="form-select"
                        >
                          <option value="achieved">목표 달성</option>
                          <option value="partially_achieved">부분 달성</option>
                          <option value="missed">미달성 · 보완</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">최종 평가 총평 (근거 기반 피드백) *</label>
                      <textarea
                        rows={4}
                        required
                        placeholder="일정 준수(30%), 산출물 무결성(40%), 서비스/협업 기여(30%) 기준에 따른 최종 평가 의견을 작성해 주세요."
                        value={adminEvalForm.comment}
                        onChange={(e) =>
                          setAdminEvalForm({ ...adminEvalForm, comment: e.target.value })
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
                      최종 평가 확정
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
