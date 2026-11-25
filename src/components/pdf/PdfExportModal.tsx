import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { PolicyDomain, User } from '../../types';
import { resolveKpiAccessRole } from '../../constants/departments';
import type { KpiModeTab } from '../kpi/kpiShared';
import { OverviewView } from '../OverviewView';
import { TasksView } from '../TasksView';
import { VacationsView } from '../VacationsView';
import { KpiView } from '../KpiView';
import { WorkInfoView } from '../WorkInfoView';
import { OnboardingView } from '../OnboardingView';
import { PolicyView } from '../PolicyView';
import { AuditLogsView } from '../AuditLogsView';
import {
  Compass,
  CheckSquare,
  Calendar,
  Target,
  BookOpen,
  UserPlus,
  BookMarked,
  ShieldAlert,
  FileDown,
  Check,
  Minus,
  Loader2,
  X,
  FileText,
  RectangleVertical,
  RectangleHorizontal,
} from 'lucide-react';

export type PdfNavTab =
  | 'overview'
  | 'tasks'
  | 'vacations'
  | 'kpi'
  | 'work_info'
  | 'onboarding'
  | 'policy'
  | 'audit';

type PdfOrientation = 'portrait' | 'landscape';

interface PdfSubOption {
  id: string;
  label: string;
  defaultChecked: boolean;
}

interface PdfMenuGroup {
  key: PdfNavTab;
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  options: PdfSubOption[];
}

interface PdfCaptureJob {
  jobId: string;
  menuKey: PdfNavTab;
  menuTitle: string;
  subLabel?: string;
  overviewPillarIds?: number[];
  tasksViewMode?: 'kanban' | 'list';
  kpiModeTab?: KpiModeTab;
  policyDomain?: PolicyDomain;
  auditSubTab?: 'permissions' | 'logs';
}

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isViewer: boolean;
  activeTab: PdfNavTab;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const POLICY_DOMAIN_OPTIONS: { domain: PolicyDomain; label: string }[] = [
  { domain: 'product', label: '상품' },
  { domain: 'member', label: '회원' },
  { domain: 'order', label: '주문' },
  { domain: 'display', label: '전시' },
  { domain: 'claim', label: '클레임' },
  { domain: 'search', label: '검색' },
  { domain: 'common', label: '공통' },
];

function buildMenuGroups(currentUser: User): PdfMenuGroup[] {
  const kpiRole = resolveKpiAccessRole(currentUser);
  const isCrossDept = kpiRole === 'cross_dept';
  const isDivisionOrExec = kpiRole === 'division_head' || kpiRole === 'executive_viewer';

  const kpiOptions: PdfSubOption[] = isCrossDept
    ? [{ id: 'kpi:peer_feedback', label: '협업 다면평가 (무기명)', defaultChecked: true }]
    : isDivisionOrExec
    ? [{ id: 'kpi:evaluation', label: '소속 구성원 KPI 평가 현황', defaultChecked: true }]
    : [
        {
          id: 'kpi:evaluation',
          label: kpiRole === 'team_member' ? '내 KPI 목표 · 평가' : '소속 구성원 KPI 평가',
          defaultChecked: true,
        },
        { id: 'kpi:peer_feedback', label: '협업 다면평가 (무기명)', defaultChecked: true },
      ];

  return [
    {
      key: 'overview',
      title: '서비스기획팀 안내',
      icon: Compass,
      options: [
        { id: 'overview:0', label: '01. 시선닷컴 UI/UX 전면 개편', defaultChecked: true },
        { id: 'overview:1', label: '02. 어드민(백오피스) 운영 효율화', defaultChecked: true },
        { id: 'overview:2', label: '03. 이커머스 정책 & 프로세스 정의', defaultChecked: true },
      ],
    },
    {
      key: 'tasks',
      title: '서비스기획 업무 관리',
      icon: CheckSquare,
      options: [
        { id: 'tasks:kanban', label: '파트별 칸반 보드 뷰', defaultChecked: true },
        { id: 'tasks:list', label: '전체 업무 리스트 뷰', defaultChecked: false },
      ],
    },
    {
      key: 'vacations',
      title: '팀 통합 일정',
      icon: Calendar,
      options: [{ id: 'vacations:main', label: '월간 통합 캘린더 및 일정·휴가 현황', defaultChecked: true }],
    },
    {
      key: 'kpi',
      title: 'KPI 목표 및 평가',
      icon: Target,
      options: kpiOptions,
    },
    {
      key: 'work_info',
      title: '업무 관련 정보',
      icon: BookOpen,
      options: [{ id: 'work_info:main', label: '전체 섹션 통합 목록', defaultChecked: true }],
    },
    {
      key: 'onboarding',
      title: '신규 입사자 온보딩',
      icon: UserPlus,
      options: [{ id: 'onboarding:main', label: '전 주차 온보딩 체크리스트', defaultChecked: true }],
    },
    {
      key: 'policy',
      title: '시선닷컴 정책서',
      icon: BookMarked,
      options: POLICY_DOMAIN_OPTIONS.map((d) => ({
        id: `policy:${d.domain}`,
        label: `${d.label} 도메인`,
        defaultChecked: true,
      })),
    },
    {
      key: 'audit',
      title: '권한 설정 및 감사 로그',
      icon: ShieldAlert,
      options: [
        { id: 'audit:permissions', label: '권한 · 직책 설정 현황', defaultChecked: true },
        { id: 'audit:logs', label: '시스템 감사 로그', defaultChecked: true },
      ],
    },
  ];
}

function resolveCurrentScreenOptionIds(
  activeTab: PdfNavTab,
  groups: PdfMenuGroup[]
): Set<string> {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '')
    .replace(/^#\/?/, '')
    .toLowerCase()
    .trim();

  const group = groups.find((g) => g.key === activeTab);
  if (!group) return new Set();

  if (activeTab === 'policy') {
    const match = hash.match(/^polic(?:y|ies)\/([a-z]+)/);
    const domain = match?.[1] || 'product';
    const matchedOpt = group.options.find((o) => o.id === `policy:${domain}`);
    return new Set([matchedOpt ? matchedOpt.id : group.options[0].id]);
  }

  if (activeTab === 'audit') {
    const isLogs = hash === 'audit/logs' || hash === 'logs';
    const targetId = isLogs ? 'audit:logs' : 'audit:permissions';
    const matchedOpt = group.options.find((o) => o.id === targetId);
    return new Set([matchedOpt ? matchedOpt.id : group.options[0].id]);
  }

  if (activeTab === 'kpi') {
    const isPeer = hash.startsWith('kpi/peer');
    const targetId = isPeer ? 'kpi:peer_feedback' : 'kpi:evaluation';
    const matchedOpt = group.options.find((o) => o.id === targetId);
    return new Set([matchedOpt ? matchedOpt.id : group.options[0].id]);
  }

  if (activeTab === 'tasks') {
    return new Set(['tasks:kanban']);
  }

  return new Set(group.options.map((o) => o.id));
}

function formatExportTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function formatExportFileDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function waitAnimationFrames(ms = 180): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, ms);
      });
    });
  });
}

interface AtomicBox {
  top: number;
  bottom: number;
}

const ATOMIC_BLOCK_SELECTOR = [
  '.pillar-step-card',
  '.sprint-step-card',
  '.tasks-kanban-card',
  '.tasks-list-table tbody tr',
  '.schedule-week-row',
  '.schedule-list-row',
  '.kpi-cycle-schedule-card',
  '.kpi-eval-card',
  '.kpi-peer-card',
  '.winfo-table tbody tr',
  '.onb-item-row',
  '.policy-item-header',
  '.policy-rules-table tbody tr',
  '.audit-table tbody tr',
].join(', ');

function collectSafeBreakBoxes(stageEl: HTMLElement, maxPageCssHeight: number): AtomicBox[] {
  const stageRect = stageEl.getBoundingClientRect();
  const nodes = stageEl.querySelectorAll<HTMLElement>(ATOMIC_BLOCK_SELECTOR);
  const boxes: AtomicBox[] = [];

  nodes.forEach((node) => {
    const r = node.getBoundingClientRect();
    const h = r.height;
    if (h > 14 && h < maxPageCssHeight * 0.78) {
      boxes.push({
        top: r.top - stageRect.top,
        bottom: r.bottom - stageRect.top,
      });
    }
  });

  return boxes.sort((a, b) => a.top - b.top);
}

function computePageSlicesCss(
  totalCssHeight: number,
  maxPageCssHeight: number,
  boxes: AtomicBox[]
): Array<[number, number]> {
  const slices: Array<[number, number]> = [];
  let cursor = 0;
  const minSliceHeight = maxPageCssHeight * 0.45;

  while (cursor < totalCssHeight - 4) {
    const remaining = totalCssHeight - cursor;
    if (remaining <= maxPageCssHeight + 8) {
      slices.push([cursor, totalCssHeight]);
      break;
    }

    let cut = cursor + maxPageCssHeight;
    for (let pass = 0; pass < 3; pass += 1) {
      const straddling = boxes.filter((b) => b.top + 3 < cut && b.bottom - 3 > cut);
      if (straddling.length === 0) break;
      const earliestTop = Math.min(...straddling.map((b) => b.top));
      const candidate = earliestTop - 6;
      if (candidate >= cursor + minSliceHeight) {
        cut = candidate;
      } else {
        break;
      }
    }

    if (cut <= cursor + 20) {
      cut = cursor + maxPageCssHeight;
    }

    slices.push([cursor, cut]);
    cursor = cut;
  }

  return slices.length > 0 ? slices : [[0, totalCssHeight]];
}

function warmCharacterSpriteCache(): Promise<void> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}images/characters/`;
  const files = [
    'character-1-planner.png',
    'character-2-designer.png',
    'character-3-publisher.png',
    'planner-think-1.png',
    'planner-sketch-1.png',
    'designer-work-1.png',
    'publisher-code-1.png',
  ];
  return Promise.all(
    files.map(
      (file) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = `${prefix}${file}`;
        })
    )
  ).then(() => undefined);
}

const noopToast = () => {};

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isViewer,
  activeTab,
  onShowToast,
}) => {
  const menuGroups = useMemo(() => buildMenuGroups(currentUser), [currentUser]);

  const allOptionIds = useMemo(() => {
    const list: string[] = [];
    menuGroups.forEach((g) => g.options.forEach((o) => list.push(o.id)));
    return list;
  }, [menuGroups]);

  const defaultSelectedIds = useMemo(() => {
    const set = new Set<string>();
    menuGroups.forEach((g) => {
      g.options.forEach((o) => {
        if (o.defaultChecked) set.add(o.id);
      });
    });
    return set;
  }, [menuGroups]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(defaultSelectedIds));
  const [orientation, setOrientation] = useState<PdfOrientation>('portrait');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressIndex, setProgressIndex] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [activeCaptureJob, setActiveCaptureJob] = useState<PdfCaptureJob | null>(null);
  const [exportTimestampLabel, setExportTimestampLabel] = useState<string>('');

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cancelRequestedRef = useRef<boolean>(false);
  const jobRenderReadyResolveRef = useRef<(() => void) | null>(null);

  // 현재 캡처 작업이 DOM에 마운트·업데이트되면 대기 프라미스 해제
  useEffect(() => {
    if (activeCaptureJob && jobRenderReadyResolveRef.current) {
      const resolve = jobRenderReadyResolveRef.current;
      jobRenderReadyResolveRef.current = null;
      resolve();
    }
  }, [activeCaptureJob]);

  // 선택된 옵션으로부터 실제 순차 캡처할 Job 배열 산출
  const plannedJobs = useMemo<PdfCaptureJob[]>(() => {
    const jobs: PdfCaptureJob[] = [];

    menuGroups.forEach((group) => {
      const checkedOpts = group.options.filter((o) => selectedIds.has(o.id));
      if (checkedOpts.length === 0) return;

      if (group.key === 'overview') {
        const pillarIds = checkedOpts
          .map((o) => Number(o.id.split(':')[1]))
          .filter((n) => !Number.isNaN(n));
        const subLabel =
          pillarIds.length === group.options.length
            ? '3대 핵심 업무 전체'
            : checkedOpts.map((o) => o.label.split('.')[0]).join(', ');
        jobs.push({
          jobId: `overview-${pillarIds.join('-')}`,
          menuKey: 'overview',
          menuTitle: group.title,
          subLabel,
          overviewPillarIds: pillarIds,
        });
        return;
      }

      if (group.key === 'tasks') {
        checkedOpts.forEach((opt) => {
          const mode = opt.id === 'tasks:list' ? 'list' : 'kanban';
          jobs.push({
            jobId: opt.id,
            menuKey: 'tasks',
            menuTitle: group.title,
            subLabel: opt.label,
            tasksViewMode: mode,
          });
        });
        return;
      }

      if (group.key === 'vacations') {
        jobs.push({
          jobId: 'vacations:main',
          menuKey: 'vacations',
          menuTitle: group.title,
        });
        return;
      }

      if (group.key === 'kpi') {
        checkedOpts.forEach((opt) => {
          const modeTab: KpiModeTab =
            opt.id === 'kpi:peer_feedback' ? 'peer_feedback' : 'evaluation';
          jobs.push({
            jobId: opt.id,
            menuKey: 'kpi',
            menuTitle: group.title,
            subLabel: opt.label,
            kpiModeTab: modeTab,
          });
        });
        return;
      }

      if (group.key === 'work_info') {
        jobs.push({
          jobId: 'work_info:main',
          menuKey: 'work_info',
          menuTitle: group.title,
        });
        return;
      }

      if (group.key === 'onboarding') {
        jobs.push({
          jobId: 'onboarding:main',
          menuKey: 'onboarding',
          menuTitle: group.title,
        });
        return;
      }

      if (group.key === 'policy') {
        checkedOpts.forEach((opt) => {
          const domain = opt.id.split(':')[1] as PolicyDomain;
          jobs.push({
            jobId: opt.id,
            menuKey: 'policy',
            menuTitle: group.title,
            subLabel: opt.label,
            policyDomain: domain,
          });
        });
        return;
      }

      if (group.key === 'audit') {
        checkedOpts.forEach((opt) => {
          const subTab = opt.id === 'audit:logs' ? 'logs' : 'permissions';
          jobs.push({
            jobId: opt.id,
            menuKey: 'audit',
            menuTitle: group.title,
            subLabel: opt.label,
            auditSubTab: subTab,
          });
        });
      }
    });

    return jobs;
  }, [menuGroups, selectedIds]);

  const selectedMenuCount = useMemo(() => {
    return menuGroups.filter((g) => g.options.some((o) => selectedIds.has(o.id))).length;
  }, [menuGroups, selectedIds]);

  const toggleSubOption = (optId: string) => {
    if (isGenerating) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) {
        next.delete(optId);
      } else {
        next.add(optId);
      }
      return next;
    });
  };

  const toggleMenuGroup = (group: PdfMenuGroup) => {
    if (isGenerating) return;
    const groupIds = group.options.map((o) => o.id);
    const allChecked = groupIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isGenerating) return;
    setSelectedIds(new Set(allOptionIds));
  };

  const handleSelectDefaultMenus = () => {
    if (isGenerating) return;
    setSelectedIds(new Set(defaultSelectedIds));
  };

  const handleSelectCurrentOnly = () => {
    if (isGenerating) return;
    setSelectedIds(resolveCurrentScreenOptionIds(activeTab, menuGroups));
  };

  const handleClearAll = () => {
    if (isGenerating) return;
    setSelectedIds(new Set());
  };

  const waitForNextJobCommit = useCallback((job: PdfCaptureJob): Promise<void> => {
    return new Promise((resolve) => {
      jobRenderReadyResolveRef.current = resolve;
      setActiveCaptureJob(job);
    });
  }, []);

  const handleCancelGeneration = () => {
    cancelRequestedRef.current = true;
  };

  const handleCloseModal = () => {
    if (isGenerating) {
      cancelRequestedRef.current = true;
      return;
    }
    onClose();
  };

  const handleStartPdfDownload = async () => {
    if (isGenerating) return;
    if (plannedJobs.length === 0) {
      onShowToast('PDF로 내려받을 화면을 최소 1개 이상 선택해 주세요.', 'error');
      return;
    }

    const now = new Date();
    const timestampStr = formatExportTimestamp(now);
    const fileDateStr = formatExportFileDate(now);

    cancelRequestedRef.current = false;
    setExportTimestampLabel(timestampStr);
    setIsGenerating(true);
    setProgressIndex(0);
    setProgressTotal(plannedJobs.length);
    setProgressLabel('웹 폰트 및 리소스 준비 중...');

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
      }

      if (plannedJobs.some((j) => j.menuKey === 'overview')) {
        await warmCharacterSpriteCache();
      }

      const pageWidthMm = orientation === 'portrait' ? 210 : 297;
      const pageHeightMm = orientation === 'portrait' ? 297 : 210;
      const marginX = 8;
      const marginTop = 8;
      const marginBottom = 11;
      const contentWidthMm = pageWidthMm - marginX * 2;
      const contentHeightMm = pageHeightMm - marginTop - marginBottom;

      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      let addedPageCount = 0;

      for (let i = 0; i < plannedJobs.length; i += 1) {
        if (cancelRequestedRef.current) {
          throw new Error('__USER_CANCELLED__');
        }

        const job = plannedJobs[i];
        const stepTitle = job.subLabel
          ? `${job.menuTitle} (${job.subLabel})`
          : job.menuTitle;

        setProgressIndex(i + 1);
        setProgressLabel(`${stepTitle} 화면 렌더링 및 변환 중...`);

        await waitForNextJobCommit(job);
        await waitAnimationFrames(job.menuKey === 'overview' ? 240 : 170);

        if (cancelRequestedRef.current) {
          throw new Error('__USER_CANCELLED__');
        }

        const stageEl = stageRef.current;
        if (!stageEl) {
          throw new Error('PDF 렌더링 스테이지를 찾을 수 없습니다.');
        }

        const liveHeightGuess = Math.max(1, stageEl.scrollHeight);
        // 브라우저 캔버스 최대 높이 한계(32,767px) 초과 방지 안전 배율 산출
        const safeScale = Math.min(
          2,
          Math.max(1.2, Math.floor((26000 / liveHeightGuess) * 10) / 10)
        );

        let measuredCssWidth = 1320;
        let measuredCssHeight = liveHeightGuess;
        let measuredBoxes: AtomicBox[] = [];

        const fullCanvas = await html2canvas(stageEl, {
          scale: safeScale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#f8fafc',
          logging: false,
          windowWidth: 1360,
          scrollX: 0,
          scrollY: 0,
          onclone: (_clonedDoc, clonedStageEl) => {
            const parentViewport = clonedStageEl.parentElement;
            if (parentViewport) {
              parentViewport.classList.add('is-pdf-cloning');
            }
            measuredCssWidth = Math.max(1, clonedStageEl.offsetWidth || 1320);
            measuredCssHeight = Math.max(1, clonedStageEl.scrollHeight);
            const cloneMaxPageCssH =
              measuredCssWidth * (contentHeightMm / contentWidthMm);
            measuredBoxes = collectSafeBreakBoxes(clonedStageEl, cloneMaxPageCssH);
          },
        });

        const maxPageCssHeight = measuredCssWidth * (contentHeightMm / contentWidthMm);
        const slicesCss = computePageSlicesCss(
          measuredCssHeight,
          maxPageCssHeight,
          measuredBoxes
        );

        const scaleRatio = fullCanvas.width / measuredCssWidth;

        for (let sIdx = 0; sIdx < slicesCss.length; sIdx += 1) {
          if (cancelRequestedRef.current) {
            throw new Error('__USER_CANCELLED__');
          }

          const [yStartCss, yEndCss] = slicesCss[sIdx];
          const srcY = Math.max(0, Math.round(yStartCss * scaleRatio));
          const srcH = Math.max(
            1,
            Math.min(
              fullCanvas.height - srcY,
              Math.round((yEndCss - yStartCss) * scaleRatio)
            )
          );

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = fullCanvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) {
            throw new Error('캔버스 컨텍스트를 초기화할 수 없습니다.');
          }
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            fullCanvas,
            0,
            srcY,
            fullCanvas.width,
            srcH,
            0,
            0,
            fullCanvas.width,
            srcH
          );

          const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
          const sliceHeightMm = Math.min(
            contentHeightMm,
            (srcH / fullCanvas.width) * contentWidthMm
          );

          if (addedPageCount > 0) {
            pdf.addPage();
          }
          pdf.addImage(
            imgData,
            'JPEG',
            marginX,
            marginTop,
            contentWidthMm,
            sliceHeightMm,
            undefined,
            'FAST'
          );
          addedPageCount += 1;

          // 메모리 즉시 반환 보조
          sliceCanvas.width = 1;
          sliceCanvas.height = 1;
        }

        fullCanvas.width = 1;
        fullCanvas.height = 1;
      }

      // 전 페이지 하단 중앙 페이지 번호 표기 (ASCII 전용)
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p <= totalPages; p += 1) {
        pdf.setPage(p);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${p} / ${totalPages}`, pageWidthMm / 2, pageHeightMm - 4.2, {
          align: 'center',
        });
      }

      const singleMenuTitle =
        selectedMenuCount === 1
          ? menuGroups
              .find((g) => g.options.some((o) => selectedIds.has(o.id)))
              ?.title.replace(/\s+/g, '_')
          : null;

      const fileName = singleMenuTitle
        ? `서비스기획팀_업무포털_${singleMenuTitle}_${fileDateStr}.pdf`
        : `서비스기획팀_업무포털_통합문서_${fileDateStr}.pdf`;

      pdf.save(fileName);

      setActiveCaptureJob(null);
      setIsGenerating(false);
      onClose();
      onShowToast(
        `선택하신 ${plannedJobs.length}개 화면(총 ${totalPages}페이지)이 PDF로 다운로드되었습니다.`,
        'success'
      );
    } catch (err) {
      setActiveCaptureJob(null);
      setIsGenerating(false);
      if (err instanceof Error && err.message === '__USER_CANCELLED__') {
        onShowToast('PDF 다운로드 생성이 중단되었습니다.', 'info');
        return;
      }
      onShowToast(
        err instanceof Error
          ? `PDF 생성 중 오류가 발생했습니다: ${err.message}`
          : 'PDF 생성 중 예기치 못한 오류가 발생했습니다.',
        'error'
      );
    }
  };

  if (!isOpen) return null;

  const isAllChecked =
    allOptionIds.length > 0 && allOptionIds.every((id) => selectedIds.has(id));

  return (
    <>
      <div className="modal-overlay pdf-modal-overlay" onClick={handleCloseModal}>
        <div
          className="modal-box pdf-export-modal-box"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-export-modal-title"
        >
          {/* 모달 헤더 */}
          <div className="modal-header pdf-modal-header">
            <div className="pdf-modal-title-group">
              <span className="pdf-modal-icon-badge">
                <FileDown size={18} />
              </span>
              <div>
                <h3 id="pdf-export-modal-title" className="modal-title">
                  포털 화면 PDF 다운로드
                </h3>
                <p className="pdf-modal-subtitle">
                  다운로드할 메뉴와 세부 탭을 선택하면 하나의 PDF 파일로 병합하여 저장합니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="tasks-modal-close-btn"
              aria-label="모달 닫기"
              title={isGenerating ? '생성 중단' : '닫기'}
            >
              <X size={20} />
            </button>
          </div>

          {/* 모달 본문 */}
          <div className="modal-body pdf-modal-body">
            {/* 상단 퀵 선택 바 + 용지 방향 스위치 */}
            <div className="pdf-toolbar-row">
              <div className="pdf-quick-btns">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleSelectDefaultMenus}
                  className="btn btn-secondary pdf-quick-btn"
                >
                  8개 메뉴 기본 선택
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleSelectAll}
                  className={`btn btn-secondary pdf-quick-btn ${isAllChecked ? 'is-active' : ''}`}
                >
                  세부 탭 전체 선택
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleSelectCurrentOnly}
                  className="btn btn-secondary pdf-quick-btn"
                >
                  현재 화면만
                </button>
                <button
                  type="button"
                  disabled={isGenerating || selectedIds.size === 0}
                  onClick={handleClearAll}
                  className="btn btn-secondary pdf-quick-btn"
                >
                  전체 해제
                </button>
              </div>

              <div className="pdf-orientation-switch" role="group" aria-label="PDF 용지 방향">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setOrientation('portrait')}
                  className={`pdf-orient-btn ${orientation === 'portrait' ? 'active' : ''}`}
                >
                  <RectangleVertical size={15} />
                  <span>A4 세로</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setOrientation('landscape')}
                  className={`pdf-orient-btn ${orientation === 'landscape' ? 'active' : ''}`}
                >
                  <RectangleHorizontal size={15} />
                  <span>A4 가로</span>
                </button>
              </div>
            </div>

            {/* 8개 메뉴 및 하위 탭 체크박스 리스트 */}
            <div className="pdf-menu-list">
              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                const checkedCount = group.options.filter((o) => selectedIds.has(o.id)).length;
                const totalCount = group.options.length;
                const isGroupAll = checkedCount === totalCount && totalCount > 0;
                const isGroupPartial = checkedCount > 0 && checkedCount < totalCount;
                const hasMultipleSubTabs = totalCount > 1;

                return (
                  <div
                    key={group.key}
                    className={`pdf-menu-card ${checkedCount > 0 ? 'is-selected' : ''}`}
                  >
                    <div className="pdf-menu-card-top">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => toggleMenuGroup(group)}
                        className="pdf-menu-toggle-row"
                        aria-pressed={isGroupAll}
                      >
                        <span
                          className={`pdf-checkbox-box ${
                            isGroupAll ? 'is-checked' : isGroupPartial ? 'is-partial' : ''
                          }`}
                        >
                          {isGroupAll && <Check size={14} strokeWidth={3} />}
                          {isGroupPartial && <Minus size={14} strokeWidth={3} />}
                        </span>
                        <span className="pdf-menu-icon-wrap">
                          <GroupIcon size={17} />
                        </span>
                        <span className="pdf-menu-title">{group.title}</span>
                        {activeTab === group.key && (
                          <span className="pdf-current-tab-pill">현재 화면</span>
                        )}
                      </button>

                      <span className="pdf-menu-count-badge">
                        {hasMultipleSubTabs
                          ? `${checkedCount} / ${totalCount}개 탭`
                          : checkedCount > 0
                          ? '포함됨'
                          : '미포함'}
                      </span>
                    </div>

                    {hasMultipleSubTabs && (
                      <div className="pdf-suboptions-grid">
                        {group.options.map((opt) => {
                          const isOptChecked = selectedIds.has(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={isGenerating}
                              onClick={() => toggleSubOption(opt.id)}
                              className={`pdf-suboption-chip ${isOptChecked ? 'is-checked' : ''}`}
                              aria-pressed={isOptChecked}
                            >
                              <span
                                className={`pdf-sub-checkbox ${isOptChecked ? 'is-checked' : ''}`}
                              >
                                {isOptChecked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <span className="pdf-suboption-label">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PDF 변환 진행 상태 패널 */}
            {isGenerating && (
              <div className="pdf-progress-panel" role="status" aria-live="polite">
                <div className="pdf-progress-top">
                  <div className="pdf-progress-title-wrap">
                    <Loader2 size={16} className="spin-icon pdf-progress-spinner" />
                    <span className="pdf-progress-text">{progressLabel}</span>
                  </div>
                  <span className="pdf-progress-counter">
                    {progressIndex} / {progressTotal} 화면
                  </span>
                </div>
                <progress
                  className="pdf-progress-bar"
                  value={progressIndex}
                  max={Math.max(1, progressTotal)}
                />
              </div>
            )}
          </div>

          {/* 모달 푸터 */}
          <div className="modal-footer pdf-modal-footer">
            <div className="pdf-footer-summary">
              <FileText size={16} className="pdf-footer-summary-icon" />
              <span>
                선택된 메뉴 <strong>{selectedMenuCount}개</strong> · 출력 섹션{' '}
                <strong>{plannedJobs.length}건</strong>
              </span>
            </div>

            <div className="pdf-footer-actions">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleCancelGeneration}
                  className="btn btn-secondary"
                >
                  변환 중단
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  취소
                </button>
              )}

              <button
                type="button"
                disabled={isGenerating || plannedJobs.length === 0}
                onClick={handleStartPdfDownload}
                className="btn btn-primary pdf-submit-btn"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>PDF 생성 중...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    <span>선택 화면 PDF 다운로드 ({plannedJobs.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 오프스크린 데스크톱 규격 PDF 캡처 전용 스테이지 */}
      {isGenerating &&
        activeCaptureJob &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="pdf-capture-stage-viewport" aria-hidden="true">
            <div ref={stageRef} className="pdf-capture-sheet">
              <header className="pdf-sheet-header">
                <div className="pdf-sheet-header-left">
                  <span className="pdf-sheet-brand">서비스기획팀 업무포털</span>
                  <span className="pdf-sheet-divider">|</span>
                  <h2 className="pdf-sheet-title">{activeCaptureJob.menuTitle}</h2>
                  {activeCaptureJob.subLabel && (
                    <span className="pdf-sheet-subpill">{activeCaptureJob.subLabel}</span>
                  )}
                </div>
                <div className="pdf-sheet-header-right">
                  <span>
                    출력자: <strong>{currentUser.name}</strong> ({currentUser.department})
                  </span>
                  <span className="pdf-sheet-divider">·</span>
                  <span>출력 기준: {exportTimestampLabel}</span>
                </div>
              </header>

              <div className="pdf-sheet-content" key={activeCaptureJob.jobId}>
                {activeCaptureJob.menuKey === 'overview' && (
                  <OverviewView
                    pdfSelectedPillarIds={activeCaptureJob.overviewPillarIds}
                    isPdfExport={true}
                  />
                )}
                {activeCaptureJob.menuKey === 'tasks' && (
                  <TasksView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                    pdfForceViewMode={activeCaptureJob.tasksViewMode}
                    isPdfExport={true}
                  />
                )}
                {activeCaptureJob.menuKey === 'vacations' && (
                  <VacationsView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                  />
                )}
                {activeCaptureJob.menuKey === 'kpi' && (
                  <KpiView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                    pdfForceModeTab={activeCaptureJob.kpiModeTab}
                    isPdfExport={true}
                  />
                )}
                {activeCaptureJob.menuKey === 'work_info' && (
                  <WorkInfoView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                  />
                )}
                {activeCaptureJob.menuKey === 'onboarding' && (
                  <OnboardingView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                  />
                )}
                {activeCaptureJob.menuKey === 'policy' && (
                  <PolicyView
                    currentUser={currentUser}
                    isViewer={isViewer}
                    onShowToast={noopToast}
                    pdfForceDomain={activeCaptureJob.policyDomain}
                    isPdfExport={true}
                  />
                )}
                {activeCaptureJob.menuKey === 'audit' && (
                  <AuditLogsView
                    currentUser={currentUser}
                    onShowToast={noopToast}
                    pdfForceSubTab={activeCaptureJob.auditSubTab}
                    isPdfExport={true}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
